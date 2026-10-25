import { isEtf, isIndexFund } from "@/domain/rules/asset-type.rules";

/** Marca que sustituye al logo en la celda de nombre: los ETF y los fondos indexados no tienen logo de empresa. */
export function getAssetMark(assetType: unknown): "ETF" | "FI" | undefined {
  if (isEtf(assetType)) return "ETF";
  if (isIndexFund(assetType)) return "FI";
  return undefined;
}
