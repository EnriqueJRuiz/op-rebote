import { MarketRepositoryPort } from "@/application/ports/market-repository.port";
import { BacktestRepositoryPort } from "@/application/ports/backtest-repository.port";
import { CompaniesRepositoryPort } from "@/application/ports/companies-repository.port";
import { runBacktest, continueBacktest } from "@/domain/rules/backtest.rules";

export class RunBacktestUseCase {
  constructor(
    private marketRepository: MarketRepositoryPort,
    private backtestRepository: BacktestRepositoryPort,
    private companiesRepository: CompaniesRepositoryPort
  ) {}

  async execute(idEmpresa: number, ticker: string): Promise<void> {
    const existente = await this.backtestRepository.getBacktest(idEmpresa);
    const hoy = new Date().toISOString().split("T")[0];

    if (!existente) {
      const candles = await this.marketRepository.getHistoricalCandles(ticker);
      const summary = runBacktest(candles);
      await this.backtestRepository.saveInitialBacktest(idEmpresa, summary);
      return;
    }

    if (existente.fechaActualizacion === hoy) return; // ya actualizado hoy, no hacer nada

    const nuevasFilas = await this.companiesRepository.getScanHistorySince(idEmpresa, existente.fechaActualizacion);
    if (nuevasFilas.length === 0) return; // sin días nuevos todavía

    const summary = continueBacktest(existente, nuevasFilas);
    await this.backtestRepository.updateBacktest(idEmpresa, summary);
  }
}