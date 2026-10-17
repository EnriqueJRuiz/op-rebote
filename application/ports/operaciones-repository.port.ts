import { Operacion, CreateOperacionInput } from "@/domain/models/operacion";

export interface OperacionesRepository {
  getActive(): Promise<Operacion[]>;
  create(input: CreateOperacionInput): Promise<Operacion>;
  close(id: number, precioSalida: number, comisiones?: number): Promise<Operacion>;
  updateMaxPrice(id: number, currentPrice: number): Promise<void>;
}