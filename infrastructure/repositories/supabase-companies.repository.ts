// infrastructure/repositories/supabase-companies.repository.ts
import { createClient } from "@supabase/supabase-js";
import { CompanyMetadata, StockCandidate, UniverseStock} from "@/domain/models/trading";
import { SupabaseCompanyRow } from "./supabase-companies.types";
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
    tipo_activo: stock.tipoActivo || APP_CONFIG.DB.DEFAULTS.ASSET_TYPE,
    pais: stock.pais,
    moneda: stock.moneda,
    bolsa: stock.exchange,
    capitalizacion: stock.marketCap,
    categoria: stock.categoria || APP_CONFIG.CATEGORIES.MID, 
  }));

  const { error } = await this.supabase
    .from(APP_CONFIG.DB.TABLES.EMPRESAS)
    .upsert(empresasParaGuardar, {
      onConflict: APP_CONFIG.DB.COLUMNS.TICKER,
    });

  if (error) {
    console.error("Error en la sincronización masiva:", error.message);
    throw new Error(`No se pudieron guardar las empresas: ${error.message}`);
  }

  console.log(`Sincronización completada (${categoriaPorDefecto}): ${stocks.length} empresas guardadas.`);
}

  async updateCompanyMetadata(id: number, metadata: CompanyMetadata): Promise<void> {
    const { error } = await this.supabase
      .from(APP_CONFIG.DB.TABLES.EMPRESAS)
      .update(this.toDatabaseMetadata(metadata))
      .eq("id", id);

    if (error) {
      throw new Error(`No se pudieron actualizar los metadatos de la empresa: ${error.message}`);
    }
  }

  async updateCompanyMetadataByTicker(
    ticker: string,
    nombre: string,
    metadata: CompanyMetadata
  ): Promise<void> {
    const { error } = await this.supabase
      .from(APP_CONFIG.DB.TABLES.EMPRESAS)
      .update({
        nombre,
        ...this.toDatabaseMetadata(metadata),
      })
      .eq(APP_CONFIG.DB.COLUMNS.TICKER, ticker);

    if (error) {
      throw new Error(`No se pudo actualizar ${ticker}: ${error.message}`);
    }
  }

  async saveScanResult(companyId: number, stock: StockCandidate, loteId: string): Promise<void> {
    const { error } = await this.supabase
      .from("historico_escaneos")
      .upsert({
        empresa_id: companyId,
        lote_id: loteId,
        escaneado_en: new Date().toISOString(),
        fecha: new Date().toISOString().slice(0, 10),
        precio: stock.precio,
        volumen: Math.round(stock.volumen),
        rsi: stock.rsi,
        capitalizacion: stock.capitalizacion ?? null,
        es_valido: stock.esValido,
      });

    if (error) {
      throw new Error(`No se pudo guardar el escaneo de ${stock.ticker}: ${error.message}`);
    }
  }

  async getLatestOpportunities(): Promise<StockCandidate[]> {
    const { data: latestRows, error: latestError } = await this.supabase
      .from("historico_escaneos")
      .select("lote_id, escaneado_en")
      .order("escaneado_en", { ascending: false })
      .limit(1);

    if (latestError) {
      if (this.isScanHistorySchemaUnavailable(latestError.code) || this.isTransientSupabaseError(latestError)) {
        console.warn("No se pudo consultar temporalmente el último lote; se muestran oportunidades vacías.");
        return [];
      }
      throw new Error(`No se pudo localizar el último escaneo: ${latestError.message}`);
    }

    const latest = (latestRows as Array<{ lote_id: string }> | null)?.[0];
    if (!latest) return [];

    const { data: rows, error } = await this.supabase
      .from("historico_escaneos")
      .select("precio, volumen, rsi, capitalizacion, es_valido, empresas(ticker, nombre, categoria)")
      .eq("lote_id", latest.lote_id)
      .eq("es_valido", true);

    if (error) {
      if (this.isScanHistorySchemaUnavailable(error.code) || this.isTransientSupabaseError(error)) {
        console.warn("No se pudo consultar temporalmente el último lote; se muestran oportunidades vacías.");
        return [];
      }
      throw new Error(`No se pudieron recuperar las oportunidades: ${error.message}`);
    }

    type StoredOpportunity = {
      precio: number;
      volumen: number;
      rsi: number;
      capitalizacion?: number;
      empresas: {
        ticker: string;
        nombre: string;
        categoria?: "TOP" | "MID";
      } | Array<{
        ticker: string;
        nombre: string;
        categoria?: "TOP" | "MID";
      }> | null;
    };

    return ((rows as StoredOpportunity[] | null) ?? [])
      .map((row) => ({ row, company: Array.isArray(row.empresas) ? row.empresas[0] : row.empresas }))
      .filter((item) => item.company !== null && item.company !== undefined)
      .map(({ row, company }) => ({
        ticker: company!.ticker,
        nombre: company!.nombre,
        precio: row.precio,
        volumen: row.volumen,
        rsi: row.rsi,
        capitalizacion: row.capitalizacion,
        categoria: company!.categoria,
        esValido: true,
      }));
  }

  private isScanHistorySchemaUnavailable(code?: string): boolean {
    return code === "42703" || code === "42P01" || code === "PGRST204";
  }

  private isTransientSupabaseError(error: { code?: string; message?: string }): boolean {
    const message = error.message?.toLowerCase() ?? "";
    return ["522", "502", "503", "504", "timed out", "timeout", "fetch failed"].some(
      (marker) => message.includes(marker)
    );
  }

  private toDatabaseMetadata(metadata: CompanyMetadata) {
    return {
      tipo_activo: metadata.tipoActivo,
      es_dividendo: metadata.esDividendo,
      dividend_rate: metadata.dividendRate ?? null,
      dividend_yield: metadata.dividendYield ?? null,
      sector: metadata.sector,
      industria: metadata.industria ?? null,
      pais: metadata.pais ?? null,
      bolsa: metadata.bolsa ?? null,
      moneda: metadata.moneda ?? null,
      web: metadata.web ?? null,
      capitalizacion: metadata.capitalizacion ?? null,
      current_ratio: metadata.currentRatio ?? null,
      debt_to_equity: metadata.debtToEquity ?? null,
      return_on_equity: metadata.returnOnEquity ?? null,
      profit_margin: metadata.profitMargin ?? null,
      free_cash_flow: metadata.freeCashFlow ?? null,
      total_cash: metadata.totalCash ?? null,
      total_debt: metadata.totalDebt ?? null,
      fundamentales_actualizados_en: new Date().toISOString(),
    };
  }

  async getCompanies(): Promise<SupabaseCompanyRow[]> {
    const { data, error } = await this.supabase
      .from(APP_CONFIG.DB.TABLES.EMPRESAS)
      .select(`id, ticker, nombre, tipo_activo, es_dividendo, dividend_rate, dividend_yield, sector, industria
        , pais, bolsa, moneda, web, categoria, capitalizacion, current_ratio, debt_to_equity, return_on_equity
        , profit_margin, free_cash_flow, total_cash, total_debt, fundamentales_actualizados_en`)
      .order(APP_CONFIG.DB.COLUMNS.TICKER, { ascending: true });

    if (error) {
      console.error("Error al consultar las empresas en Supabase:", error.message);
      throw new Error("No se pudieron recuperar las empresas de la base de datos");
    }

    return (data as SupabaseCompanyRow[]) || [];
  }

}