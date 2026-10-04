"use server";

import { revalidatePath } from "next/cache";

import { APP_ROUTES, getDividendTier } from "@/domain/constants";
import { UI_TEXT } from "@/domain/literales.constantes";
import { CompanyRecord, StockCandidate } from "@/domain/models/trading";
import { createApplicationDependencies } from "@/infrastructure/composition";

// Empresas que se consultan a la vez (mismo valor que antes: no aumenta la presión sobre Yahoo)
const MAX_CONCURRENT_COMPANIES = 8;
// Cuántas empresas se agrupan en cada inserción en base de datos
const SAVE_CHUNK_SIZE = 8;
// Backtests simultáneos (solo de las candidatas válidas, que son pocas)
const MAX_CONCURRENT_BACKTESTS = 3;

// Los metadatos de cada empresa (fundamentales, dividendos, sector, industria…) se vuelven a
// descargar cuando tienen más de estos días.
const METADATA_REFRESH_DAYS = 30;
// Máximo de empresas con datos caducados que se refrescan en un mismo escaneo (empezando por las
// más antiguas), para repartir la carga en varios días en vez de refrescar todas de golpe.
const MAX_METADATA_REFRESHES_PER_SCAN = 40;
// Si Yahoo no tenía sector ("Desconocido"), se reintenta como mucho cada tantos días.
const UNKNOWN_SECTOR_RETRY_DAYS = 7;
const DAY_MS = 86_400_000;

function daysSince(isoDate?: string | null): number {
  if (!isoDate) return Infinity;
  const time = Date.parse(isoDate);
  return Number.isNaN(time) ? Infinity : (Date.now() - time) / DAY_MS;
}

type ScanOutcome = { company: CompanyRecord; classifiedCandidate: StockCandidate };

/**
 * Cola de concurrencia: siempre hay hasta `limit` elementos en curso y, en cuanto uno termina,
 * entra el siguiente (sin esperar a que acabe toda una tanda).
 */
async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let next = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await worker(item);
    }
  });

  await Promise.all(runners);
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function seconds(ms: number): string {
  return (ms / 1000).toFixed(1);
}

