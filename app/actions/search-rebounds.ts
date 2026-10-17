"use server";

import { revalidatePath } from "next/cache";
import { APP_ROUTES } from "@/domain/constants";
import { UI_TEXT } from "@/domain/literales.constantes";
import { createApplicationDependencies } from "@/infrastructure/composition";

export async function handleSearchReboundsAction() {
  try {
    const { scanRebounds } = createApplicationDependencies();
    const result = await scanRebounds.execute();
    revalidatePath(APP_ROUTES.OPORTUNIDADES);
    revalidatePath(APP_ROUTES.EMPRESAS_RADAR);

    if (!result.success) {
      return { ...result, message: UI_TEXT.feedback.searchFailure };
    }

    return {
      ...result,
      message: UI_TEXT.feedback.searchCompleted(result.totalCompanies, result.opportunities.length),
    };
  } catch (error) {
    console.error("Error al buscar oportunidades de rebote:", error);
    return { success: false, opportunities: [], message: UI_TEXT.feedback.searchFailure };
  }
}
