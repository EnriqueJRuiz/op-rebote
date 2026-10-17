import { OperacionesRepository } from "@/application/ports/operaciones-repository.port";
import { ScanHistoryRepositoryPort } from "@/application/ports/scan-history-repository.port";
import { Operacion } from "@/domain/models/operacion";

export class GetActiveOperationsUseCase {
  constructor(
    private readonly operacionesRepository: OperacionesRepository,
    private readonly scanHistoryRepository: ScanHistoryRepositoryPort,
  ) {}

  async execute(): Promise<Operacion[]> {
    const [operaciones, cotizaciones] = await Promise.all([
      this.operacionesRepository.getActive(),
      this.scanHistoryRepository.getLatestScanQuotes(),
    ]);
    const quotesByCompany = new Map(cotizaciones.map((quote) => [quote.companyId, quote]));

    return Promise.all(operaciones.map(async (operacion) => {
      const quote = operacion.empresa_id == null
        ? undefined
        : quotesByCompany.get(operacion.empresa_id);

      if (!quote) {
        return { ...operacion, precio_actual: null, precio_anterior_lote: null };
      }

      // Actualiza el máximo observado, pero nunca cierra la operación automáticamente.
      await this.operacionesRepository.updateMaxPrice(operacion.id, quote.price);
      return {
        ...operacion,
        max_price: Math.max(operacion.max_price ?? operacion.precio_entrada, quote.price),
        precio_actual: quote.price,
        precio_anterior_lote: quote.previousDayPrice ?? null,
      };
    }));
  }
}
