"use server";

import { revalidatePath } from "next/cache";

import { APP_ROUTES, getDividendTier } from "@/domain/constants";
import { StockCandidate } from "@/domain/models/trading";
import { createApplicationDependencies } from "@/infrastructure/composition";

const MAX_CONCURRENT_COMPANIES = 8;

export async function handleSearchReboundsAction() {
  try {
    const { marketRepository, companiesRepository, scanMarket } =
      createApplicationDependencies();

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
        batch.map(async (company) => {
          const dividendTier = getDividendTier(company.ticker);
          const dividendTierChanged = company.dividend_tier !== dividendTier;

          const metadataMissing =
            !company.tipo_activo ||
            !company.sector ||
            company.sector === "Desconocido" ||
            !company.fundamentales_actualizados_en ||
            dividendTierChanged;

          // ==============================
          // 1. OBTENER TODO DE YAHOO
          // ==============================
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

          // ==============================
          // 2. GUARDAR TODO
          // ==============================
          const rawStock: StockCandidate = {
            ...snapshot.stock,
            categoria: company.categoria,
            currentRatio: snapshot.metadata?.currentRatio ?? company.current_ratio,
            debtToEquity: snapshot.metadata?.debtToEquity ?? company.debt_to_equity,
            returnOnEquity: snapshot.metadata?.returnOnEquity ?? company.return_on_equity,
            dividendTier,
            esValido: false,
          };

          // ==============================
          // 3. FILTRAR / EVALUAR
          // ==============================
          const evaluatedCandidate = scanMarket.evaluateStockData(rawStock);

          // ==============================
          // 4. CLASIFICAR PARA EL FILTRO Y LA PANTALLA
          // ==============================
          const classifiedCandidate = scanMarket.classifyCandidate(evaluatedCandidate);

          await companiesRepository.saveScanResult(
            company.id,
            classifiedCandidate,
            loteId
          );

          return classifiedCandidate;
        })
      );

      results.push(...batchResults);
    }

    // ==============================
    // 5. LEER EL ÚLTIMO LOTE DESDE LA BASE DE DATOS
    // ==============================
    const opportunities = await companiesRepository.getLatestOpportunities();

    revalidatePath(APP_ROUTES.OPORTUNIDADES);
    revalidatePath(APP_ROUTES.EMPRESAS_RADAR);

    return {
      success: true,
      opportunities,
      message: `Se analizaron ${companies.length} empresas del radar y se encontraron ${opportunities.length} rebotes.`,
    };
  } catch (error) {
    console.error("Error al buscar oportunidades de rebote:", error);

    return {
      success: false,
      opportunities: [],
      message: "No se pudieron buscar nuevas oportunidades.",
    };
  }
}