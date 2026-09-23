// lib/constants.ts

export const APP_CONFIG = {
  NAME: "Operación Rebote para Torpes",
  BASE_CURRENCY: "EUR",
  INITIAL_CAPITAL_TEST: 100,
  MONTHLY_CONTRIBUTION: 25,

  // Nuevas constantes para el cálculo de Yahoo Finance / RSI
  YAHOO_CONFIG: {
    DEFAULT_RSI: 50,
    RSI_PERIOD: 14,
    HISTORY_MONTHS_OFFSET: 3,
  },

  DB: {
    TABLES: {
      EMPRESAS: "empresas",
    },
    COLUMNS: {
      TICKER: "ticker",
    },
    DEFAULTS: {
      SECTOR: "Desconocido",
      ASSET_TYPE: "STOCK",
    },
  },

  CATEGORIES: {
    TOP: "TOP" as const,
    MID: "MID" as const,
  },
  
} as const;

export const APP_ROUTES = {
  HOME: "/",
  OPORTUNIDADES: "/oportunidades",
  EMPRESAS_RADAR: "/empresas-radar",
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