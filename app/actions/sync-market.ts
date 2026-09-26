// app/actions/sync-market.ts
"use server";

import { createApplicationDependencies } from "@/infrastructure/composition";
import { revalidatePath } from "next/cache";
import { APP_ROUTES } from "@/domain/constants";
import { UI_TEXT } from "@/domain/literales.constantes";

export async function handleSyncMarketAction() {
  try {
    const { syncMarketUniverse } = createApplicationDependencies();
    const processedCompanies = await syncMarketUniverse.execute();

    if (processedCompanies === 0) {
      return { success: false, message: UI_TEXT.feedback.noYahooCompanies };
    }

    // 4. Refrescar la ruta donde se muestran las empresas
    revalidatePath(APP_ROUTES.EMPRESAS_RADAR);

    return { 
      success: true, 
      message: UI_TEXT.feedback.syncCompleted(processedCompanies)
    };
  } catch (error) {
    console.error("Error en handleSyncMarketAction:", error);
    return { success: false, message: UI_TEXT.feedback.syncDatabaseError };
  }
}