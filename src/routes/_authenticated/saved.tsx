import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/AppShell";
import { LeadsTable } from "@/components/LeadsTable";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TableCell, TableHead } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { exportCsv, exportXlsx } from "@/lib/export";
import { deleteSavedLeads, listSavedLeads, rowToLead, updateSavedLead, type SavedLeadRow } from "@/lib/saved-leads";
import { LEAD_STATUSES } from "@/lib/leads.types";

export const Route = createFileRoute("/_authenticated/saved")({
  head: () => ({
    meta: [
      { title: "Saved leads — Lead Finder" },
      { name: "description", content: "Your saved business leads with status, contacted flag, and notes." },
      { property: "og:title", content: "Saved leads — Lead Finder" },
      { property: "og:description", content: "Your saved business leads with status, contacted flag, and notes." },
    ],
  }),
  component: SavedPage,
});

const PAGE_SIZE = 25;

function SavedPage() {
  const qc = useQueryClient();
  const { data: rows = [], isLoading } = useQuery({ queryKey: ["saved-leads"], queryFn: listSavedLeads });

  const [statusFilter, setStatusFilter] = useState("all");
  const [websiteFilter, setWebsiteFilter] = useState("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter !== "all" && r.lead_status !== statusFilter) return false;
      if (websiteFilter === "no" && r.has_website) return false;
      if (websiteFilter === "yes" && !r.has_website) return false;
      if (s && !`${r.business_name} ${r.address ?? ""} ${r.category ?? ""}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [rows, statusFilter, websiteFilter, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Pick<SavedLeadRow, "lead_status" | "contacted" | "notes">> }) =>
      updateSavedLead(id, patch),
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: ["saved-leads"] });
      const prev = qc.getQueryData<SavedLeadRow[]>(["saved-leads"]);
      qc.setQueryData<SavedLeadRow[]>(["saved-leads"], (old) => old?.map((r) => (r.id === id ? { ...r, ...patch } : r)));
      return { prev };
    },
    onError: (err, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(["saved-leads"], ctx.prev);
      toast.error(err instanceof Error ? err.message : "Update failed");
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["saved-leads"] }),
  });

  const remove = useMutation({
    mutationFn: deleteSavedLeads,
    onSuccess: (_d, ids) => {
      toast.success(`Deleted ${ids.length} lead${ids.length === 1 ? "" : "s"}.`);
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ["saved-leads"] });
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Delete failed"),
  });

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

  const selectedRows = filtered.filter((r) => selected.has(r.id));
  const exportRows = selectedRows.length > 0 ? selectedRows : filtered;
  const exportLabel = selectedRows.length > 0 ? `${selectedRows.length} selected` : `all ${filtered.length}`;

  return (
    <AppShell>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Saved leads</h1>
          <p className="text-sm text-muted-foreground">{rows.length} saved · {rows.filter((r) => r.contacted).length} contacted</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => exportCsv(exportRows.map(rowToLead), "saved-leads")} disabled={exportRows.length === 0}>
            <Download /> CSV ({exportLabel})
          </Button>
          <Button variant="outline" size="sm" onClick={() => exportXlsx(exportRows.map(rowToLead), "saved-leads")} disabled={exportRows.length === 0}>
            <FileSpreadsheet /> Excel ({exportLabel})
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={selectedRows.length === 0 || remove.isPending}
            onClick={() => {
              if (confirm(`Delete ${selectedRows.length} selected lead(s)?`)) remove.mutate(selectedRows.map((r) => r.id));
            }}
          >
            <Trash2 /> Delete selected
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-3 rounded-xl border bg-card p-4 shadow-sm">
        <div className="space-y-1">
          <Label htmlFor="q">Search</Label>
          <Input id="q" className="w-56" placeholder="Name, address, category" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {LEAD_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Website</Label>
          <Select value={websiteFilter} onValueChange={(v) => { setWebsiteFilter(v); setPage(1); }}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="no">No website</SelectItem>
              <SelectItem value="yes">Has website</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-lg border bg-card py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Loading saved leads…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-card py-16 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? "No saved leads yet. Run a search and press Save." : "No leads match these filters."}
          </div>
        ) : (
          <>
            <LeadsTable
              leads={pageRows.map(rowToLead)}
              rowKey={(_l, i) => pageRows[i]!.id}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
              extraHeader={
                <>
                  <TableHead>Contacted</TableHead>
                  <TableHead className="min-w-[200px]">Notes</TableHead>
                </>
              }
              renderStatus={(_l, id) => {
                const r = byId.get(id)!;
                return (
                  <Select value={r.lead_status} onValueChange={(v) => update.mutate({ id, patch: { lead_status: v } })}>
                    <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              }}
              renderExtra={(_l, id) => {
                const r = byId.get(id)!;
                return (
                  <>
                    <TableCell>
                      <Checkbox
                        checked={r.contacted}
                        onCheckedChange={(c) => update.mutate({ id, patch: { contacted: c === true } })}
                        aria-label="Contacted"
                      />
                    </TableCell>
                    <TableCell>
                      <NotesCell value={r.notes ?? ""} onSave={(notes) => update.mutate({ id, patch: { notes } })} />
                    </TableCell>
                  </>
                );
              }}
            />
            <div className="mt-3 flex items-center gap-2 text-sm">
              <Button variant="outline" size="sm" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>Previous</Button>
              <span className="text-muted-foreground">Page {safePage} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>Next</Button>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function NotesCell({ value, onSave }: { value: string; onSave: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  return (
    <Input
      className="h-8 text-xs"
      placeholder="Add a note…"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => draft !== value && onSave(draft)}
      onKeyDown={(e) => {
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
    />
  );
}
