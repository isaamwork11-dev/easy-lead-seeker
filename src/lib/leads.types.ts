export const LEAD_STATUSES = [
  "New",
  "Contacted",
  "Interested",
  "Not interested",
  "Closed",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export interface Lead {
  placeId: string;
  businessName: string;
  category: string;
  address: string;
  phone: string;
  website: string;
  mapsUrl: string;
  rating: number | null;
  reviewCount: number;
  hasWebsite: boolean;
  leadStatus: LeadStatus;
}

export interface SearchResult {
  leads: Lead[];
  nextPageToken: string | null;
  totalFetched: number;
}

export const QUICK_SEARCHES = [
  "Restaurants",
  "Plumbers",
  "Dentists",
  "Roofers",
  "Salons",
  "Gyms",
  "Auto repair",
  "Lawyers",
  "Real estate agents",
  "Cleaning services",
];
