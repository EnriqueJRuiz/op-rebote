// application/use-cases/scan-market.use-case.ts
import { MarketRepositoryPort } from "@/application/ports/market-repository.port";
import { StockCandidate, UniverseStock } from "@/domain/models/trading";
import { TRADING_RULES } from "@/domain/rules/trading.rules";

export class ScanMarketUseCase {
  // Inyectamos el puerto a través del constructor (Hexagonal puro)
  constructor(private marketRepository: MarketRepositoryPort) {}

  async execute(tickers: string[]): Promise<StockCandidate[]> {
    // 1. Lanzamos todas las peticiones en paralelo de forma eficiente
    const candidatePromises = tickers.map((ticker) => 
      this.processTicker(ticker)
    );

    const results = await Promise.all(candidatePromises);
    
    // 2. Filtramos los nulos por si alguna petición falló individualmente
    return results.filter((candidate): candidate is StockCandidate => candidate !== null);
  }

  async getInitialUniverse(): Promise<UniverseStock[]> {
    return this.marketRepository.getInitialUniverse();
  }

  private async processTicker(ticker: string): Promise<StockCandidate | null> {
    try {
      const stockData = await this.marketRepository.getStockData(ticker);
      
      return this.evaluateTradingRules(stockData);
    } catch (error) {
      console.error(`Error procesando el ticker ${ticker} en el caso de uso:`, error);
      return null;
    }
  }

  private evaluateTradingRules(stockData: StockCandidate): StockCandidate {
    const { MIN_DAILY_VOLUME, OVERSOLD_THRESHOLD } = TRADING_RULES;

    const cumpleVolumen = stockData.volumen >= MIN_DAILY_VOLUME;
    const cumpleRsi = stockData.rsi <= OVERSOLD_THRESHOLD;

    const reasons: string[] = [];
    if (!cumpleVolumen) reasons.push(`Volumen insuficiente (< ${MIN_DAILY_VOLUME.toLocaleString()}).`);
    if (!cumpleRsi) reasons.push(`RSI fuera de rango (> ${OVERSOLD_THRESHOLD}).`);

    return {
      ...stockData,
      esValido: cumpleVolumen && cumpleRsi,
      motivoDescarte: reasons.length > 0 ? reasons.join(" ") : undefined,
    };
  }
}