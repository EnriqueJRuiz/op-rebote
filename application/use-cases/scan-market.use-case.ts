// application/use-cases/scan-market.use-case.ts
import { MarketRepositoryPort } from "@/application/ports/market-repository.port";
import { APP_CONFIG } from "@/domain/constants";
import { StockCandidate, UniverseStock, MarketScanResult } from "@/domain/models/trading";
import { evaluateCandidateTierAndExit, evaluateStockCandidateValidity } from "@/domain/rules/trading.rules";

export class ScanMarketUseCase {
  constructor(private marketRepository: MarketRepositoryPort) {}

  async execute(tickers: string[]): Promise<MarketScanResult> {
    const candidatePromises = tickers.map((ticker) => 
      this.processTicker(ticker)
    );

    const results = await Promise.all(candidatePromises);
    const validCandidates = results.filter((candidate): candidate is StockCandidate => candidate !== null);

    const scanResult: MarketScanResult = {
      tier0: [],
      tier1: [],
      top: [],
      mid: [],
    };

    for (const baseCandidate of validCandidates) {
      if (!baseCandidate.esValido) continue;

      const evaluatedCandidate = this.classifyCandidate(baseCandidate);

      switch (evaluatedCandidate.tier) {
        case APP_CONFIG.CATEGORIES.TIER_0:
          scanResult.tier0.push(evaluatedCandidate);
          break;
        case APP_CONFIG.CATEGORIES.TIER_1:
          scanResult.tier1.push(evaluatedCandidate);
          break;
        case APP_CONFIG.CATEGORIES.TOP:
          scanResult.top.push(evaluatedCandidate);
          break;
        case APP_CONFIG.CATEGORIES.MID:
        default:
          scanResult.mid.push(evaluatedCandidate);
          break;
      }
    }

    return scanResult;
  }

  async getInitialUniverse(): Promise<UniverseStock[]> {
    return this.marketRepository.getInitialUniverse();
  }

  private async processTicker(ticker: string): Promise<StockCandidate | null> {
    try {
      const stockData = await this.marketRepository.getStockData(ticker);
      return this.evaluateStockData(stockData);
    } catch (error) {
      console.error(`Error procesando el ticker ${ticker} en el caso de uso:`, error);
      return null;
    }
  }

  evaluateStockData(stockData: StockCandidate): StockCandidate {
    return evaluateStockCandidateValidity(stockData);
  }

  classifyCandidate(stock: StockCandidate): StockCandidate {
    const evaluacion = evaluateCandidateTierAndExit({
      rsi: stock.rsi,
      esValido: stock.esValido,
      dividendTier: stock.dividendTier,
      origenCategoria: stock.categoria,
    });

    return {
      ...stock,
      tier: evaluacion.tier,
      reglaSalida: evaluacion.reglaSalida,
    };
  }
}