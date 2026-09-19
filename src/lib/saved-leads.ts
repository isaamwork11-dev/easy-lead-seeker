import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { Lead, LeadStatus } from "./leads.types";

export type SavedLeadRow = Tables<"saved_leads">;

export function rowToLead(r: SavedLeadRow): Lead {
  return {
    placeId: r.place_id,
    businessName: r.business_name,
    category: r.category ?? "",
    address: r.address ?? "",
    phone: r.phone ?? "",
    website: r.website ?? "",
    mapsUrl: r.maps_url ?? "",
    rating: r.rating === null ? null : Number(r.rating),
    reviewCount: r.review_count,
    hasWebsite: r.has_website,
    leadStatus: r.lead_status as LeadStatus,
  };
}

export async function saveLeads(leads: Lead[], searchQuery: string) {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new Error("Please sign in first.");

  const rows = leads.map((l) => ({
    user_id: userId,
    place_id: l.placeId,
    business_name: l.businessName,
    category: l.category || null,
    address: l.address || null,
    phone: l.phone || null,
    website: l.website || null,
    maps_url: l.mapsUrl || null,
    rating: l.rating,
    review_count: l.reviewCount,
    has_website: l.hasWebsite,
    lead_status: l.leadStatus,
    search_query: searchQuery,
  }));

  const { error } = await supabase
    .from("saved_leads")
    .upsert(rows, { onConflict: "user_id,place_id", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
}

export async function listSavedLeads(): Promise<SavedLeadRow[]> {
  const { data, error } = await supabase
    .from("saved_leads")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function updateSavedLead(
  id: string,
  patch: Partial<Pick<SavedLeadRow, "lead_status" | "contacted" | "notes">>,
) {
  const { error } = await supabase.from("saved_leads").update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function deleteSavedLeads(ids: string[]) {
  const { error } = await supabase.from("saved_leads").delete().in("id", ids);
  if (error) throw new Error(error.message);
}
