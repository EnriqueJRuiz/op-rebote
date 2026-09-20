// infrastructure/repositories/supabase-companies.repository.ts
import { createClient } from "@supabase/supabase-js";
import { UniverseStock} from "@/domain/models/trading";
import { SupabaseCompanyRow } from "./upabase-companies.types";
import { APP_CONFIG } from "@/domain/constants";

export class SupabaseCompaniesRepository {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Recibe la lista de acciones del universo y guarda solo las que no existan previamente.
   */
  async saveNewCompanies(stocks: UniverseStock[], categoriaPorDefecto: 'TOP' | 'MID' = 'MID'): Promise<void> {
  // Mapeamos los elementos y les asignamos la categoría que recibimos por parámetro
  const empresasParaGuardar = stocks.map(stock => ({
    ticker: stock.ticker,
    nombre: stock.nombre,
    tipo_activo: APP_CONFIG.DB.DEFAULTS.ASSET_TYPE,
    es_dividendo: false,
    sector: stock.sector || APP_CONFIG.DB.DEFAULTS.SECTOR,
    categoria: stock.categoria || APP_CONFIG.CATEGORIES.MID, 
  }));

  const { error } = await this.supabase
    .from(APP_CONFIG.DB.TABLES.EMPRESAS)
    .upsert(empresasParaGuardar, { 
      onConflict: APP_CONFIG.DB.COLUMNS.TICKER 
    });

  if (error) {
    console.error("Error en la sincronización masiva:", error.message);
    throw new Error(`No se pudieron guardar las empresas: ${error.message}`);
  }

  console.log(`Sincronización completada (${categoriaPorDefecto}): ${stocks.length} empresas guardadas.`);
}

  async getCompanies(): Promise<SupabaseCompanyRow[]> {
    const { data, error } = await this.supabase
      .from(APP_CONFIG.DB.TABLES.EMPRESAS)
      .select("id, ticker, nombre, tipo_activo, es_dividendo, sector, categoria")
      .order(APP_CONFIG.DB.COLUMNS.TICKER, { ascending: true });

    if (error) {
      console.error("Error al consultar las empresas en Supabase:", error.message);
      throw new Error("No se pudieron recuperar las empresas de la base de datos");
    }

    return (data as SupabaseCompanyRow[]) || [];
  }

}