"use server";

import { IntradayBar } from "@/domain/models/intraday";
import { createApplicationDependencies } from "@/infrastructure/composition";

const TICKER_PATTERN = /^[A-Za-z0-9.\-^=]{1,20}$/;

export async function getCompanyIntradayAction(ticker: string): Promise<
  { bars: IntradayBar[]; error?: never } |
  { bars?: never; error: string }
> {
  if (typeof ticker !== "string" || !TICKER_PATTERN.test(ticker)) {
    return { error: "El ticker seleccionado no es válido." };
  }

  try {
    const { marketRepository } = createApplicationDependencies();
    return { bars: await marketRepository.getIntradayBars(ticker) };
  } catch (error) {
    console.error("No se pudieron cargar las velas intradía de Yahoo:", error);
    return { error: "No se pudieron cargar las velas de Yahoo." };
  }
}
