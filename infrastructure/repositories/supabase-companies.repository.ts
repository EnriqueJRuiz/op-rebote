// infrastructure/repositories/supabase-companies.repository.ts
import { createClient } from "@supabase/supabase-js";
import { CompaniesRepositoryPort } from "@/application/ports/companies-repository.port";
import { CompanyMetadata, CompanyRecord, UniverseStock } from "@/domain/models/trading";
import { APP_CONFIG, getDividendTier } from "@/domain/constants";

export class SupabaseCompaniesRepository implements CompaniesRepositoryPort {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  /**
   * Recibe la lista de acciones del universo y guarda solo las que no existan previamente.
   */
  async saveNewCompanies(stocks: UniverseStock[], categoriaPorDefecto: 'TOP' | 'MID' = 'MID'): Promise<void> {
    const empresasParaGuardar = stocks.map(stock => ({
      ticker: stock.ticker,
      nombre: stock.nombre,
      tipo_activo: stock.tipoActivo || APP_CONFIG.DB.DEFAULTS.ASSET_TYPE,
      pais: stock.pais,
      moneda: stock.moneda,
      bolsa: stock.exchange,
      capitalizacion: stock.marketCap,
      categoria: stock.categoria || APP_CONFIG.CATEGORIES.MID,
      dividend_tier: getDividendTier(stock.ticker),
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
        dividend_tier: getDividendTier(ticker),
        ...this.toDatabaseMetadata(metadata),
      })
      .eq(APP_CONFIG.DB.COLUMNS.TICKER, ticker);

    if (error) {
      throw new Error(`No se pudo actualizar ${ticker}: ${error.message}`);
    }
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

  async getCompanies(): Promise<CompanyRecord[]> {
    const { data, error } = await this.supabase
      .from(APP_CONFIG.DB.TABLES.EMPRESAS)
      .select(`id, ticker, nombre, tipo_activo, es_dividendo, dividend_rate, dividend_yield, sector, industria
        , pais, bolsa, moneda, web, categoria, capitalizacion, current_ratio, debt_to_equity, return_on_equity
        , profit_margin, free_cash_flow, total_cash, total_debt, dividend_tier, fundamentales_actualizados_en`)
      .order(APP_CONFIG.DB.COLUMNS.TICKER, { ascending: true });

    if (error) {
      console.error("Error al consultar las empresas en Supabase:", error.message);
      throw new Error("No se pudieron recuperar las empresas de la base de datos");
    }

    return (data as CompanyRecord[]) || [];
  }

  /**
   * Devuelve la lista de sectores distintos existentes en la tabla de empresas,
   * ordenada alfabéticamente. Se excluyen valores vacíos o nulos.
   */
  async getSectors(): Promise<string[]> {
    const { data, error } = await this.supabase
      .from(APP_CONFIG.DB.TABLES.EMPRESAS)
      .select("sector")
      .not("sector", "is", null)
      .neq("sector", "");

    if (error) {
      console.error("Error al consultar los sectores en Supabase:", error.message);
      throw new Error("No se pudieron recuperar los sectores de la base de datos");
    }

    const sectores = new Set(
      ((data as { sector: string | null }[] | null) ?? [])
        .map((row) => row.sector?.trim())
        .filter((sector): sector is string => Boolean(sector))
    );

    return [...sectores].sort((first, second) => first.localeCompare(second, "es"));
  }
}