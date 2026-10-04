// domain/config/strategy.config.ts
//
// Los parámetros de la estrategia NO viven en el repo: se leen de la variable
// de entorno STRATEGY_CONFIG (JSON en una sola línea), definida en Vercel y en
// .env.local. Solo se puede usar en código de servidor.

if (typeof window !== "undefined") {
  throw new Error("strategy.config solo puede importarse desde código de servidor.");
}

export interface StrategyConfig {
  TRADING: {
    OVERSOLD_THRESHOLD: number;
    TIER1_RSI_THRESHOLD: number;
    MIN_DAILY_VOLUME: number;
    TIME_STOP_DAYS: number;
    MAX_STOP_LOSS_PCT: number;
    MAX_MA_DEVIATION_PCT: number;
    PROFIT_TARGET_PCT: number;
    MIN_CURRENT_RATIO: number;
    MAX_DEBT_TO_EQUITY: number;
    MIN_ROE: number;
  };
  UNIVERSE: {
    TOP: { TARGET_SIZE: number; MIN_MARKET_CAP: number; MIN_DAILY_VOLUME: number };
    MID: {
      TARGET_SIZE: number;
      MIN_MARKET_CAP: number;
      MAX_MARKET_CAP: number;
      MIN_DAILY_VOLUME: number;
    };
    REGIONS: string[];
    TOP_CANDIDATES_PER_REGION: number;
    MID_CANDIDATES_PER_REGION: number;
  };
  YAHOO: {
    DEFAULT_RSI: number;
    RSI_PERIOD: number;
    HISTORY_MONTHS_OFFSET: number;
    BACKTEST_YEARS_OFFSET: number;
    RECENT_LOW_DAYS: number;
    AVG_VOLUME_DAYS: number;
  };
}

type Obj = Record<string, unknown>;

function section(parent: Obj, key: string, path: string): Obj {
  const value = parent[key];
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`STRATEGY_CONFIG: falta la sección "${path}${key}".`);
  }
  return value as Obj;
}

function num(parent: Obj, key: string, path: string): number {
  const value = parent[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`STRATEGY_CONFIG: "${path}${key}" debe ser un número.`);
  }
  return value;
}

function days(parent: Obj, key: string, path: string): number {
  const value = num(parent, key, path);
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`STRATEGY_CONFIG: "${path}${key}" debe ser un número entero de días (1 o más).`);
  }
  return value;
}

function strings(parent: Obj, key: string, path: string): string[] {
  const value = parent[key];
  if (!Array.isArray(value) || value.length === 0 || value.some((v) => typeof v !== "string")) {
    throw new Error(`STRATEGY_CONFIG: "${path}${key}" debe ser una lista de textos.`);
  }
  return value as string[];
}

function parseStrategyConfig(): StrategyConfig {
  const raw = process.env.STRATEGY_CONFIG;
  if (!raw) {
    throw new Error("Falta la variable de entorno STRATEGY_CONFIG.");
  }

  let json: Obj;
  try {
    json = JSON.parse(raw) as Obj;
  } catch {
    throw new Error("STRATEGY_CONFIG no es un JSON válido.");
  }

  const t = section(json, "TRADING", "");
  const u = section(json, "UNIVERSE", "");
  const uTop = section(u, "TOP", "UNIVERSE.");
  const uMid = section(u, "MID", "UNIVERSE.");
  const y = section(json, "YAHOO", "");

  return {
    TRADING: {
      OVERSOLD_THRESHOLD: num(t, "OVERSOLD_THRESHOLD", "TRADING."),
      TIER1_RSI_THRESHOLD: num(t, "TIER1_RSI_THRESHOLD", "TRADING."),
      MIN_DAILY_VOLUME: num(t, "MIN_DAILY_VOLUME", "TRADING."),
      TIME_STOP_DAYS: num(t, "TIME_STOP_DAYS", "TRADING."),
      MAX_STOP_LOSS_PCT: num(t, "MAX_STOP_LOSS_PCT", "TRADING."),
      MAX_MA_DEVIATION_PCT: num(t, "MAX_MA_DEVIATION_PCT", "TRADING."),
      PROFIT_TARGET_PCT: num(t, "PROFIT_TARGET_PCT", "TRADING."),
      MIN_CURRENT_RATIO: num(t, "MIN_CURRENT_RATIO", "TRADING."),
      MAX_DEBT_TO_EQUITY: num(t, "MAX_DEBT_TO_EQUITY", "TRADING."),
      MIN_ROE: num(t, "MIN_ROE", "TRADING."),
    },
    UNIVERSE: {
      TOP: {
        TARGET_SIZE: num(uTop, "TARGET_SIZE", "UNIVERSE.TOP."),
        MIN_MARKET_CAP: num(uTop, "MIN_MARKET_CAP", "UNIVERSE.TOP."),
        MIN_DAILY_VOLUME: num(uTop, "MIN_DAILY_VOLUME", "UNIVERSE.TOP."),
      },
      MID: {
        TARGET_SIZE: num(uMid, "TARGET_SIZE", "UNIVERSE.MID."),
        MIN_MARKET_CAP: num(uMid, "MIN_MARKET_CAP", "UNIVERSE.MID."),
        MAX_MARKET_CAP: num(uMid, "MAX_MARKET_CAP", "UNIVERSE.MID."),
        MIN_DAILY_VOLUME: num(uMid, "MIN_DAILY_VOLUME", "UNIVERSE.MID."),
      },
      REGIONS: strings(u, "REGIONS", "UNIVERSE."),
      TOP_CANDIDATES_PER_REGION: num(u, "TOP_CANDIDATES_PER_REGION", "UNIVERSE."),
      MID_CANDIDATES_PER_REGION: num(u, "MID_CANDIDATES_PER_REGION", "UNIVERSE."),
    },
    YAHOO: {
      DEFAULT_RSI: num(y, "DEFAULT_RSI", "YAHOO."),
      RSI_PERIOD: num(y, "RSI_PERIOD", "YAHOO."),
      HISTORY_MONTHS_OFFSET: num(y, "HISTORY_MONTHS_OFFSET", "YAHOO."),
      BACKTEST_YEARS_OFFSET: num(y, "BACKTEST_YEARS_OFFSET", "YAHOO."),
      RECENT_LOW_DAYS: days(y, "RECENT_LOW_DAYS", "YAHOO."),
      AVG_VOLUME_DAYS: days(y, "AVG_VOLUME_DAYS", "YAHOO."),
    },
  };
}

export const STRATEGY_CONFIG: StrategyConfig = parseStrategyConfig();