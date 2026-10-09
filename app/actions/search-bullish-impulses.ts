"use server";

import YahooFinance from "yahoo-finance2";
import { createClient } from "@supabase/supabase-js";
import { BullishSignal, IntradayCandle } from "@/domain/models/bullish-impulse";
import { detectBullishSignals } from "@/domain/rules/bullish-impulse.rules";
import { revalidatePath } from "next/cache";

const ROUTE = "/impulso-alcista";
const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) await worker(items[cursor++]);
  }));
}

export async function getBullishImpulseSignals(): Promise<{ signals: BullishSignal[]; scannedAt: string | null; error?: string }> {
  const { data, error } = await supabase.from("impulso_alcista_senales")
    .select("ticker,nombre,tipo,precio,variacion_barra_pct,volumen_relativo,detectada_en,motivo")
    .order("detectada_en", { ascending: false }).limit(500);
  if (error) return { signals: [], scannedAt: null, error: "No se pudo leer el historial. Comprueba que has aplicado la migración SQL de Impulso Alcista." };
  const signals: BullishSignal[] = (data ?? []).map((row) => ({
    ticker: row.ticker, nombre: row.nombre, tipo: row.tipo, precio: Number(row.precio),
    variacionBarraPct: Number(row.variacion_barra_pct), volumenRelativo: row.volumen_relativo == null ? null : Number(row.volumen_relativo),
    detectadaEn: row.detectada_en, motivo: row.motivo,
  }));
  return { signals, scannedAt: signals[0]?.detectadaEn ?? null };
}

export async function scanBullishImpulseAction() {
  const { data: companies, error: companiesError } = await supabase.from("empresas").select("ticker,nombre").order("ticker");
  if (companiesError || !companies?.length) return { success: false, message: "No se pudo cargar el universo de empresas del radar." };

  const candidates: BullishSignal[] = [];
  const failures: string[] = [];
  await pool(companies, 5, async (company) => {
    try {
      const start = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const chart = await yf.chart(company.ticker, { period1: start, interval: "15m" });
      const candles: IntradayCandle[] = chart.quotes.flatMap((q) => {
        if (q.open == null || q.high == null || q.low == null || q.close == null) return [];
        return [{ timestamp: q.date, open: q.open, high: q.high, low: q.low, close: q.close, volume: q.volume ?? 0 }];
      });
      candidates.push(...detectBullishSignals(company.ticker, company.nombre ?? company.ticker, candles));
    } catch (error) {
      failures.push(company.ticker);
      console.warn(`No se pudieron analizar velas intradía de ${company.ticker}`, error);
    }
  });

  if (candidates.length) {
    const rows = candidates.map((signal) => ({
      ticker: signal.ticker, nombre: signal.nombre, tipo: signal.tipo, precio: signal.precio,
      variacion_barra_pct: signal.variacionBarraPct, volumen_relativo: signal.volumenRelativo,
      detectada_en: signal.detectadaEn, motivo: signal.motivo,
    }));
    const { error } = await supabase.from("impulso_alcista_senales").upsert(rows, { onConflict: "ticker,tipo,detectada_en", ignoreDuplicates: true });
    if (error) return { success: false, message: "Se analizaron las empresas, pero no se pudieron guardar las señales. Aplica la migración SQL." };
  }

  revalidatePath(ROUTE);
  return {
    success: true,
    message: `Análisis terminado: ${companies.length} empresas del radar; ${candidates.length} señales detectadas; ${failures.length} empresas sin datos intradía.`,
    scanned: companies.length, signals: candidates.length, failures: failures.length,
  };
}
