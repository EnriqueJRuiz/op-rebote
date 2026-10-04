"use server";

import { CompanyHistoryPoint } from "@/domain/models/company-history";
import { createApplicationDependencies } from "@/infrastructure/composition";

export async function getCompanyHistoryAction(companyId: number): Promise<
  { points: CompanyHistoryPoint[]; error?: never } |
  { points?: never; error: string }
> {
  if (!Number.isSafeInteger(companyId) || companyId <= 0) {
    return { error: "La empresa seleccionada no es válida." };
  }

  try {
    const { scanHistoryRepository } = createApplicationDependencies();
    return { points: await scanHistoryRepository.getRecentCompanyHistory(companyId) };
  } catch (error) {
    console.error("No se pudo cargar el historial de la empresa:", error);
    return { error: "No se pudo cargar el historial. Inténtalo de nuevo." };
  }
}
