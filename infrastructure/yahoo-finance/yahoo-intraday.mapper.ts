import { IntradayBar } from "@/domain/models/intraday";

interface IntradayQuoteLike {
  date: Date;
  open?: number | null;
  high?: number | null;
  low?: number | null;
  close?: number | null;
  volume?: number | null;
}

// Solo se leen los campos de "meta" que hacen falta, con tipos laxos para no depender de la versión de yahoo-finance2.
interface IntradayMetaLike {
  exchangeTimezoneName?: string;
  currentTradingPeriod?: { regular?: { start?: unknown; end?: unknown } };
}

const DEFAULT_TIME_ZONE = "America/New_York";

function toDate(value: unknown): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value < 1e12 ? value * 1000 : value);
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return null;
}

function createLocalClock(timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  return (date: Date) => {
    const parts: Record<string, string> = {};
    for (const part of formatter.formatToParts(date)) parts[part.type] = part.value;
    return {
      day: `${parts.year}-${parts.month}-${parts.day}`,
      minutes: Number(parts.hour) * 60 + Number(parts.minute),
    };
  };
}

// Convierte las velas de Yahoo en IntradayBar y marca cuáles son de pre-market / after-hours.
// La sesión regular se toma de meta.currentTradingPeriod.regular (hora local de la bolsa); si Yahoo no la
// informa, ninguna vela se marca como extendida. Los días de media sesión pueden clasificarse mal.
export function mapIntradayBars(quotes: readonly IntradayQuoteLike[], rawMeta: unknown): IntradayBar[] {
  const meta = (rawMeta ?? {}) as IntradayMetaLike;
  const clock = createLocalClock(meta.exchangeTimezoneName || DEFAULT_TIME_ZONE);
  const regularStartDate = toDate(meta.currentTradingPeriod?.regular?.start);
  const regularEndDate = toDate(meta.currentTradingPeriod?.regular?.end);
  const regularStart = regularStartDate ? clock(regularStartDate).minutes : null;
  const regularEnd = regularEndDate ? clock(regularEndDate).minutes : null;

  const bars: IntradayBar[] = [];
  for (const quote of quotes) {
    const { open, high, low, close } = quote;
    if (
      open === null || open === undefined ||
      high === null || high === undefined ||
      low === null || low === undefined ||
      close === null || close === undefined ||
      ![open, high, low, close].every(Number.isFinite)
    ) continue;

    const local = clock(quote.date);
    const extended =
      regularStart !== null && regularEnd !== null && (local.minutes < regularStart || local.minutes >= regularEnd);

    bars.push({
      time: Math.floor(quote.date.getTime() / 1000),
      open,
      high,
      low,
      close,
      volume: quote.volume ?? 0,
      day: local.day,
      extended,
    });
  }

  return bars.sort((a, b) => a.time - b.time);
}
