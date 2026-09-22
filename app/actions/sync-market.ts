// app/actions/sync-market.ts
"use server";

import { createApplicationDependencies } from "@/infrastructure/composition";
import { revalidatePath } from "next/cache";
import { APP_ROUTES } from "@/domain/constants";

export async function handleSyncMarketAction() {
  try {
    const { syncMarketUniverse } = createApplicationDependencies();
    const processedCompanies = await syncMarketUniverse.execute();

    if (processedCompanies === 0) {
      return { success: false, message: "No se encontraron empresas en Yahoo." };
    }

    // 4. Refrescar la ruta donde se muestran las empresas
    revalidatePath(APP_ROUTES.EMPRESAS_RADAR);

    return { 
      success: true, 
      message: `¡Sincronización completada! Se procesaron ${processedCompanies} empresas del mercado.` 
    };
  } catch (error) {
    console.error("Error en handleSyncMarketAction:", error);
    return { success: false, message: "Hubo un error al guardar en la base de datos." };
  }
}