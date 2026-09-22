// infrastructure/yahoo-finance/yahoo-screener.mapper.ts

import { UniverseStock } from "@/domain/models/trading";
import { YahooScreenerQuote } from "./yahoo-finance.types";

export class YahooScreenerMapper {

  toUniverseStocks(quotes: YahooScreenerQuote[]): UniverseStock[] {
    return quotes
      .filter((quote) => this.isValidQuote(quote))
      .map((quote) => this.toUniverseStock(quote));
  }

  private isValidQuote(quote: YahooScreenerQuote): boolean {
    return Boolean(quote.symbol) && (quote.marketCap?.raw ?? 0) > 0;
  }

  private toUniverseStock(quote: YahooScreenerQuote): UniverseStock {
    return {
      ticker: quote.symbol,
      nombre: quote.longName || quote.shortName || quote.symbol,
      pais: quote.region,
      sector: undefined,
      industria: undefined,
      tipoActivo: quote.quoteType,
      moneda: quote.currency,
      marketCap: quote.marketCap?.raw ?? 0,
      precio: quote.regularMarketPrice?.raw ?? 0,
      volumen: quote.regularMarketVolume?.raw ?? 0,
      volumenMedio: quote.averageDailyVolume3Month?.raw ?? 0,
      exchange: quote.fullExchangeName || quote.exchange,
      quoteType: quote.quoteType,
    };
  }
}