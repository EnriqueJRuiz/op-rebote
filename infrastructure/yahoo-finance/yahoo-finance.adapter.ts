import YahooFinance from "yahoo-finance2";
import { RSI } from "technicalindicators";

import { MarketRepositoryPort } from "@/application/ports/market-repository.port";
import { CompanyMetadata, StockCandidate, UniverseStock } from "@/domain/models/trading";
import { UNIVERSE_RULES } from "@/domain/rules/universe.rules";
import { APP_CONFIG } from "@/domain/constants";

import {
  YahooCompanyQuote,
  YahooCompanySummary,
  YahooNumericValue,
  YahooScreenerQuery,
  YahooScreenerRequest,
} from "./yahoo-finance.types";
import { YahooScreenerClient } from "./yahoo-screener.client";
import { YahooScreenerMapper } from "./yahoo-screener.mapper";
import { YahooUniverseFilter } from "./yahoo-universe.filter";

export class YahooFinanceAdapter implements MarketRepositoryPort {
  private static readonly DEFAULT_RSI = APP_CONFIG.YAHOO_CONFIG.DEFAULT_RSI;
  private static readonly RSI_PERIOD = APP_CONFIG.YAHOO_CONFIG.RSI_PERIOD;
  private static readonly HISTORY_MONTHS_OFFSET = APP_CONFIG.YAHOO_CONFIG.HISTORY_MONTHS_OFFSET;
  
  
  private readonly yf = new YahooFinance({ suppressNotices: ["yahooSurvey"], });
  private readonly screenerClient = new YahooScreenerClient(this.yf);
  private readonly mapper = new YahooScreenerMapper();
  private readonly universeFilter = new YahooUniverseFilter();

  async getStockData(ticker: string): Promise<StockCandidate> {
    try {
      return (await this.getCompanySnapshot(ticker)).stock;
    } catch (error) {
      console.error(`Error al obtener datos reales para ${ticker}:`, error);
      throw new Error(`No se pudo procesar el ticker ${ticker}`);
    }
  }

  async getCompanySnapshot(ticker: string, includeMetadata = true): Promise<{
    stock: StockCandidate;
    metadata?: CompanyMetadata;
  }> {
    const [quoteResult, closes, summaryResult] = await Promise.all([
      this.fetchQuote(ticker),
      this.fetchHistoricalCloses(ticker),
      includeMetadata
        ? this.yf.quoteSummary(ticker, {
            modules: ["price", "assetProfile", "summaryDetail", "financialData"],
          })
        : Promise.resolve(null),
    ]);

    const quote = quoteResult as unknown as YahooCompanyQuote & {
      longName?: string;
      shortName?: string;
      regularMarketPrice?: number;
      regularMarketVolume?: number;
    };
    const summary = summaryResult as unknown as YahooCompanySummary | null;
    if (!includeMetadata || !summary) {
      return {
        stock: {
          ticker,
          nombre: quote.longName ?? quote.shortName ?? ticker,
          precio: this.getYahooNumber(quote.regularMarketPrice),
          rsi: this.calculateRsi(closes),
          volumen: this.getYahooNumber(quote.regularMarketVolume),
          capitalizacion: this.getYahooNumber(quote.marketCap),
          esValido: false,
        },
      };
    }
    const dividendValues = [
      summary.summaryDetail?.dividendRate,
      summary.summaryDetail?.dividendYield,
      summary.summaryDetail?.trailingAnnualDividendRate,
      summary.summaryDetail?.trailingAnnualDividendYield,
      quote.dividendRate,
      quote.dividendYield,
      quote.trailingAnnualDividendRate,
      quote.trailingAnnualDividendYield,
    ];
    const paysDividend = dividendValues.some((value) => this.getYahooNumber(value) > 0);
    const financialData = summary.financialData;
    const marketCap = this.getYahooNumber(summary.price?.marketCap) || this.getYahooNumber(quote.marketCap);

    return {
      stock: {
        ticker,
        nombre: quote.longName ?? quote.shortName ?? ticker,
        precio: this.getYahooNumber(quote.regularMarketPrice),
        rsi: this.calculateRsi(closes),
        volumen: this.getYahooNumber(quote.regularMarketVolume),
        capitalizacion: marketCap,
        esValido: false,
      },
      metadata: {
        tipoActivo: quote.quoteType ?? APP_CONFIG.DB.DEFAULTS.ASSET_TYPE,
        esDividendo: paysDividend,
        sector: summary.assetProfile?.sector ?? APP_CONFIG.DB.DEFAULTS.SECTOR,
        dividendRate: this.getYahooNumber(summary.summaryDetail?.dividendRate),
        dividendYield: this.getYahooNumber(summary.summaryDetail?.dividendYield),
        industria: summary.assetProfile?.industry,
        pais: summary.assetProfile?.country,
        bolsa: summary.price?.exchangeName ?? quote.fullExchangeName ?? quote.exchange,
        moneda: summary.price?.currency ?? quote.currency,
        web: summary.assetProfile?.website,
        capitalizacion: marketCap,
        currentRatio: this.getYahooNumber(financialData?.currentRatio),
        debtToEquity: this.getYahooNumber(financialData?.debtToEquity),
        returnOnEquity: this.getYahooNumber(financialData?.returnOnEquity),
        profitMargin: this.getYahooNumber(financialData?.profitMargins),
        freeCashFlow: this.getYahooNumber(financialData?.freeCashflow),
        totalCash: this.getYahooNumber(financialData?.totalCash),
        totalDebt: this.getYahooNumber(financialData?.totalDebt),
      },
    };
  }

