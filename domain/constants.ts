// lib/constants.ts

import { UI_TEXT } from "./literales.constantes";

export const APP_CONFIG = {
  NAME: "Operación Rebote para Torpes",
  BASE_CURRENCY: "EUR",
  INITIAL_CAPITAL_TEST: 100,
  MONTHLY_CONTRIBUTION: 25,

  BROKER: {
    // Comisión fija por orden (compra o venta), en BASE_CURRENCY. Es el valor propuesto al cerrar una operación.
    COMMISSION_PER_ORDER: 1,
  },

  DB: {
    TABLES: {
      EMPRESAS: "empresas",
      OPERACIONES: "operaciones",
    },
    COLUMNS: {
      TICKER: "ticker",
    },
    DEFAULTS: {
      SECTOR: "Desconocido",
      ETF_SECTOR: "ETF",
      ASSET_TYPE: "STOCK",
    },
  },

  // Tipos de activo de Yahoo Finance (quoteType) que se pueden añadir al radar.
  ASSET_TYPES: {
    EQUITY: "EQUITY",
    ETF: "ETF",
  },

  CATEGORIES: {
  TOP: "TOP" as const,
  MID: "MID" as const,
  TIER_0: "TIER_0" as const,
  TIER_1: "TIER_1" as const,
},
  
} as const;

// Periodo de la media móvil simple usada como referencia de tendencia (SMA200)
export const SMA_PERIOD = 200;

export const APP_ROUTES = {
  HOME: "/",
  OPORTUNIDADES: "/oportunidades",
  SEGUIMIENTO: "/seguimiento",
  EMPRESAS_RADAR: "/companies",
  IMPULSO_ALCISTA: "/impulso-alcista",
  OPERACIONES: "/operaciones",
} as const;

export const DIVIDEND_KINGS = [
  "ABBV", "ABT", "ABM", "ADM", "ADP", "APD", "AWR", "BDX", "BF.B", "BKH",
  "CBSH", "CINF", "CL", "CWT", "DOV", "ED", "EMR", "FRT", "FUL", "GPC",
  "GRC", "GWW", "HRL", "ITW", "JNJ", "KO", "KMB", "LOW", "MCD", "MGEE",
  "MO", "MSA", "MSEX", "NDSN", "NFG", "NUE", "PEP", "PG", "PH", "PPG",
  "RLI", "RPM", "SCL", "SPGI", "SWK", "SYY", "TDS", "TGT", "TNC", "TR",
  "UVV", "WMT",
] as const;

export const DIVIDEND_ARISTOCRATS = [
  "ABBV", "ABT", "ADM", "ADP", "AFL", "ALB", "AMCR", "APD", "ATO", "BDX",
  "BEN", "BF.B", "BRO", "CAH", "CAT", "CB", "CHD", "CHRW", "CINF", "CL",
  "CLX", "CTAS", "CVS", "CVX", "DOV", "ECL", "ED", "EMR", "ERIE", "ES",
  "ETN", "EXPD", "FAST", "FDS", "FRT", "GD", "GPC", "GWW", "HRL", "IBM",
  "ITW", "JKHY", "JNJ", "KMB", "KO", "LIN", "LOW", "MCD", "MDT", "MKC",
  "NDSN", "NEE", "NUE", "O", "PEP", "PG", "PH", "PNR", "PPG", "ROP",
  "RPM", "SHW", "SJM", "SPGI", "SWK", "SYY", "TGT", "TROW", "WMT", "WST", "XOM",
] as const;

export const DIVIDEND_TIERS = {
  KING: "G",
  ARISTOCRAT: "S",
} as const;

export type DividendTier = typeof DIVIDEND_TIERS[keyof typeof DIVIDEND_TIERS] | null;

export function getDividendTier(ticker: string): DividendTier {
  if ((DIVIDEND_KINGS as readonly string[]).includes(ticker)) return DIVIDEND_TIERS.KING;
  if ((DIVIDEND_ARISTOCRATS as readonly string[]).includes(ticker)) return DIVIDEND_TIERS.ARISTOCRAT;
  return null;
}

// ==========================================
// BOLSAS Y SESIONES DE MERCADO
// ==========================================

export const BOLSAS_AMERICANA: string[] = [
  'NYSE', 
  'NasdaqCM', 
  'NasdaqGM', 
  'NasdaqGS', 
  'OTC Markets OTCPK',
];

export const BOLSAS_CANADIENSE: string[] = [
  'Canadian Sec',
];

export const BOLSAS_REINO_UNIDO: string[] = [
  'Cboe UK', 
  'LSE',
];

export const BOLSAS_EUROPEA: string[] = [
  'Amsterdam', 
  'Brussels', 
  'Copenhagen', 
  'Helsinki', 
  'Lisbon', 
  'Milan', 
  'Oslo', 
  'Paris', 
  'Stockholm', 
  'XETRA', 
  'Hanover', 
  'MCE', 
  'Swiss', 
  'IOB',
];

// Aliases de compatibilidad
export const AMERICANA = BOLSAS_AMERICANA;
export const CANADIENSE = BOLSAS_CANADIENSE;
export const UK_SUIZA = BOLSAS_REINO_UNIDO;
export const EUROPEA = BOLSAS_EUROPEA;

export const MARKET_SESSIONS = {
  ALL: "all",
  AMERICANA: "AMERICANA",
  EUROPEA: "EUROPEA",
  CANADIENSE: "CANADIENSE",
  REINO_UNIDO_SUIZA: "REINO_UNIDO_SUIZA",
} as const;

export type MarketSessionFilter = typeof MARKET_SESSIONS[keyof typeof MARKET_SESSIONS]

export const MARKET_SESSION_OPTIONS = [
  { value: MARKET_SESSIONS.ALL, label: UI_TEXT.table.filters.sessionAll },
  { value: MARKET_SESSIONS.AMERICANA, label: UI_TEXT.table.filters.sessionAmericana },
  { value: MARKET_SESSIONS.EUROPEA, label: UI_TEXT.table.filters.sessionEuropea },
  { value: MARKET_SESSIONS.REINO_UNIDO_SUIZA, label: UI_TEXT.table.filters.sessionReinoUnido },
  { value: MARKET_SESSIONS.CANADIENSE, label: UI_TEXT.table.filters.sessionCanada },
];