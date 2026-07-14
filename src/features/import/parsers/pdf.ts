import * as pdfjs from 'pdfjs-dist';
// Vite resolves this to a hashed URL for the worker bundle (offline-friendly).
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { parse, isValid, format } from 'date-fns';
import type { ParsedRow, ParsedStatement } from './csv';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

const MONTHS_PT: Record<string, number> = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
};

/** Reads all text out of a PDF file, one logical line per row. */
async function extractLines(file: File, password?: string): Promise<string[]> {
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buffer, password }).promise;
  const lines: string[] = [];

  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();

    // pdf.js returns positioned text fragments. Group them into visual lines
    // by their Y coordinate, then order left-to-right within each line.
    const rows = new Map<number, { x: number; str: string }[]>();
    for (const item of content.items) {
      if (!('str' in item) || !item.str) continue;
      const y = Math.round((item.transform[5] as number) / 2) * 2;
      const x = item.transform[4] as number;
      const arr = rows.get(y) ?? [];
      arr.push({ x, str: item.str });
      rows.set(y, arr);
    }

    const sortedY = [...rows.keys()].sort((a, b) => b - a); // top → bottom
    for (const y of sortedY) {
      const frags = rows.get(y)!.sort((a, b) => a.x - b.x);
      const line = frags
        .map((f) => f.str)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (line) lines.push(line);
    }
  }

  await doc.destroy();
  return lines;
}

/** Extracts the invoice year, defaulting to the current year. */
function detectYear(lines: string[]): number {
  for (const line of lines) {
    const m = line.match(/\b(20\d{2})\b/);
    if (m) return Number.parseInt(m[1], 10);
  }
  return new Date().getFullYear();
}

/** Parses a BRL money token like "1.234,56" or "25,90" → number. */
function parseBrlAmount(raw: string): number | null {
  const cleaned = raw
    .replace(/\s/g, '')
    .replace(/R\$/i, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : null;
}

// The monetary value at the very end of the line (BR format: 1.234,56).
const TRAILING_NUMBER = /(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})\s*$/;

// Accepted date prefixes at the start of a line:
//   "15/09" or "15/09/2026"     (slash)
//   "20 de dez. 2025" / "15 SET" (month name, optional "de" and year)
const DATE_SLASH = /^(\d{2})\/(\d{2})(?:\/(\d{2,4}))?\s+/;
const DATE_MONTH = /^(\d{1,2})\s+(?:de\s+)?([a-zç]{3})\.?\s*(?:de\s+)?(\d{2,4})?\s+/i;

/**
 * Tries to turn one text line from a credit-card invoice into a ParsedRow.
 *
 * A line qualifies when it starts with a date and ends with a BRL amount,
 * with a merchant description in between. Everything else (headers, totals,
 * summaries, installment tables) is ignored.
 *
 * `fallbackYear` is used only for layouts that don't print the year on each
 * line (e.g. old Nubank). Banks like Inter print the year per line, which
 * matters because an invoice can span two years (Dec → Jul).
 */
function parseInvoiceLine(line: string, fallbackYear: number): ParsedRow | null {
  const numMatch = line.match(TRAILING_NUMBER);
  if (!numMatch) return null;

  const value = parseBrlAmount(numMatch[1]);
  if (value === null || value === 0) return null;

  // Everything before the number: this holds the date, the description, and
  // the currency/sign separators (e.g. " - R$ " or " - + R$ ").
  let rest = line.slice(0, numMatch.index);

  // The gap right before the number tells us the sign. On the Inter invoice a
  // lone "-" is just a visual separator; a "+" marks a credit/refund.
  const gap = rest.slice(-10);
  const explicitCredit = /\+/.test(gap);

  // Strip the trailing "R$", spaces and +/- separators off the description.
  rest = rest.replace(/[\s\-+]*R?\$?[\s\-+]*$/i, '').trim();

  let month: number;
  let day: number;
  let year = fallbackYear;

  const slash = rest.match(DATE_SLASH);
  const monthName = rest.match(DATE_MONTH);
  if (slash) {
    day = Number.parseInt(slash[1], 10);
    month = Number.parseInt(slash[2], 10);
    if (slash[3]) year = normalizeYear(slash[3]);
    rest = rest.slice(slash[0].length).trim();
  } else if (monthName) {
    day = Number.parseInt(monthName[1], 10);
    const mon = MONTHS_PT[monthName[2].toLowerCase()];
    if (!mon) return null;
    month = mon;
    if (monthName[3]) year = normalizeYear(monthName[3]);
    rest = rest.slice(monthName[0].length).trim();
  } else {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const description = rest.replace(/\s{2,}/g, ' ').trim();
  if (!description || description.length < 2) return null;

  const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const d = parse(iso, 'yyyy-MM-dd', new Date());
  if (!isValid(d)) return null;
  const date = format(d, 'yyyy-MM-dd');

  // Purchases are expenses; explicit "+" or refund/payment keywords are income.
  const upper = description.toUpperCase();
  const isCredit =
    explicitCredit ||
    /PAGAMENTO|ESTORNO|CREDITO|CRÉDITO|DEVOLU|REEMBOLSO/.test(upper);

  return {
    date,
    description,
    amount: Math.abs(value),
    type: isCredit ? 'income' : 'expense',
  };
}

/** Turns a 2- or 4-digit year string into a full year. */
function normalizeYear(raw: string): number {
  const n = Number.parseInt(raw, 10);
  return raw.length === 2 ? 2000 + n : n;
}

export type PdfParseResult =
  | { ok: true; statement: ParsedStatement }
  | { ok: false; error: string; needsPassword?: boolean };

/**
 * Parses a credit-card invoice PDF into a ParsedStatement, reusing the same
 * shape the CSV importer produces so the rest of the flow (categorization,
 * preview, learning) works unchanged.
 *
 * If the PDF is password-protected, pass `password`. When the password is
 * missing or wrong, returns `{ ok: false, needsPassword: true }` so the UI
 * can prompt the user. The password never leaves the browser.
 */
export async function parsePdfStatement(
  file: File,
  password?: string,
): Promise<PdfParseResult> {
  let lines: string[];
  try {
    lines = await extractLines(file, password);
  } catch (e) {
    const name = (e as { name?: string })?.name;
    // pdf.js throws PasswordException when a password is needed or incorrect.
    if (name === 'PasswordException') {
      return {
        ok: false,
        needsPassword: true,
        error: password
          ? 'Senha incorreta. Tente novamente.'
          : 'Este PDF está protegido. Digite a senha da fatura.',
      };
    }
    return {
      ok: false,
      error: 'Não foi possível ler o PDF. Verifique se o arquivo é válido.',
    };
  }

  if (lines.length === 0) {
    return {
      ok: false,
      error:
        'O PDF parece ser uma imagem (escaneado) e não contém texto selecionável. Exporte a fatura como PDF de texto ou use um CSV.',
    };
  }

  const year = detectYear(lines);
  const rows: ParsedRow[] = [];
  for (const line of lines) {
    const parsed = parseInvoiceLine(line, year);
    if (parsed) rows.push(parsed);
  }

  if (rows.length === 0) {
    return {
      ok: false,
      error:
        'Não encontramos lançamentos na fatura. Verifique se é o PDF da fatura do cartão (com data e valor por linha).',
    };
  }

  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return {
    ok: true,
    statement: { profileName: 'Fatura de cartão (PDF)', rows },
  };
}
