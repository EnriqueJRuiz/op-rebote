// application/use-cases/scan-market.use-case.ts
import { MarketRepositoryPort } from "@/application/ports/market-repository.port";
import { StockCandidate, UniverseStock, MarketScanResult } from "@/domain/models/trading";
import { TRADING_RULES, evaluateCandidateTierAndExit } from "@/domain/rules/trading.rules";

export class ScanMarketUseCase {
  constructor(private marketRepository: MarketRepositoryPort) {}

  // 2. Tipamos correctamente la promesa con 
  async execute(tickers: string[]): Promise<MarketScanResult> {
    const candidatePromises = tickers.map((ticker) => 
      this.processTicker(ticker)
    );

    const results = await Promise.all(candidatePromises);
    
    const validCandidates = results.filter((candidate): candidate is StockCandidate => candidate !== null);

    // 3. Inicializamos el objeto tipado
    const scanResult: MarketScanResult = {
      tier0: [],
      tier1: [],
      top: [],
      mid: [],
    };

    for (const baseCandidate of validCandidates) {
      if (!baseCandidate.esValido) continue;

      const evaluacion = evaluateCandidateTierAndExit({
        rsi: baseCandidate.rsi,
        esDividendKing: baseCandidate.esDividendKing ?? false,
        origenCategoria: baseCandidate.categoria,
      });

      const evaluatedCandidate: StockCandidate = {
        ...baseCandidate,
        tier: evaluacion.tier,
        reglaSalida: evaluacion.reglaSalida,
      };

      switch (evaluacion.tier) {
        case 'TIER_0':
          scanResult.tier0.push(evaluatedCandidate);
          break;
        case 'TIER_1':
          scanResult.tier1.push(evaluatedCandidate);
          break;
        case 'TOP':
          scanResult.top.push(evaluatedCandidate);
          break;
        case 'MID':
          scanResult.mid.push(evaluatedCandidate);
          break;
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
    const { MIN_DAILY_VOLUME, OVERSOLD_THRESHOLD } = TRADING_RULES;

    const cumpleVolumen = stockData.volumen >= MIN_DAILY_VOLUME;
    const cumpleRsi = stockData.rsi <= OVERSOLD_THRESHOLD;
    const cumpleLiquidez = stockData.currentRatio === undefined || stockData.currentRatio >= TRADING_RULES.MIN_CURRENT_RATIO;
    const cumpleDeuda = stockData.debtToEquity === undefined || stockData.debtToEquity <= TRADING_RULES.MAX_DEBT_TO_EQUITY;

    const reasons: string[] = [];
    if (!cumpleVolumen) reasons.push(`Volumen insuficiente (< ${TRADING_RULES.MIN_DAILY_VOLUME.toLocaleString()}).`);
    if (!cumpleRsi) reasons.push(`RSI fuera de rango (> ${TRADING_RULES.OVERSOLD_THRESHOLD}).`);
if (!cumpleLiquidez) reasons.push(`Liquidez baja (Current Ratio < ${TRADING_RULES.MIN_CURRENT_RATIO}).`);
    if (!cumpleDeuda) reasons.push(`Endeudamiento excesivo (Debt/Equity > ${TRADING_RULES.MAX_DEBT_TO_EQUITY}).`);

    return {
      ...stockData,
      esValido: cumpleVolumen && cumpleRsi,
      motivoDescarte: reasons.length > 0 ? reasons.join(" ") : undefined,
    };
  }
}