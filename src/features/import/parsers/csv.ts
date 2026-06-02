import Papa from 'papaparse';
import type { TransactionType } from '@/features/transactions/types';
import { parseISO, parse, isValid, format } from 'date-fns';

export interface ParsedRow {
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
}

export interface ParsedStatement {
  profileName: string;
  rows: ParsedRow[];
}

export interface ParseError {
  message: string;
}

type RawRow = Record<string, string>;

interface BankProfile {
  name: string;
  detect(headers: string[]): boolean;
  parseRow(row: RawRow): ParsedRow | null;
}

function normalizeHeader(h: string): string {
  return h
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function pick(row: RawRow, ...candidates: string[]): string {
  for (const key of Object.keys(row)) {
    const norm = normalizeHeader(key);
    if (candidates.some((c) => norm === c || norm.includes(c))) {
      return row[key] ?? '';
    }
  }
  return '';
}

const DATE_FORMATS = [
  'yyyy-MM-dd',
  'dd/MM/yyyy',
  'dd-MM-yyyy',
  'dd/MM/yy',
  'MM/dd/yyyy',
];

function parseDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const iso = parseISO(trimmed);
  if (isValid(iso) && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return format(iso, 'yyyy-MM-dd');
  }
  for (const fmt of DATE_FORMATS) {
    const d = parse(trimmed, fmt, new Date());
    if (isValid(d)) return format(d, 'yyyy-MM-dd');
  }
  return null;
}

function parseAmount(raw: string): number | null {
  if (!raw) return null;
  let cleaned = raw.trim().replace(/\s/g, '').replace(/R\$/i, '');
  // Parenthesis style: (123,45) means negative
  let negative = false;
  if (/^\(.*\)$/.test(cleaned)) {
    negative = true;
    cleaned = cleaned.slice(1, -1);
  }
  if (cleaned.startsWith('-')) {
    negative = true;
    cleaned = cleaned.slice(1);
  }
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
  }
  // Decide decimal separator: BR (1.234,56) vs US (1,234.56)
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');
  if (lastComma > lastDot) {
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    cleaned = cleaned.replace(/,/g, '');
  } else {
    cleaned = cleaned.replace(',', '.');
  }
  const value = Number.parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;
  return negative ? -value : value;
}

// ── Profiles ────────────────────────────────────────────────────────────

const nubankCreditCard: BankProfile = {
  name: 'Nubank — Cartão de crédito',
  detect: (headers) => {
    const norm = headers.map(normalizeHeader);
    return (
      norm.includes('date') && norm.includes('title') && norm.includes('amount')
    );
  },
  parseRow: (row) => {
    const date = parseDate(pick(row, 'date'));
    const description = pick(row, 'title');
    const value = parseAmount(pick(row, 'amount'));
    if (!date || !description || value === null) return null;
    // Nubank credit card: positive amount = expense, negative = refund/income
    const isIncome = value < 0;
    return {
      date,
      description,
      amount: Math.abs(value),
      type: isIncome ? 'income' : 'expense',
    };
  },
};

const nubankAccount: BankProfile = {
  name: 'Nubank — Conta corrente',
  detect: (headers) => {
    const norm = headers.map(normalizeHeader);
    return (
      norm.some((h) => h.includes('data')) &&
      norm.some((h) => h.includes('valor')) &&
      norm.some((h) => h.includes('identificador') || h.includes('descricao'))
    );
  },
  parseRow: (row) => {
    const date = parseDate(pick(row, 'data'));
    const description = pick(row, 'descricao', 'description');
    const value = parseAmount(pick(row, 'valor', 'amount'));
    if (!date || !description || value === null) return null;
    return {
      date,
      description,
      amount: Math.abs(value),
      type: value < 0 ? 'expense' : 'income',
    };
  },
};

const interBank: BankProfile = {
  name: 'Banco Inter',
  detect: (headers) => {
    const norm = headers.map(normalizeHeader);
    return (
      norm.some((h) => h.includes('historico')) &&
      norm.some((h) => h.includes('valor'))
    );
  },
  parseRow: (row) => {
    const date = parseDate(pick(row, 'data lancamento', 'data'));
    const historico = pick(row, 'historico');
    const descricao = pick(row, 'descricao');
    const description = [historico, descricao]
      .filter(Boolean)
      .join(' — ')
      .trim();
    const value = parseAmount(pick(row, 'valor'));
    if (!date || !description || value === null) return null;
    return {
      date,
      description,
      amount: Math.abs(value),
      type: value < 0 ? 'expense' : 'income',
    };
  },
};

const generic: BankProfile = {
  name: 'Genérico',
  detect: () => true,
  parseRow: (row) => {
    const date = parseDate(pick(row, 'data', 'date', 'data lancamento'));
    const description = pick(
      row,
      'descricao',
      'description',
      'historico',
      'memo',
      'title',
      'detalhes',
    );
    const valueRaw =
      pick(row, 'valor', 'amount', 'value') ||
      pick(row, 'debito', 'credito');
    const value = parseAmount(valueRaw);
    if (!date || !description || value === null) return null;
    return {
      date,
      description,
      amount: Math.abs(value),
      type: value < 0 ? 'expense' : 'income',
    };
  },
};

const PROFILES: BankProfile[] = [
  nubankCreditCard,
  nubankAccount,
  interBank,
  generic,
];

/** Strips leading garbage rows until the first row that looks like a CSV header. */
function preprocess(text: string): string {
  const stripped = text.replace(/^﻿/, '');
  const lines = stripped.split(/\r?\n/);
  let headerIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const lower = lines[i].toLowerCase();
    if (
      lower.includes('data') ||
      lower.includes('date') ||
      lower.includes('valor') ||
      lower.includes('amount')
    ) {
      headerIdx = i;
      break;
    }
  }
  return lines.slice(headerIdx).join('\n');
}

/**
 * Parses a CSV bank statement.
 *
 * Auto-detects the delimiter (Papaparse), picks the best-matching bank
 * profile from the headers, then maps each row to a `ParsedRow`.
 * Returns `{ error }` if no rows could be parsed successfully.
 */
export function parseCsvStatement(
  text: string,
): { ok: true; statement: ParsedStatement } | { ok: false; error: string } {
  const cleaned = preprocess(text);
  const result = Papa.parse<RawRow>(cleaned, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (!result.data || result.data.length === 0) {
    return { ok: false, error: 'Não encontramos linhas válidas no arquivo.' };
  }

  const headers = result.meta.fields ?? [];
  if (headers.length === 0) {
    return { ok: false, error: 'Cabeçalho do CSV não pôde ser identificado.' };
  }

  const profile = PROFILES.find((p) => p.detect(headers)) ?? generic;
  const rows: ParsedRow[] = [];
  for (const raw of result.data) {
    const parsed = profile.parseRow(raw);
    if (parsed) rows.push(parsed);
  }

  if (rows.length === 0) {
    return {
      ok: false,
      error:
        'Não foi possível interpretar nenhuma linha. Verifique se o arquivo é um extrato CSV válido.',
    };
  }

  // Sort newest first to make preview reviewable
  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  return { ok: true, statement: { profileName: profile.name, rows } };
}
