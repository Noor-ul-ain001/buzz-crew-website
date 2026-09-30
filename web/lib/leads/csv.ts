import { downloadFile } from "@/lib/download";
import { toBusinessDay } from "@/lib/format";
import type { Lead } from "@/lib/leads/types";

const COLUMNS: { header: string; value: (lead: Lead) => string }[] = [
  { header: "ID", value: (lead) => lead.id },
  { header: "Name", value: (lead) => lead.name },
  { header: "Email", value: (lead) => lead.email },
  { header: "Phone", value: (lead) => lead.phone },
  { header: "Business", value: (lead) => lead.business },
  { header: "Country", value: (lead) => lead.country },
  { header: "Services", value: (lead) => lead.services.join("; ") },
  { header: "Budget", value: (lead) => lead.budget },
  { header: "Status", value: (lead) => lead.status },
  { header: "Created", value: (lead) => toBusinessDay(lead.createdAt) },
  { header: "Message", value: (lead) => lead.message },
];

function escapeCell(value: string) {
  // Neutralise spreadsheet formulas (CSV injection): leads are typed in by the public.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function leadsToCsv(leads: Lead[]) {
  const lines = [
    COLUMNS.map((column) => column.header),
    ...leads.map((lead) => COLUMNS.map((column) => escapeCell(column.value(lead)))),
  ].map((cells) => cells.join(","));
  return lines.join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  // The BOM makes Excel read the file as UTF-8 (names, "–" in budget ranges).
  downloadFile(filename, ["\uFEFF", csv], "text/csv;charset=utf-8");
}
