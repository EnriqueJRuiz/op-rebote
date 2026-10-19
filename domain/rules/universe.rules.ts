import { STRATEGY_CONFIG } from "@/domain/config/strategy.config";
import { AMERICANA, CANADIENSE, EUROPEA, MARKET_SESSIONS, UK_SUIZA } from "@/domain/constants";

export const UNIVERSE_RULES = STRATEGY_CONFIG.UNIVERSE;

export function obtenerSesionMercado(bolsa: string | null): string {
  if (!bolsa) return 'Otra';

  if (AMERICANA.includes(bolsa)) return MARKET_SESSIONS.AMERICANA;
  if (EUROPEA.includes(bolsa)) return MARKET_SESSIONS.EUROPEA;
  if (UK_SUIZA.includes(bolsa)) return MARKET_SESSIONS.REINO_UNIDO_SUIZA;
  if (CANADIENSE.includes(bolsa)) return MARKET_SESSIONS.CANADIENSE;

  return MARKET_SESSIONS.ALL;
}