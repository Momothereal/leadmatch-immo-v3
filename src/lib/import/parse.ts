import * as XLSX from "xlsx";
import { FieldDef, coerceEnum } from "./schemas";

export interface ParsedTable {
  headers: string[];
  rows: Record<string, unknown>[];
}

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_\-]/g, " ").trim();

/** Parse un fichier CSV ou Excel via SheetJS. */
export async function parseFile(file: File): Promise<ParsedTable> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error("Le fichier ne contient aucune feuille.");
  const sheet = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
  if (json.length === 0) return { headers: [], rows: [] };
  const headers = Object.keys(json[0]);
  return { headers, rows: json };
}

/** Parse une chaîne collée (TSV, CSV ou ;). Première ligne = en-têtes. */
export function parsePastedText(text: string): ParsedTable {
  const trimmed = text.trim();
  if (!trimmed) return { headers: [], rows: [] };
  // Détecte le séparateur sur la première ligne
  const firstLine = trimmed.split(/\r?\n/)[0];
  const candidates = ["\t", ";", ","];
  const sep = candidates.sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
  const lines = trimmed.split(/\r?\n/).filter((l) => l.trim());
  const headers = lines[0].split(sep).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const cells = line.split(sep);
    const obj: Record<string, unknown> = {};
    headers.forEach((h, i) => (obj[h] = (cells[i] ?? "").trim()));
    return obj;
  });
  return { headers, rows };
}

/** Auto-détecte le mapping en-tête → champ DB. */
export function autoMap(headers: string[], fields: FieldDef[]): Record<string, string | null> {
  const mapping: Record<string, string | null> = {};
  const used = new Set<string>();
  for (const header of headers) {
    const norm = normalize(header);
    let best: { key: string; score: number } | null = null;
    for (const field of fields) {
      if (used.has(field.key)) continue;
      let score = 0;
      if (norm === normalize(field.label)) score = 100;
      else if (norm === field.key) score = 95;
      else {
        for (const hint of field.hints) {
          const h = normalize(hint);
          if (norm === h) score = Math.max(score, 90);
          else if (norm.includes(h) || h.includes(norm)) score = Math.max(score, 60);
        }
      }
      if (score > 0 && (!best || score > best.score)) best = { key: field.key, score };
    }
    if (best && best.score >= 60) {
      mapping[header] = best.key;
      used.add(best.key);
    } else {
      mapping[header] = null;
    }
  }
  return mapping;
}

/** Applique le mapping sur les lignes brutes pour produire des objets DB-ready. */
export function applyMapping(
  rows: Record<string, unknown>[],
  mapping: Record<string, string | null>
): Record<string, unknown>[] {
  return rows.map((row) => {
    const out: Record<string, unknown> = {};
    for (const [header, fieldKey] of Object.entries(mapping)) {
      if (!fieldKey) continue;
      const raw = row[header];
      out[fieldKey] = coerceEnum(fieldKey, raw);
    }
    return out;
  });
}
