import { OperacionesRepository } from "@/application/ports/operaciones-repository.port";
import { Operacion } from "@/domain/models/operacion";

export class CloseOperationUseCase {
  constructor(private readonly operacionesRepository: OperacionesRepository) {}

  execute(id: number, precioSalida: number, comisiones?: number): Promise<Operacion> {
    return this.operacionesRepository.close(id, precioSalida, comisiones);
  }
}

export class GetClosedOperationsUseCase {
  constructor(private readonly operacionesRepository: OperacionesRepository) {}

  async execute(): Promise<Operacion[]> {
    return await this.operacionesRepository.getClosed();
  }
}