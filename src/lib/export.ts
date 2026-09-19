import * as XLSX from "xlsx";
import type { Lead } from "./leads.types";

const HEADERS = [
  "Business Name",
  "Category",
  "Address",
  "Phone",
  "Website",
  "Google Maps URL",
  "Rating",
  "Reviews",
  "Website Available",
  "Lead Status",
];

function toRow(l: Lead): (string | number)[] {
  return [
    l.businessName,
    l.category,
    l.address,
    l.phone,
    l.website,
    l.mapsUrl,
    l.rating ?? "",
    l.reviewCount,
    l.hasWebsite ? "Yes" : "No",
    l.leadStatus,
  ];
}

function fileStamp() {
  return new Date().toISOString().slice(0, 10);
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportCsv(leads: Lead[], name = "leads") {
  const escape = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [HEADERS, ...leads.map(toRow)].map((r) => r.map(escape).join(","));
  download(new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" }), `${name}-${fileStamp()}.csv`);
}

export function exportXlsx(leads: Lead[], name = "leads") {
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...leads.map(toRow)]);
  ws["!cols"] = [28, 18, 40, 16, 32, 40, 8, 9, 16, 14].map((w) => ({ wch: w }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" }) as ArrayBuffer;
  download(
    new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
    `${name}-${fileStamp()}.xlsx`,
  );
}
