import { OperacionesRepository } from "@/application/ports/operaciones-repository.port";
import { CreateOperacionInput, Operacion } from "@/domain/models/operacion";

export class OpenOperationUseCase {
  constructor(private readonly operacionesRepository: OperacionesRepository) {}

  execute(input: CreateOperacionInput): Promise<Operacion> {
    return this.operacionesRepository.create(input);
  }
}
