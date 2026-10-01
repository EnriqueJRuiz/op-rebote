import { RSI, SMA } from "technicalindicators";
import { APP_CONFIG, SMA_PERIOD } from "@/domain/constants";
import { STRATEGY_CONFIG } from "@/domain/config/strategy.config";
import { CompanyMetadata, StockCandidate } from "@/domain/models/trading";
import {
  YahooCompanyQuote,
  YahooCompanySummary,
  YahooNumericValue,
} from "./yahoo-finance.types";

export class YahooSnapshotMapper {
  private static readonly DEFAULT_RSI = STRATEGY_CONFIG.YAHOO.DEFAULT_RSI;
  private static readonly RSI_PERIOD = STRATEGY_CONFIG.YAHOO.RSI_PERIOD;

  getYahooNumber(value: YahooNumericValue | undefined): number {
    return typeof value === "number" ? value : value?.raw ?? 0;
  }

  calculateRsi(closes: number[]): number {
    if (closes.length < YahooSnapshotMapper.RSI_PERIOD) {
      return YahooSnapshotMapper.DEFAULT_RSI;
    }

    const rsiValues = RSI.calculate({
      values: closes,
      period: YahooSnapshotMapper.RSI_PERIOD,
    });

    if (rsiValues.length === 0) {
      return YahooSnapshotMapper.DEFAULT_RSI;
    }

    const lastRsi = rsiValues[rsiValues.length - 1];
    return Number(lastRsi.toFixed(2));
  }

  calculateSma(closes: number[]): number | undefined {
    if (closes.length < SMA_PERIOD) return undefined;
    const values = SMA.calculate({ values: closes, period: SMA_PERIOD });
    const last = values[values.length - 1];
    return last === undefined ? undefined : Number(last.toFixed(4));
  }

  calculateRecentLow(lows: Array<number | null | undefined>): number | undefined {
    const validLows = lows.slice(-6, -1).filter((l): l is number => l !== null && l !== undefined && l > 0);
    return validLows.length > 0 ? Math.min(...validLows) : undefined;
  }

  calculateRelativeVolume(currentVolume: number, historicalVolumes: number[]): number {
    const avgVolume = historicalVolumes.length > 30
      ? historicalVolumes.slice(-30).reduce((a, b) => a + b, 0) / 30
      : historicalVolumes.length > 0
        ? historicalVolumes.reduce((a, b) => a + b, 0) / historicalVolumes.length
        : 1;

    return Number((currentVolume / (avgVolume || 1)).toFixed(2));
  }

  toStockCandidate(params: {
    ticker: string;
    quote: YahooCompanyQuote & { longName?: string; shortName?: string; regularMarketPrice?: number; regularMarketVolume?: number; marketCap?: number };
    summary: YahooCompanySummary | null;
    rsiCloses: number[];
    allCloses: number[];
    recentLows: Array<number | null | undefined>;
    historicalVolumes: number[];
  }): StockCandidate {
    const { ticker, quote, summary, rsiCloses, allCloses, recentLows, historicalVolumes } = params;

    const volumenActual = this.getYahooNumber(quote.regularMarketVolume);
    const volumenRelativo = this.calculateRelativeVolume(volumenActual, historicalVolumes);
    const marketCap = this.getYahooNumber(summary?.price?.marketCap) || this.getYahooNumber(quote.marketCap);
    const precioActual = this.getYahooNumber(quote.regularMarketPrice);

    const precioAnterior = allCloses.length >= 2
      ? Number(allCloses[allCloses.length - 2].toFixed(4))
      : undefined;

    const sma200 = this.calculateSma(allCloses);
    const distSma200Pct = sma200 !== undefined && sma200 > 0 && precioActual > 0
      ? Number((((precioActual - sma200) / sma200) * 100).toFixed(2))
      : undefined;

    return {
      ticker,
      nombre: quote.longName ?? quote.shortName ?? ticker,
      precio: precioActual,
      rsi: this.calculateRsi(rsiCloses),
      volumen: volumenActual,
      capitalizacion: marketCap,
      esValido: false,
      volumenRelativo,
      minimoReciente: this.calculateRecentLow(recentLows),
      precioAnterior,
      sma200,
      distSma200Pct,
    };
  }

  toCompanyMetadata(quote: YahooCompanyQuote, summary: YahooCompanySummary | null, marketCap?: number): CompanyMetadata {
    const dividendValues = [
      summary?.summaryDetail?.dividendRate,
      summary?.summaryDetail?.dividendYield,
      summary?.summaryDetail?.trailingAnnualDividendRate,
      summary?.summaryDetail?.trailingAnnualDividendYield,
      quote.dividendRate,
      quote.dividendYield,
      quote.trailingAnnualDividendRate,
      quote.trailingAnnualDividendYield,
    ];
    const paysDividend = dividendValues.some((value) => this.getYahooNumber(value) > 0);
    const financialData = summary?.financialData;

    return {
      tipoActivo: quote.quoteType ?? APP_CONFIG.DB.DEFAULTS.ASSET_TYPE,
      esDividendo: paysDividend,
      sector: summary?.assetProfile?.sector ?? APP_CONFIG.DB.DEFAULTS.SECTOR,
      dividendRate: this.getYahooNumber(summary?.summaryDetail?.dividendRate),
      dividendYield: this.getYahooNumber(summary?.summaryDetail?.dividendYield),
      industria: summary?.assetProfile?.industry,
      pais: summary?.assetProfile?.country,
      bolsa: summary?.price?.exchangeName ?? quote.fullExchangeName ?? quote.exchange,
      moneda: summary?.price?.currency ?? quote.currency,
      web: summary?.assetProfile?.website,
      capitalizacion: marketCap,
      currentRatio: this.getYahooNumber(financialData?.currentRatio),
      debtToEquity: this.getYahooNumber(financialData?.debtToEquity),
      returnOnEquity: this.getYahooNumber(financialData?.returnOnEquity),
      profitMargin: this.getYahooNumber(financialData?.profitMargins),
      freeCashFlow: this.getYahooNumber(financialData?.freeCashflow),
      totalCash: this.getYahooNumber(financialData?.totalCash),
      totalDebt: this.getYahooNumber(financialData?.totalDebt),
    };
  }
}