  private getYahooNumber(value: YahooNumericValue | undefined): number {
    return typeof value === "number" ? value : value?.raw ?? 0;
  }

  async getCompanyMetadata(ticker: string): Promise<CompanyMetadata> {
    return (await this.getCompanySnapshot(ticker, true)).metadata!;
  }

  async getInitialUniverse(): Promise<UniverseStock[]> {
    try {
      // Las ejecutamos secuencialmente para que los logs salgan ordenados en la terminal
      const topCaps = await this.getTopCaps();
      const midCaps = await this.getMidCaps();

      return this.removeDuplicateTickers([...topCaps, ...midCaps]);
    } catch (error) {
      console.error("Error al obtener el universo inicial:", error);
      throw new Error("No se pudo obtener el universo inicial de acciones");
    }
  }

  private async fetchQuote(ticker: string) {
    return this.yf.quote(ticker);
  }

  private async fetchHistoricalCloses(ticker: string): Promise<number[]> {
    const period1 = this.getHistoryStartDate();
    const chartResult = await this.yf.chart(ticker, {
      period1,
      interval: "1d",
    });

    return chartResult.quotes
      .map((q) => q.close)
      .filter((close): close is number => close !== null && close !== undefined);
  }

  private getHistoryStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - YahooFinanceAdapter.HISTORY_MONTHS_OFFSET);
    return date.toISOString().split("T")[0];
  }

  private calculateRsi(closes: number[]): number {
    if (closes.length < YahooFinanceAdapter.RSI_PERIOD) {
      return YahooFinanceAdapter.DEFAULT_RSI;
    }

    const rsiValues = RSI.calculate({
      values: closes,
      period: YahooFinanceAdapter.RSI_PERIOD,
    });

    if (rsiValues.length === 0) {
      return YahooFinanceAdapter.DEFAULT_RSI;
    }

    const lastRsi = rsiValues[rsiValues.length - 1];
    return Number(lastRsi.toFixed(2));
  }

  private async getTopCaps(): Promise<UniverseStock[]> {
console.log("\n=============================================");
    console.log("BUSQUEDA: TOP-CAPS");
    console.log("=============================================");
    const stocks = await this.getCandidatesByRegion(
      UNIVERSE_RULES.TOP_CANDIDATES_PER_REGION,
      (region) => ({
        operator: "AND",
        operands: [{ operator: "EQ", operands: ["region", region] }],
      })
    );

    return this.universeFilter.filterTop(stocks);
  }

  private async getMidCaps(): Promise<UniverseStock[]> {
    console.log("\n=============================================");
    console.log("BUSQUEDA: MID-CAPS");
    console.log("=============================================");
    const stocks = await this.getCandidatesByRegion(
      UNIVERSE_RULES.MID_CANDIDATES_PER_REGION,
      (region) => ({
        operator: "AND",
        operands: [
          { operator: "EQ", operands: ["region", region] },
          { operator: "GTE", operands: ["intradaymarketcap", UNIVERSE_RULES.MID.MIN_MARKET_CAP] },
          { operator: "LT", operands: ["intradaymarketcap", UNIVERSE_RULES.MID.MAX_MARKET_CAP] },
        ],
      })
    );

    return this.universeFilter.filterMid(stocks);
  }

  private async getCandidatesByRegion(
    count: number,
    buildQuery: (region: string) => YahooScreenerQuery
  ): Promise<UniverseStock[]> {
    const regionPromises = UNIVERSE_RULES.REGIONS.map(async (region) => {
      const quotes = await this.searchCaps(count, buildQuery(region));
      const regionStocks = this.mapper.toUniverseStocks(quotes);
      
      console.log(`${region.toUpperCase()}: ${regionStocks.length} candidatos`);
      
      return regionStocks;
    });

    const results = await Promise.all(regionPromises);
    return this.removeDuplicateTickers(results.flat());
  }

  private async searchCaps(count: number, query: YahooScreenerQuery ) {
    const request: YahooScreenerRequest = {
      offset: 0,
      size: count,
      sortType: "DESC",
      sortField: "intradaymarketcap",
      quoteType: "EQUITY",
      topOperator: "AND",
      query,
      userId: "",
      userIdType: "guid",
    };

    return this.screenerClient.search(request);
  }

  private removeDuplicateTickers( stocks: UniverseStock[]): UniverseStock[] {
    return Array.from(
      new Map(stocks.map((stock) => [stock.ticker, stock])).values()
    );
  }
  
}