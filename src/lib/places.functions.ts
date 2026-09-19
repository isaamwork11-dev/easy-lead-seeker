import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Lead, SearchResult } from "./leads.types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.primaryTypeDisplayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.rating",
  "places.userRatingCount",
  "nextPageToken",
].join(",");

const searchSchema = z.object({
  keyword: z.string().trim().min(2).max(80),
  location: z.string().trim().min(2).max(120),
  radiusKm: z.number().min(1).max(50).optional(),
  pageToken: z.string().max(2000).optional(),
});

interface GooglePlace {
  id: string;
  displayName?: { text?: string };
  primaryTypeDisplayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
}

function toLead(p: GooglePlace): Lead {
  const website = (p.websiteUri ?? "").trim();
  return {
    placeId: p.id,
    businessName: p.displayName?.text ?? "Unknown business",
    category: p.primaryTypeDisplayName?.text ?? "",
    address: p.formattedAddress ?? "",
    phone: p.nationalPhoneNumber ?? p.internationalPhoneNumber ?? "",
    website,
    mapsUrl: p.googleMapsUri ?? `https://www.google.com/maps/place/?q=place_id:${p.id}`,
    rating: typeof p.rating === "number" ? p.rating : null,
    reviewCount: p.userRatingCount ?? 0,
    hasWebsite: website.length > 0,
    leadStatus: "New",
  };
}

export const searchBusinesses = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => searchSchema.parse(input))
  .handler(async ({ data }): Promise<SearchResult> => {
    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps is not connected yet. Please connect it in the project settings.");
    }

    const body: Record<string, unknown> = {
      textQuery: `${data.keyword} in ${data.location}`,
      pageSize: 20,
    };
    if (data.pageToken) body["pageToken"] = data.pageToken;

    // Optional radius: geocode the location, then bias results to a circle.
    if (data.radiusKm && !data.pageToken) {
      try {
        const geo = await fetch(
          `${GATEWAY_URL}/maps/api/geocode/json?address=${encodeURIComponent(data.location)}`,
          {
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
            },
          },
        );
        if (geo.ok) {
          const json = (await geo.json()) as {
            results?: { geometry?: { location?: { lat: number; lng: number } } }[];
          };
          const loc = json.results?.[0]?.geometry?.location;
          if (loc) {
            body["locationBias"] = {
              circle: {
                center: { latitude: loc.lat, longitude: loc.lng },
                radius: data.radiusKm * 1000,
              },
            };
          }
        }
      } catch (e) {
        console.warn("Geocoding failed, continuing without radius", e);
      }
    }

    // Fetch up to 3 pages per search so the "No website" bucket fills up quickly.
    const MAX_PAGES = data.pageToken ? 1 : 3;
    const allPlaces: GooglePlace[] = [];
    let nextPageToken: string | null = data.pageToken ?? null;

    for (let i = 0; i < MAX_PAGES; i++) {
      const pageBody = { ...body };
      if (nextPageToken) pageBody["pageToken"] = nextPageToken;

      const res = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": FIELD_MASK,
        },
        body: JSON.stringify(pageBody),
      });

      if (res.status === 429) {
        if (allPlaces.length > 0) break;
        throw new Error("Too many searches right now. Please wait a minute and try again.");
      }
      if (res.status === 403) {
        const errBody = await res.text();
        console.error(`Places 403: ${errBody}`);
        throw new Error("Google Maps denied this request. Check the Google Maps connection settings.");
      }
      if (!res.ok) {
        const errBody = await res.text();
        console.error(`Places request failed [${res.status}]: ${errBody}`);
        if (allPlaces.length > 0) break;
        throw new Error(`Search failed (${res.status}). Please try again.`);
      }

      const json = (await res.json()) as { places?: GooglePlace[]; nextPageToken?: string };
      allPlaces.push(...(json.places ?? []));
      nextPageToken = json.nextPageToken ?? null;
      if (!nextPageToken) break;
    }

    // Remove duplicates by place id, then by name + address.
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    const leads: Lead[] = [];
    for (const p of allPlaces) {
      if (!p.id || seenIds.has(p.id)) continue;
      const lead = toLead(p);
      const key = `${lead.businessName.toLowerCase()}|${lead.address.toLowerCase()}`;
      if (seenKeys.has(key)) continue;
      seenIds.add(p.id);
      seenKeys.add(key);
      leads.push(lead);
    }

    return { leads, nextPageToken, totalFetched: allPlaces.length };
  });
