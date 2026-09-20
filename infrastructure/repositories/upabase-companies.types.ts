import { APP_CONFIG } from "@/domain/constants";
import { Company } from "@/domain/models/trading";

export interface SupabaseCompanyRow extends Company {
  id: number;
  tipo_activo?: string;
  es_dividendo?: boolean;
  sector?: string;
  categoria?: typeof APP_CONFIG.CATEGORIES.TOP | typeof APP_CONFIG.CATEGORIES.MID;
}