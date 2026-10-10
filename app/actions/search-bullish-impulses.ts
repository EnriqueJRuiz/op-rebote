"use server";

import { BullishImpulseSample, BullishSignal, IntradayCandle } from "@/domain/models/bullish-impulse";
import { detectBullishSignals } from "@/domain/rules/bullish-impulse.rules";
import { createApplicationDependencies } from "@/infrastructure/composition";

const HISTORY_LOOKBACK_DAYS = 4;
const MAX_SAMPLE_GAP_SECONDS = 30 * 60;
const STANDARD_SAMPLE_SECONDS = 10 * 60;
const MAX_SIGNALS = 500;

function hasValidPrices(
  sample: BullishImpulseSample
): sample is BullishImpulseSample & { open: number; high: number; low: number; close: number } {
  return Number.isFinite(Date.parse(sample.timestamp)) &&
    [sample.open, sample.high, sample.low, sample.close]
      .every((price) => price !== null && Number.isFinite(price) && price > 0);
}

function createSignals(samples: BullishImpulseSample[]): BullishSignal[] {
  const samplesByTicker = new Map<string, BullishImpulseSample[]>();
  for (const sample of samples) {
    const tickerSamples = samplesByTicker.get(sample.ticker) ?? [];
    tickerSamples.push(sample);
    samplesByTicker.set(sample.ticker, tickerSamples);
  }

  const signals: BullishSignal[] = [];
  for (const [ticker, tickerSamples] of samplesByTicker) {
    let segment: IntradayCandle[] = [];
    let segmentDate: string | null = null;

    const scanSegment = () => {
      for (let index = 11; index < segment.length; index++) {
        signals.push(...detectBullishSignals(
          tickerSamples[0].companyId,
          ticker,
          tickerSamples[0].nombre,
          segment.slice(index - 11, index + 1)
        ));
      }
    };

    for (const sample of tickerSamples) {
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

  return signals
    .sort((first, second) => Date.parse(second.detectadaEn) - Date.parse(first.detectadaEn))
    .slice(0, MAX_SIGNALS);
}

async function loadBullishImpulseSignals(): Promise<{
  signals: BullishSignal[];
  scannedAt: string | null;
  error?: string;
}> {
  try {
    const { scanHistoryRepository } = createApplicationDependencies();
    const since = new Date(Date.now() - HISTORY_LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const samples = await scanHistoryRepository.getRecentBullishImpulseSamples(since);
    const signals = createSignals(samples);
    return { signals, scannedAt: samples[samples.length - 1]?.timestamp ?? null };
  } catch (error) {
    console.error("No se pudieron calcular señales desde el historial de escaneos:", error);
    return {
      signals: [],
      scannedAt: null,
      error: "No se pudieron leer las muestras del historial. Aplica la migración de Impulso Alcista y vuelve a intentarlo.",
    };
  }
}

export async function getBullishImpulseSignals(): Promise<{
  signals: BullishSignal[];
  scannedAt: string | null;
  error?: string;
}> {
  return loadBullishImpulseSignals();
}

export async function scanBullishImpulseAction(): Promise<
  { success: true; message: string; signals: BullishSignal[] } |
  { success: false; message: string }
> {
  const result = await loadBullishImpulseSignals();
  if (result.error) return { success: false, message: result.error };

  return {
    success: true,
    message: `Señales recalculadas a partir de las muestras guardadas: ${result.signals.length} detectadas.`,
    signals: result.signals,
  };
}
