"use server";

import { revalidatePath } from "next/cache";

import { APP_CONFIG, APP_ROUTES, getDividendTier } from "@/domain/constants";
import { UI_TEXT } from "@/domain/literales.constantes";
import { CompanyRecord, StockCandidate } from "@/domain/models/trading";
import { createApplicationDependencies } from "@/infrastructure/composition";

const MAX_CONCURRENT_COMPANIES = 8;

type ScanOutcome = { company: CompanyRecord; classifiedCandidate: StockCandidate };

export async function handleSearchReboundsAction() {
  try {
    const { marketRepository, companiesRepository, scanHistoryRepository, scanMarket, runBacktest } = createApplicationDependencies();

    const companies = await companiesRepository.getCompanies();
    const loteId = crypto.randomUUID();

    const results: PromiseSettledResult<StockCandidate>[] = [];

    for (
      let index = 0;
      index < companies.length;
      index += MAX_CONCURRENT_COMPANIES
    ) {
      const batch = companies.slice(
        index,
        index + MAX_CONCURRENT_COMPANIES
      );

      const batchResults = await Promise.allSettled(
        batch.map(async (company): Promise<ScanOutcome> => {
          const dividendTier = getDividendTier(company.ticker);
          const dividendTierChanged = company.dividend_tier !== dividendTier;

          const metadataMissing =
            !company.tipo_activo ||
            !company.sector ||
            company.sector === "Desconocido" ||
            !company.fundamentales_actualizados_en ||
            dividendTierChanged;

          const snapshot = await marketRepository.getCompanySnapshot(
            company.ticker,
            metadataMissing
          );

          const metadataChanged =
            snapshot.metadata &&
            (
              company.tipo_activo !== snapshot.metadata.tipoActivo ||
              company.es_dividendo !== snapshot.metadata.esDividendo ||
              company.sector !== snapshot.metadata.sector
            );

          if (
            snapshot.metadata &&
            (metadataChanged ||
              company.nombre !== snapshot.stock.nombre ||
              company.dividend_tier !== dividendTier)
          ) {
            await companiesRepository.updateCompanyMetadataByTicker(
              company.ticker,
              snapshot.stock.nombre,
              snapshot.metadata
            );
          }

          const rawStock: StockCandidate = {
            ...snapshot.stock,
            categoria: company.categoria,
            currentRatio: snapshot.metadata?.currentRatio ?? company.current_ratio,
            debtToEquity: snapshot.metadata?.debtToEquity ?? company.debt_to_equity,
            returnOnEquity: snapshot.metadata?.returnOnEquity ?? company.return_on_equity,
            dividendTier,
            esValido: false,
          };

          const evaluatedCandidate = scanMarket.evaluateStockData(rawStock);
          const classifiedCandidate = scanMarket.classifyCandidate(evaluatedCandidate);

          return { company, classifiedCandidate };
        })
      );

      const fulfilled = batchResults.filter(
        (r): r is PromiseFulfilledResult<ScanOutcome> => r.status === "fulfilled"
      );

      if (fulfilled.length > 0) {
        await scanHistoryRepository.saveScanResults(
          fulfilled.map(({ value }) => ({
            companyId: value.company.id,
            stock: value.classifiedCandidate,
            loteId,
          }))
        );
      }

      for (const { value } of fulfilled) {
        const { company, classifiedCandidate } = value;

        if (
          classifiedCandidate.tier === APP_CONFIG.CATEGORIES.TIER_0 ||
          classifiedCandidate.tier === APP_CONFIG.CATEGORIES.TIER_1 ||
          classifiedCandidate.tier === APP_CONFIG.CATEGORIES.TOP ||
          classifiedCandidate.tier === APP_CONFIG.CATEGORIES.MID
        ) {
          try {
            await runBacktest.execute(company.id, company.ticker);
          } catch (backtestError) {
            console.error(
              `Error al calcular el backtest de ${company.ticker}:`,
              backtestError
            );
          }
        }
      }

      results.push(
        ...batchResults.map((r): PromiseSettledResult<StockCandidate> =>
          r.status === "fulfilled"
            ? { status: "fulfilled", value: r.value.classifiedCandidate }
            : r
        )
      );
    }

    const opportunities = await scanHistoryRepository.getLatestOpportunities();

    revalidatePath(APP_ROUTES.OPORTUNIDADES);
    revalidatePath(APP_ROUTES.EMPRESAS_RADAR);

    return {
      success: true,
      opportunities,
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