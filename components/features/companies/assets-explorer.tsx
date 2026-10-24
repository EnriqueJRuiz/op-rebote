"use client";

import { useMemo, useState } from "react";
import { APP_CONFIG } from "@/domain/constants";
import { UI_TEXT } from "@/domain/literales.constantes";
import { CompanyRecord, CompanyScanQuote } from "@/domain/models/trading";
import { ASSET_KINDS, AssetKind, matchesAssetKind } from "@/domain/rules/asset-type.rules";
import { AddCompanyButton } from "./add-company-button";
import { AssetTabBar, assetPanelId, assetTabId } from "./asset-tab-bar";
import { CompanyTable } from "./company-table";

interface AssetsExplorerProps {
  empresas: CompanyRecord[];
  scanQuotes: CompanyScanQuote[];
  sectores: string[];
}

export function AssetsExplorer({ empresas, scanQuotes, sectores }: AssetsExplorerProps) {
  const [activeKind, setActiveKind] = useState<AssetKind>(APP_CONFIG.ASSET_TYPES.EQUITY);

  const empresasByKind = useMemo(() => {
    const grouped = {} as Record<AssetKind, CompanyRecord[]>;
    for (const kind of ASSET_KINDS) {
      grouped[kind] = empresas.filter((empresa) => matchesAssetKind(empresa.tipo_activo, kind));
    }
    return grouped;
  }, [empresas]);

  // Las acciones no deben ofrecer "ETF" como sector: esa etiqueta solo la usan los ETF.
  const equitySectors = useMemo(
    () => sectores.filter((sector) => sector !== APP_CONFIG.DB.DEFAULTS.ETF_SECTOR),
    [sectores]
  );

  const tabs = ASSET_KINDS.map((kind) => ({ kind, count: empresasByKind[kind].length }));

  return (
    <>
      <div className="flex-1">
        {ASSET_KINDS.map((kind) => {
          const text = UI_TEXT.assetKinds[kind];

          // Las dos tablas siguen montadas: así cada pestaña conserva su búsqueda y sus filtros al cambiar.
          return (
            <section
              key={kind}
              id={assetPanelId(kind)}
              role="tabpanel"
              aria-labelledby={assetTabId(kind)}
              hidden={kind !== activeKind}
              className="space-y-3"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">{text.subtitle}</p>
                <div className="w-full sm:w-44 sm:shrink-0">
                  <AddCompanyButton kind={kind} />
                </div>
              </div>

              <CompanyTable
                title={text.tab}
                empresas={empresasByKind[kind]}
                scanQuotes={scanQuotes}
                sectores={kind === APP_CONFIG.ASSET_TYPES.EQUITY ? equitySectors : []}
                assetKind={kind}
              />
            </section>
          );
        })}
      </div>

      <AssetTabBar tabs={tabs} active={activeKind} onChange={setActiveKind} />
    </>
  );
}
