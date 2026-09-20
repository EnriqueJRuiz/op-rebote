// app/actions/sync-market.ts
"use server";

import { YahooFinanceAdapter } from "@/infrastructure/yahoo-finance/yahoo-finance.adapter";
import { SupabaseCompaniesRepository } from "@/infrastructure/repositories/supabase-companies.repository";
import { ScanMarketUseCase } from "@/application/use-cases/scan-market.use-case";
import { revalidatePath } from "next/cache";
import { APP_ROUTES } from "@/domain/constants";

export async function handleSyncMarketAction() {
  try {
    // 1. Instanciamos adaptadores
    const marketAdapter = new YahooFinanceAdapter();
    const companiesRepo = new SupabaseCompaniesRepository();
    const scanUseCase = new ScanMarketUseCase(marketAdapter);

    // 2. Obtenemos el universo real de Yahoo (Top-Caps y Mid-Caps)
    const universo = await scanUseCase.getInitialUniverse();

    if (!universo || universo.length === 0) {
      return { success: false, message: "No se encontraron empresas en Yahoo." };
    }

    // 3. Guardamos en Supabase las que no existan
    await companiesRepo.saveNewCompanies(universo);

    // 4. Refrescar la ruta donde se muestran las empresas
    revalidatePath(APP_ROUTES.EMPRESAS_RADAR);

    return { 
      success: true, 
      message: `¡Sincronización completada! Se procesaron ${universo.length} empresas del mercado.` 
    };
  } catch (error) {
    console.error("Error en handleSyncMarketAction:", error);
    return { success: false, message: "Hubo un error al guardar en la base de datos." };
  }
}