import { APP_CONFIG } from "@/domain/constants";

// Archivo sin dependencias de servidor: lo usan tanto las acciones del servidor como los componentes de cliente.

/** Tipos de activo que se gestionan en el radar. */
export type AssetKind = (typeof APP_CONFIG.ASSET_TYPES)[keyof typeof APP_CONFIG.ASSET_TYPES];

export const ASSET_KINDS = [APP_CONFIG.ASSET_TYPES.EQUITY, APP_CONFIG.ASSET_TYPES.ETF, APP_CONFIG.ASSET_TYPES.INDEX_FUND] as const;

function normalizeAssetType(assetType: unknown): string {
  return typeof assetType === "string" ? assetType.trim().toUpperCase() : "";
}

/** Acciones y ETF se pueden añadir manualmente al radar. */
export function isSupportedAssetType(assetType: unknown): boolean {
  const normalized = normalizeAssetType(assetType);
  return normalized === APP_CONFIG.ASSET_TYPES.EQUITY || normalized === APP_CONFIG.ASSET_TYPES.ETF || normalized === APP_CONFIG.ASSET_TYPES.INDEX_FUND;
}

export function isIndexFund(assetType: unknown): boolean {
  return normalizeAssetType(assetType) === APP_CONFIG.ASSET_TYPES.INDEX_FUND;
}

export function isEtf(assetType: unknown): boolean {
  return normalizeAssetType(assetType) === APP_CONFIG.ASSET_TYPES.ETF;
}

/**
 * Indica si un registro pertenece a una pestaña. Todo lo que no es ETF cuenta como acción:
 * las filas antiguas guardan "STOCK", "EQUITY" o nada, según cómo entraron en la tabla.
 */
export function matchesAssetKind(assetType: unknown, kind: AssetKind): boolean {
  if (kind === APP_CONFIG.ASSET_TYPES.ETF) return isEtf(assetType);
  if (kind === APP_CONFIG.ASSET_TYPES.INDEX_FUND) return isIndexFund(assetType);
  return !isEtf(assetType) && !isIndexFund(assetType);
}

/** Valida el tipo que llega desde el navegador; cualquier valor raro se trata como acción. */
export function resolveAssetKind(value: unknown): AssetKind {
  if (isEtf(value)) return APP_CONFIG.ASSET_TYPES.ETF;
  if (isIndexFund(value)) return APP_CONFIG.ASSET_TYPES.INDEX_FUND;
  return APP_CONFIG.ASSET_TYPES.EQUITY;
}
