CREATE TABLE public.saved_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  place_id TEXT NOT NULL,
  business_name TEXT NOT NULL,
  category TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  maps_url TEXT,
  rating NUMERIC(2,1),
  review_count INTEGER NOT NULL DEFAULT 0,
  has_website BOOLEAN NOT NULL DEFAULT false,
  lead_status TEXT NOT NULL DEFAULT 'New',
  contacted BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  search_query TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, place_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_leads TO authenticated;
GRANT ALL ON public.saved_leads TO service_role;

ALTER TABLE public.saved_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own leads" ON public.saved_leads
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_saved_leads_updated_at
  BEFORE UPDATE ON public.saved_leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();