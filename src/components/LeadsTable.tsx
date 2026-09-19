import { ExternalLink, Globe, MapPin, Phone, Star } from "lucide-react";
import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Lead } from "@/lib/leads.types";

interface Props {
  leads: Lead[];
  rowKey: (l: Lead, i: number) => string;
  selected: Set<string>;
  onToggle: (key: string) => void;
  onToggleAll: (keys: string[], checked: boolean) => void;
  renderStatus?: (l: Lead, key: string) => ReactNode;
  renderExtra?: (l: Lead, key: string) => ReactNode;
  extraHeader?: ReactNode;
}

export function LeadsTable({
  leads,
  rowKey,
  selected,
  onToggle,
  onToggleAll,
  renderStatus,
  renderExtra,
  extraHeader,
}: Props) {
  const keys = leads.map(rowKey);
  const allChecked = keys.length > 0 && keys.every((k) => selected.has(k));

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(c) => onToggleAll(keys, c === true)}
                aria-label="Select all"
              />
            </TableHead>
            <TableHead>Business</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Website</TableHead>
            <TableHead className="text-right">Rating</TableHead>
            <TableHead className="text-right">Reviews</TableHead>
            <TableHead>Status</TableHead>
            {extraHeader}
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.map((l, i) => {
            const key = keys[i]!;
            return (
              <TableRow key={key} data-state={selected.has(key) ? "selected" : undefined}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(key)}
                    onCheckedChange={() => onToggle(key)}
                    aria-label={`Select ${l.businessName}`}
                  />
                </TableCell>
                <TableCell className="max-w-[220px]">
                  <div className="font-semibold leading-tight">{l.businessName}</div>
                  <a
                    href={l.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <MapPin className="size-3" /> Open in Google Maps
                  </a>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{l.category || "—"}</TableCell>
                <TableCell className="max-w-[260px] text-sm text-muted-foreground">{l.address || "—"}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {l.phone ? (
                    <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 hover:underline">
                      <Phone className="size-3" /> {l.phone}
                    </a>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {l.hasWebsite ? (
                    <a
                      href={l.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Globe className="size-3" /> Visit <ExternalLink className="size-3" />
                    </a>
                  ) : (
                    <Badge variant="nowebsite">No website</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right text-sm">
                  {l.rating !== null ? (
                    <span className="inline-flex items-center gap-1">
                      <Star className="size-3 fill-warning text-warning" /> {l.rating.toFixed(1)}
                    </span>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell className="text-right text-sm">{l.reviewCount}</TableCell>
                <TableCell>{renderStatus ? renderStatus(l, key) : <Badge variant="secondary">{l.leadStatus}</Badge>}</TableCell>
                {renderExtra ? renderExtra(l, key) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
