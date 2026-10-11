// Convierte un ticker de Yahoo Finance (el que usa la app) al símbolo "BOLSA:TICKER" de TradingView.
// Los tickers de EE. UU. no llevan sufijo en Yahoo: se pasan sin bolsa y TradingView resuelve el listado principal.

const YAHOO_SUFFIX_TO_TRADINGVIEW_EXCHANGE: Record<string, string> = {
  MC: "BME",
  DE: "XETR",
  F: "FWB",
  PA: "EURONEXT",
  AS: "EURONEXT",
  BR: "EURONEXT",
  LS: "EURONEXT",
  IR: "EURONEXT",
  MI: "MIL",
  L: "LSE",
  SW: "SIX",
  ST: "OMXSTO",
  CO: "OMXCOP",
  HE: "OMXHEX",
  OL: "OSL",
  VI: "VIE",
  T: "TSE",
  HK: "HKEX",
  SS: "SSE",
  SZ: "SZSE",
  KS: "KRX",
  KQ: "KRX",
  TW: "TWSE",
  SI: "SGX",
  AX: "ASX",
  NZ: "NZX",
  TO: "TSX",
  V: "TSXV",
  NS: "NSE",
  BO: "BSE",
  SA: "BMFBOVESPA",
  MX: "BMV",
  TA: "TASE",
  JO: "JSE",
};

const NORDIC_EXCHANGES = new Set(["OMXSTO", "OMXCOP", "OMXHEX"]);

export function toTradingViewSymbol(yahooTicker: string): string {
  const ticker = yahooTicker.trim().toUpperCase();
  const dotIndex = ticker.lastIndexOf(".");

  if (dotIndex > 0) {
    const exchange = YAHOO_SUFFIX_TO_TRADINGVIEW_EXCHANGE[ticker.slice(dotIndex + 1)];
    if (exchange) {
      let base = ticker.slice(0, dotIndex);
      // Hong Kong: Yahoo "0700.HK" -> TradingView "HKEX:700"
      if (exchange === "HKEX") base = base.replace(/^0+/, "") || "0";
      // Clases de acciones: Yahoo "NOVO-B.CO" -> "NOVO_B" (países nórdicos); "BT-A.L" -> "BT.A" (resto)
      base = base.replace(/-/g, NORDIC_EXCHANGES.has(exchange) ? "_" : ".");
      return `${exchange}:${base}`;
    }
  }

  // EE. UU.: Yahoo "BRK-B" -> TradingView "BRK.B"
  return ticker.replace(/-/g, ".");
}