export async function handleSearchReboundsAction() {
  try {
    const { marketRepository, companiesRepository, scanHistoryRepository, scanMarket, runBacktest } = createApplicationDependencies();

    const startedAt = performance.now();

    const companies = await companiesRepository.getCompanies();
    const loteId = crypto.randomUUID();

    const staleCompanyIds = new Set(
      companies
        .filter((company) => daysSince(company.fundamentales_actualizados_en) >= METADATA_REFRESH_DAYS)
        .filter((company) => company.fundamentales_actualizados_en)
        .sort((a, b) => daysSince(b.fundamentales_actualizados_en) - daysSince(a.fundamentales_actualizados_en))
        .slice(0, MAX_METADATA_REFRESHES_PER_SCAN)
        .map((company) => company.id)
    );

    const failures: string[] = [];
    const savedOutcomes: ScanOutcome[] = [];
    const companyTimings: { ticker: string; ms: number }[] = [];
    let saveMs = 0;
    let saveCalls = 0;

    let buffer: ScanOutcome[] = [];
    let aborted = false;

    const scanCompany = async (company: CompanyRecord): Promise<ScanOutcome> => {
      const dividendTier = getDividendTier(company.ticker);
      const dividendTierChanged = company.dividend_tier !== dividendTier;

      const sectorUnknownDue =
        company.sector === "Desconocido" &&
        daysSince(company.fundamentales_actualizados_en) >= UNKNOWN_SECTOR_RETRY_DAYS;

      const metadataMissing =
        !company.tipo_activo ||
        !company.sector ||
        sectorUnknownDue ||
        !company.fundamentales_actualizados_en ||
        dividendTierChanged;

      const metadataDue = metadataMissing || staleCompanyIds.has(company.id);

      const snapshot = await marketRepository.getCompanySnapshot(
        company.ticker,
        metadataDue
      );

      // En un refresco, si Yahoo devuelve los fundamentales vacíos (fallo puntual), se conservan los
      // anteriores en vez de sobrescribirlos con ceros.
      let metadata = snapshot.metadata;
      if (metadata && company.fundamentales_actualizados_en) {
        const fundamentalsEmpty = [
          metadata.currentRatio, metadata.debtToEquity, metadata.returnOnEquity,
          metadata.profitMargin, metadata.freeCashFlow, metadata.totalCash, metadata.totalDebt,
        ].every((value) => !value);

        if (fundamentalsEmpty) {
          metadata = {
            ...metadata,
            currentRatio: company.current_ratio ?? metadata.currentRatio,
            debtToEquity: company.debt_to_equity ?? metadata.debtToEquity,
            returnOnEquity: company.return_on_equity ?? metadata.returnOnEquity,
            profitMargin: company.profit_margin ?? metadata.profitMargin,
            freeCashFlow: company.free_cash_flow ?? metadata.freeCashFlow,
            totalCash: company.total_cash ?? metadata.totalCash,
            totalDebt: company.total_debt ?? metadata.totalDebt,
          };
        }
      }

      // Siempre que se descargan metadatos se guardan (aunque no haya cambiado nada), para que la
      // fecha de actualización se renueve y la empresa no vuelva a descargarse en cada escaneo.
      if (metadata) {
        await companiesRepository.updateCompanyMetadataByTicker(
          company.ticker,
          snapshot.stock.nombre,
          metadata
        );
      }

      const rawStock: StockCandidate = {
        ...snapshot.stock,
        categoria: company.categoria,
        currentRatio: metadata?.currentRatio ?? company.current_ratio,
        debtToEquity: metadata?.debtToEquity ?? company.debt_to_equity,
        returnOnEquity: metadata?.returnOnEquity ?? company.return_on_equity,
        dividendTier,
        esValido: false,
      };

      const evaluatedCandidate = scanMarket.evaluateStockData(rawStock);
      const classifiedCandidate = scanMarket.classifyCandidate(evaluatedCandidate);

      return { company, classifiedCandidate };
    };

    const flush = async (chunk: ScanOutcome[]) => {
      if (chunk.length === 0) return;

      const t0 = performance.now();
      await scanHistoryRepository.saveScanResults(
        chunk.map((outcome) => ({
          companyId: outcome.company.id,
          stock: outcome.classifiedCandidate,
          loteId,
        }))
      );
      saveMs += performance.now() - t0;
      saveCalls++;
      savedOutcomes.push(...chunk);
    };

    // 1) Escaneo de todas las empresas con cola de concurrencia
    await runPool(companies, MAX_CONCURRENT_COMPANIES, async (company) => {
      if (aborted) return;

      const t0 = performance.now();
      let outcome: ScanOutcome;
      try {
        outcome = await scanCompany(company);
      } catch (error) {
        failures.push(`${company.ticker}: ${errorMessage(error)}`);
        return;
      }
      companyTimings.push({ ticker: company.ticker, ms: performance.now() - t0 });

      buffer.push(outcome);
      if (buffer.length >= SAVE_CHUNK_SIZE) {
        const chunk = buffer;
        buffer = [];
        try {
          await flush(chunk);
        } catch (error) {
          aborted = true; // un fallo al guardar detiene el escaneo, como antes
          throw error;
        }
      }
    });
    await flush(buffer);

    // 2) Backtest de las candidatas que pasan los filtros (las que salen en la lista de oportunidades).
    // OJO: classifyCandidate asigna siempre un tier, así que comprobar el tier no filtraba nada.
    const backtestStartedAt = performance.now();
    const validOutcomes = savedOutcomes.filter(({ classifiedCandidate }) => classifiedCandidate.esValido);

    await runPool(validOutcomes, MAX_CONCURRENT_BACKTESTS, async ({ company }) => {
      try {
        await runBacktest.execute(company.id, company.ticker);
      } catch (backtestError) {
        console.error(`Error al calcular el backtest de ${company.ticker}:`, backtestError);
      }
    });
    const backtestMs = performance.now() - backtestStartedAt;

    const savedCount = savedOutcomes.length;
    console.log(`Escaneo: ${savedCount} guardadas, ${failures.length} fallidas de ${companies.length} empresas.`);
    if (failures.length > 0) {
      console.warn("Primeros fallos del escaneo:", failures.slice(0, 10));
    }

    const summaryStartedAt = performance.now();
    const opportunities = await scanHistoryRepository.getLatestOpportunities();
    const summaryMs = performance.now() - summaryStartedAt;

    revalidatePath(APP_ROUTES.OPORTUNIDADES);
    revalidatePath(APP_ROUTES.EMPRESAS_RADAR);

    // Tiempos para ver dónde se va el rato (Vercel → Logs)
    const sorted = [...companyTimings].sort((a, b) => b.ms - a.ms);
    const average = companyTimings.length > 0
      ? companyTimings.reduce((sum, t) => sum + t.ms, 0) / companyTimings.length
      : 0;
    console.log(
      `Tiempos (s): total ${seconds(performance.now() - startedAt)}` +
      ` | por empresa (Yahoo+proceso): media ${Math.round(average)} ms,` +
      ` máx ${Math.round(sorted[0]?.ms ?? 0)} ms (${sorted[0]?.ticker ?? "-"})` +
      ` | guardado: ${saveCalls} inserciones, ${seconds(saveMs)}` +
      ` | backtest: ${validOutcomes.length} empresas, ${seconds(backtestMs)}` +
      ` | resumen: ${seconds(summaryMs)}`
    );
    if (sorted.length > 0) {
      console.log(
        "Empresas más lentas:",
        sorted.slice(0, 5).map((t) => `${t.ticker} ${Math.round(t.ms)} ms`).join(", ")
      );
    }

    return {
      success: true,
      opportunities,
      scanned: savedCount,
      failed: failures.length,
      message: UI_TEXT.feedback.searchCompleted(companies.length, opportunities.length),
    };
  } catch (error) {
    console.error("Error al buscar oportunidades de rebote:", error);

    return {
      success: false,
      opportunities: [],
      message: UI_TEXT.feedback.searchFailure,
    };
  }
}