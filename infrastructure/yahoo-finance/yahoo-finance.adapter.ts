import YahooFinance from "yahoo-finance2";
import { MarketRepositoryPort } from "@/application/ports/market-repository.port";
import { CompanyMetadata, StockCandidate, UniverseStock } from "@/domain/models/trading";
import { UNIVERSE_RULES } from "@/domain/rules/universe.rules";
import { STRATEGY_CONFIG } from "@/domain/config/strategy.config";
import {
  YahooCompanyQuote,
  YahooCompanySummary,
  YahooScreenerQuery,
  YahooScreenerRequest,
} from "./yahoo-finance.types";
import { YahooScreenerClient } from "./yahoo-screener.client";
import { YahooScreenerMapper } from "./yahoo-screener.mapper";
import { YahooUniverseFilter } from "./yahoo-universe.filter";
import { YahooSnapshotMapper } from "./yahoo-snapshot.mapper";
import { HistoricalCandle } from "@/domain/models/backtest";

export class YahooFinanceAdapter implements MarketRepositoryPort {
  private static readonly HISTORY_MONTHS_OFFSET = STRATEGY_CONFIG.YAHOO.HISTORY_MONTHS_OFFSET;
  private static readonly SMA_HISTORY_MONTHS = 12;

  private readonly yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });
  private readonly screenerClient = new YahooScreenerClient(this.yf);
  private readonly screenerMapper = new YahooScreenerMapper();
  private readonly snapshotMapper = new YahooSnapshotMapper();
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
    const [quoteResult, chartResult, summaryResult] = await Promise.all([
      this.fetchQuote(ticker),
      this.yf.chart(ticker, {
        period1: this.getSmaHistoryStartDate(),
        interval: "1d",
      }),
      includeMetadata
        ? this.yf.quoteSummary(ticker, {
            modules: ["price", "assetProfile", "summaryDetail", "financialData"],
          })
        : Promise.resolve(null),
    ]);

    const rsiStart = new Date(this.getHistoryStartDate());
    const rsiCloses = chartResult.quotes
      .filter((q) => q.date >= rsiStart)
      .map((q) => q.close)
      .filter((close): close is number => close !== null && close !== undefined);

    const allCloses = chartResult.quotes
      .map((q) => q.close)
      .filter((close): close is number => close !== null && close !== undefined);

    const recentLows = chartResult.quotes.map((quote) => quote.low);
    const historicalVolumes = chartResult.quotes
      .map((q) => q.volume)
      .filter((v): v is number => v !== null && v !== undefined);

    const quote = quoteResult as unknown as YahooCompanyQuote & {
      longName?: string;
      shortName?: string;
      regularMarketPrice?: number;
      regularMarketVolume?: number;
      marketCap?: number;
    };
    const summary = summaryResult as unknown as YahooCompanySummary | null;

    const baseStock = this.snapshotMapper.toStockCandidate({
      ticker,
      quote,
      summary,
      rsiCloses,
      allCloses,
      recentLows,
      historicalVolumes,
    });

    if (!includeMetadata || !summary) {
      return { stock: baseStock };
    }

    return {
      stock: baseStock,
      metadata: this.snapshotMapper.toCompanyMetadata(quote, summary, baseStock.capitalizacion),
    };
  }

  async getCompanyMetadata(ticker: string): Promise<CompanyMetadata> {
    return (await this.getCompanySnapshot(ticker, true)).metadata!;
  }

  async getInitialUniverse(): Promise<UniverseStock[]> {
    try {
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

  private getHistoryStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - YahooFinanceAdapter.HISTORY_MONTHS_OFFSET);
    return date.toISOString().split("T")[0];
  }

  private getSmaHistoryStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - YahooFinanceAdapter.SMA_HISTORY_MONTHS);
    return date.toISOString().split("T")[0];
  }

  private async getTopCaps(): Promise<UniverseStock[]> {
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
      return this.screenerMapper.toUniverseStocks(quotes);
    });

    const results = await Promise.all(regionPromises);
    return this.removeDuplicateTickers(results.flat());
  }

  private async searchCaps(count: number, query: YahooScreenerQuery) {
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

  private removeDuplicateTickers(stocks: UniverseStock[]): UniverseStock[] {
    return Array.from(
      new Map(stocks.map((stock) => [stock.ticker, stock])).values()
    );
  }

  async getHistoricalCandles(ticker: string): Promise<HistoricalCandle[]> {
    const chartResult = await this.yf.chart(ticker, {
      period1: this.getBacktestStartDate(),
      interval: "1d",
    });

    return chartResult.quotes
      .filter((q) => q.close !== null && q.close !== undefined)
      .map((q) => ({
        fecha: q.date.toISOString().split("T")[0],
        precio: q.close!,
        alto: q.high ?? q.close!,
        bajo: q.low ?? q.close!,
        volumen: q.volume ?? 0,
      }));
  }

  private getBacktestStartDate(): string {
    const date = new Date();
    date.setFullYear(date.getFullYear() - STRATEGY_CONFIG.YAHOO.BACKTEST_YEARS_OFFSET);
    return date.toISOString().split("T")[0];
  }
}