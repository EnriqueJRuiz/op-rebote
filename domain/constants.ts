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