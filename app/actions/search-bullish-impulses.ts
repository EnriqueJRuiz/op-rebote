"use server";

import { BullishImpulseSample, BullishSignal, IntradayCandle } from "@/domain/models/bullish-impulse";
import { SIGNAL_WINDOW_HOURS, detectBullishSignals, isBetterSignal } from "@/domain/rules/bullish-impulse.rules";
import { SupabaseScanHistoryRepository } from "@/infrastructure/repositories/supabase-scan-history.repository";

// Se leen unas horas más que la ventana visible: hacen falta 12 muestras previas para evaluar la primera señal.
const HISTORY_LOOKBACK_HOURS = SIGNAL_WINDOW_HOURS + 3;
const MAX_SAMPLE_GAP_SECONDS = 30 * 60;
const STANDARD_SAMPLE_SECONDS = 10 * 60;
// Mientras no haya un escaneo nuevo el resultado no cambia, así que se reutiliza (con tope por seguridad).
const CACHE_MAX_AGE_MS = 5 * 60 * 1000;

type ImpulseResult = { signals: BullishSignal[]; scannedAt: string | null; error?: string };

// Un único repositorio: no se construye toda la composición (con el adaptador de Yahoo) solo para leer una tabla.
const scanHistoryRepository = new SupabaseScanHistoryRepository();
let cache: { key: string; builtAt: number; result: ImpulseResult } | null = null;

function hasValidPrices(
  sample: BullishImpulseSample
): sample is BullishImpulseSample & { open: number; high: number; low: number; close: number } {
  return Number.isFinite(Date.parse(sample.timestamp)) &&
    [sample.open, sample.high, sample.low, sample.close]
      .every((price) => price !== null && Number.isFinite(price) && price > 0);
}

/** Devuelve UNA señal por empresa (la última; la confirmada manda sobre la temprana), de más reciente a más antigua. */
function createSignals(samples: BullishImpulseSample[], visibleSince: number): BullishSignal[] {
  const samplesByCompany = new Map<number, BullishImpulseSample[]>();
  for (const sample of samples) {
    const companySamples = samplesByCompany.get(sample.companyId) ?? [];
    companySamples.push(sample);
    samplesByCompany.set(sample.companyId, companySamples);
  }

  const bestByCompany = new Map<number, BullishSignal>();
  for (const [companyId, companySamples] of samplesByCompany) {
    companySamples.sort((first, second) => Date.parse(first.timestamp) - Date.parse(second.timestamp));
    const { ticker, nombre } = companySamples[0];
    let segment: IntradayCandle[] = [];
    let segmentDate: string | null = null;

    const scanSegment = () => {
      for (let index = 11; index < segment.length; index++) {
        // Fuera de la ventana visible no se evalúa: solo servía de contexto para las primeras muestras.
        if (segment[index].timestamp.getTime() < visibleSince) continue;
        for (const signal of detectBullishSignals(companyId, ticker, nombre, segment.slice(index - 11, index + 1))) {
          const current = bestByCompany.get(companyId);
          if (!current || isBetterSignal(signal, current)) bestByCompany.set(companyId, signal);
        }
      }
    };

    for (const sample of companySamples) {
      const sampleDate = sample.timestamp.slice(0, 10);
      if (!hasValidPrices(sample)) {
        scanSegment();
        segment = [];
        segmentDate = null;
        continue;
      }

      const sameSession = sampleDate === segmentDate;
      const connectedSample = sameSession &&
        sample.intervalSeconds !== null &&
        sample.intervalSeconds > 0 &&
        sample.intervalSeconds <= MAX_SAMPLE_GAP_SECONDS;

      if (segment.length > 0 && !connectedSample) {
        scanSegment();
        segment = [];
      }

      const intervalVolume = connectedSample &&
        sample.intervalVolume !== null &&
        sample.intervalSeconds !== null
        ? sample.intervalVolume * (STANDARD_SAMPLE_SECONDS / sample.intervalSeconds)
        : null;

      segment.push({
        timestamp: new Date(sample.timestamp),
        open: sample.open,
        high: sample.high,
        low: sample.low,
        close: sample.close,
        volume: intervalVolume,
      });
      segmentDate = sampleDate;
    }

    scanSegment();
  }

  return [...bestByCompany.values()]
    .sort((first, second) => Date.parse(second.detectadaEn) - Date.parse(first.detectadaEn));
}

async function loadBullishImpulseSignals(forceRecalculate = false): Promise<ImpulseResult> {
  try {
    // Consulta de una sola fila: sirve para saber si hay un escaneo nuevo desde la última vez.
    const latestScan = await scanHistoryRepository.getLatestScanStatus();
    const key = latestScan?.scannedAt ?? "sin-escaneos";
    if (!forceRecalculate && cache && cache.key === key && Date.now() - cache.builtAt < CACHE_MAX_AGE_MS) {
      return cache.result;
    }

    const now = Date.now();
    const since = new Date(now - HISTORY_LOOKBACK_HOURS * 60 * 60 * 1000).toISOString();
    const samples = await scanHistoryRepository.getRecentBullishImpulseSamples(since);
    const visibleSince = now - SIGNAL_WINDOW_HOURS * 60 * 60 * 1000;
    const result: ImpulseResult = {
      signals: createSignals(samples, visibleSince),
      scannedAt: latestScan?.scannedAt ?? samples[samples.length - 1]?.timestamp ?? null,
    };
    cache = { key, builtAt: now, result };
    return result;
  } catch (error) {
    console.error("No se pudieron calcular señales desde el historial de escaneos:", error);
    return {
      signals: [],
      scannedAt: null,
      error: "No se pudieron leer las muestras del historial. Aplica la migración de Impulso Alcista y vuelve a intentarlo.",
    };
  }
}

export async function getBullishImpulseSignals(): Promise<ImpulseResult> {
  return loadBullishImpulseSignals();
}

export async function scanBullishImpulseAction(): Promise<
  { success: true; message: string; signals: BullishSignal[] } |
  { success: false; message: string }
> {
  // "Recalcular" ignora la caché y vuelve a leer el historial.
  const result = await loadBullishImpulseSignals(true);
  if (result.error) return { success: false, message: result.error };

  return {
    success: true,
    message: `Señales recalculadas a partir de las muestras guardadas: ${result.signals.length} empresas con señal en las últimas ${SIGNAL_WINDOW_HOURS} h.`,
    signals: result.signals,
  };
}
