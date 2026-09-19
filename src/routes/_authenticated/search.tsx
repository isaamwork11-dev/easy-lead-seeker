import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState, type FormEvent } from "react";
import { Bookmark, Download, FileSpreadsheet, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { LeadsTable } from "@/components/LeadsTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { searchBusinesses } from "@/lib/places.functions";
import { exportCsv, exportXlsx } from "@/lib/export";
import { saveLeads } from "@/lib/saved-leads";
import { QUICK_SEARCHES, type Lead } from "@/lib/leads.types";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Search businesses — Lead Finder" },
      { name: "description", content: "Search businesses by keyword and city and instantly see which ones have no website." },
      { property: "og:title", content: "Search businesses — Lead Finder" },
      { property: "og:description", content: "Search businesses by keyword and city and instantly see which ones have no website." },
    ],
  }),
  component: SearchPage,
});

type WebsiteFilter = "no" | "yes" | "all";
const PAGE_SIZE = 20;

function SearchPage() {
  const search = useServerFn(searchBusinesses);

  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");
  const [radius, setRadius] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [lastQuery, setLastQuery] = useState("");

  const [websiteFilter, setWebsiteFilter] = useState<WebsiteFilter>("no");
  const [minRating, setMinRating] = useState("0");
  const [minReviews, setMinReviews] = useState("");
  const [category, setCategory] = useState("all");
  const [locationFilter, setLocationFilter] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(leads.map((l) => l.category).filter(Boolean))).sort(),
    [leads],
  );

  const filtered = useMemo(() => {
    const minR = Number(minRating) || 0;
    const minRev = Number(minReviews) || 0;
    const loc = locationFilter.trim().toLowerCase();
    return leads.filter((l) => {
      if (websiteFilter === "no" && l.hasWebsite) return false;
      if (websiteFilter === "yes" && !l.hasWebsite) return false;
      if (minR > 0 && (l.rating ?? 0) < minR) return false;
      if (minRev > 0 && l.reviewCount < minRev) return false;
      if (category !== "all" && l.category !== category) return false;
      if (loc && !l.address.toLowerCase().includes(loc)) return false;
      return true;
    });
  }, [leads, websiteFilter, minRating, minReviews, category, locationFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageLeads = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const noWebsiteCount = leads.filter((l) => !l.hasWebsite).length;
  const selectedLeads = filtered.filter((l) => selected.has(l.placeId));

  async function runSearch(kw: string, loc: string, token?: string) {
    const radiusKm = radius ? Number(radius) : undefined;
    return search({
      data: {
        keyword: kw,
        location: loc,
        ...(radiusKm && radiusKm > 0 ? { radiusKm } : {}),
        ...(token ? { pageToken: token } : {}),
      },
    });
  }

  async function onSearch(e?: FormEvent, kwOverride?: string) {
    e?.preventDefault();
    const kw = (kwOverride ?? keyword).trim();
    const loc = location.trim();
    if (kw.length < 2 || loc.length < 2) {
      toast.error("Enter a business type and a location.");
      return;
    }
    setLoading(true);
    setSearched(true);
    setSelected(new Set());
    setPage(1);
    setCategory("all");
    try {
      const res = await runSearch(kw, loc);
      setLeads(res.leads);
      setNextToken(res.nextPageToken);
      setLastQuery(`${kw} in ${loc}`);
      if (res.leads.length === 0) toast.info("No businesses found. Try a different keyword or city.");
    } catch (err) {
      setLeads([]);
      setNextToken(null);
      toast.error(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!nextToken) return;
    setLoadingMore(true);
    try {
      const [kw, loc] = lastQuery.split(" in ");
      const res = await runSearch(kw ?? keyword, loc ?? location, nextToken);
      const ids = new Set(leads.map((l) => l.placeId));
      setLeads([...leads, ...res.leads.filter((l) => !ids.has(l.placeId))]);
      setNextToken(res.nextPageToken);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load more");
    } finally {
      setLoadingMore(false);
    }
  }

  function toggle(key: string) {
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setSelected(next);
  }
  function toggleAll(keys: string[], checked: boolean) {
    const next = new Set(selected);
    keys.forEach((k) => (checked ? next.add(k) : next.delete(k)));
    setSelected(next);
  }

  const exportSet = selectedLeads.length > 0 ? selectedLeads : filtered;
  const exportLabel = selectedLeads.length > 0 ? `${selectedLeads.length} selected` : `all ${filtered.length}`;

  async function onSave() {
    if (exportSet.length === 0) return;
    setSaving(true);
    try {
      await saveLeads(exportSet, lastQuery);
      toast.success(`Saved ${exportSet.length} lead${exportSet.length === 1 ? "" : "s"}.`);
      setSelected(new Set());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const segBtn = (active: boolean) =>
    `px-4 py-2 text-sm font-semibold transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:bg-accent"}`;

  return (
    <AppShell>
      {/* Search bar */}
      <form onSubmit={onSearch} className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-[1.4fr_1.4fr_0.6fr_auto]">
          <div className="space-y-1">
            <Label htmlFor="kw">Business type</Label>
            <Input id="kw" placeholder="e.g. Restaurants" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="loc">Location (city, state, country)</Label>
            <Input id="loc" placeholder="e.g. Los Angeles, CA, USA" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="rad">Radius (km, optional)</Label>
            <Input id="rad" type="number" min={1} max={50} placeholder="Any" value={radius} onChange={(e) => setRadius(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button type="submit" size="lg" className="w-full md:w-auto" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <Search />} Search
            </Button>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Quick search:</span>
          {QUICK_SEARCHES.map((q) => (
            <button
              key={q}
              type="button"
              className="rounded-full border bg-background px-3 py-1 text-xs font-medium hover:bg-accent"
              onClick={() => {
                setKeyword(q);
                if (location.trim().length >= 2) onSearch(undefined, q);
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </form>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <Label>Website</Label>
          <div className="flex overflow-hidden rounded-md border">
            <button type="button" className={segBtn(websiteFilter === "no")} onClick={() => { setWebsiteFilter("no"); setPage(1); }}>
              No website {searched && `(${noWebsiteCount})`}
            </button>
            <button type="button" className={segBtn(websiteFilter === "yes")} onClick={() => { setWebsiteFilter("yes"); setPage(1); }}>
              Has website {searched && `(${leads.length - noWebsiteCount})`}
            </button>
            <button type="button" className={segBtn(websiteFilter === "all")} onClick={() => { setWebsiteFilter("all"); setPage(1); }}>
              All {searched && `(${leads.length})`}
            </button>
          </div>
        </div>
        <div className="space-y-1">
          <Label>Min rating</Label>
          <Select value={minRating} onValueChange={(v) => { setMinRating(v); setPage(1); }}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Any</SelectItem>
              <SelectItem value="3">3.0+</SelectItem>
              <SelectItem value="3.5">3.5+</SelectItem>
              <SelectItem value="4">4.0+</SelectItem>
              <SelectItem value="4.5">4.5+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="minrev">Min reviews</Label>
          <Input id="minrev" type="number" min={0} className="w-28" placeholder="Any" value={minReviews} onChange={(e) => { setMinReviews(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-1">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="locf">Address contains</Label>
          <Input id="locf" className="w-40" placeholder="e.g. Hollywood" value={locationFilter} onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Actions */}
      {searched && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span> result{filtered.length === 1 ? "" : "s"}
            {selectedLeads.length > 0 && <> · <span className="font-semibold text-foreground">{selectedLeads.length}</span> selected</>}
            {lastQuery && <> · "{lastQuery}"</>}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportCsv(exportSet)} disabled={exportSet.length === 0}>
              <Download /> CSV ({exportLabel})
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportXlsx(exportSet)} disabled={exportSet.length === 0}>
              <FileSpreadsheet /> Excel ({exportLabel})
            </Button>
            <Button size="sm" onClick={onSave} disabled={exportSet.length === 0 || saving}>
              {saving ? <Loader2 className="animate-spin" /> : <Bookmark />} Save ({exportLabel})
            </Button>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="mt-3">
        {loading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border bg-card py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Searching Google Maps…
          </div>
        ) : !searched ? (
          <div className="rounded-lg border border-dashed bg-card py-16 text-center text-sm text-muted-foreground">
            Enter a business type and a city, then press Search.
            <br />
            Results without a website are shown first — those are your best leads.
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border bg-card py-16 text-center text-sm text-muted-foreground">
            {leads.length > 0 && websiteFilter === "no" ? (
              <>
                Every business found already has a website.
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={() => setWebsiteFilter("all")}>Show all businesses</Button>
                </div>
              </>
            ) : (
              "No businesses match these filters."
            )}
          </div>
        ) : (
          <>
            <LeadsTable
              leads={pageLeads}
              rowKey={(l) => l.placeId}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>Previous</Button>
                <span className="text-muted-foreground">Page {safePage} of {totalPages}</span>
                <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next</Button>
              </div>
              {nextToken && (
                <Button variant="secondary" size="sm" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? <Loader2 className="animate-spin" /> : null} Load more from Google
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
