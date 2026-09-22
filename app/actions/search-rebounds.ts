"use server";

import { revalidatePath } from "next/cache";

import { APP_ROUTES } from "@/domain/constants";
import { StockCandidate } from "@/domain/models/trading";
import { createApplicationDependencies } from "@/infrastructure/composition";

const MAX_CONCURRENT_COMPANIES = 8;

export async function handleSearchReboundsAction() {
  try {
    const { marketRepository, companiesRepository, scanMarket } = createApplicationDependencies();
    const companies = await companiesRepository.getCompanies();
    const loteId = crypto.randomUUID();

    const results: PromiseSettledResult<StockCandidate>[] = [];
    for (let index = 0; index < companies.length; index += MAX_CONCURRENT_COMPANIES) {
      const batch = companies.slice(index, index + MAX_CONCURRENT_COMPANIES);
      const batchResults = await Promise.allSettled(
        batch.map(async (company) => {
        const metadataMissing =
          !company.tipo_activo ||
          !company.sector ||
          company.sector === "Desconocido" ||
          !company.fundamentales_actualizados_en;
        const snapshot = await marketRepository.getCompanySnapshot(company.ticker, metadataMissing);

        const metadataChanged =
          snapshot.metadata && (
            company.tipo_activo !== snapshot.metadata.tipoActivo ||
            company.es_dividendo !== snapshot.metadata.esDividendo ||
            company.sector !== snapshot.metadata.sector
          );

        if (snapshot.metadata && (metadataChanged || company.nombre !== snapshot.stock.nombre)) {
          await companiesRepository.updateCompanyMetadataByTicker(
            company.ticker,
            snapshot.stock.nombre,
            snapshot.metadata
          );
        }

        const candidate = scanMarket.evaluateStockData({
          ...snapshot.stock,
          categoria: company.categoria,
        });

        await companiesRepository.saveScanResult(company.id, candidate, loteId);
        return candidate;
        })
      );
      results.push(...batchResults);
    }
    const opportunities = results
      .filter((result): result is PromiseFulfilledResult<StockCandidate> => result.status === "fulfilled")
      .map((result) => result.value)
      .filter((candidate) => candidate.esValido);

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