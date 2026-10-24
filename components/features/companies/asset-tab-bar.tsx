"use client";

import { KeyboardEvent, useRef } from "react";
import { Layers, TrendingUp } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { AssetKind } from "@/domain/rules/asset-type.rules";

export interface AssetTab {
  kind: AssetKind;
  count: number;
}

const TAB_ICONS: Partial<Record<AssetKind, typeof TrendingUp>> = {
  EQUITY: TrendingUp,
};

const TAB_MARKS: Partial<Record<AssetKind, string>> = {
  ETF: "ETF",
  MUTUALFUND: "FI",
};

export const assetTabId = (kind: AssetKind) => `asset-tab-${kind}`;
export const assetPanelId = (kind: AssetKind) => `asset-panel-${kind}`;

interface AssetTabBarProps {
  tabs: AssetTab[];
  active: AssetKind;
  onChange: (kind: AssetKind) => void;
}

/**
 * Barra flotante de pestañas pegada al borde inferior de la pantalla.
 * La píldora de color se desliza hasta la pestaña elegida; con "reducir movimiento" salta sin animar.
 */
export function AssetTabBar({ tabs, active, onChange }: AssetTabBarProps) {
  const buttonRefs = useRef<Partial<Record<AssetKind, HTMLButtonElement | null>>>({});
  const activeIndex = Math.max(0, tabs.findIndex((tab) => tab.kind === active));

  const moveTo = (index: number) => {
    const next = tabs[(index + tabs.length) % tabs.length];
    onChange(next.kind);
    buttonRefs.current[next.kind]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveTo(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveTo(index - 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      moveTo(0);
    } else if (event.key === "End") {
      event.preventDefault();
      moveTo(tabs.length - 1);
    }
  };

  return (
    <div className="sticky bottom-[max(1rem,env(safe-area-inset-bottom))] z-20 mt-6 flex justify-center">
      <div
        role="tablist"
        aria-label={UI_TEXT.assetKinds.tabsLabel}
        className="relative grid auto-cols-fr grid-flow-col rounded-full border border-slate-200/80 bg-white/85 p-1 shadow-lg shadow-slate-900/10 ring-1 ring-black/5 backdrop-blur-md"
      >
        <span
          aria-hidden="true"
          className="absolute inset-y-1 left-1 rounded-full bg-teal-600 shadow-md shadow-teal-700/30 transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: `calc((100% - 0.5rem) / ${tabs.length})`,
            transform: `translateX(${activeIndex * 100}%)`,
          }}
        />

        {tabs.map((tab, index) => {
          const isActive = tab.kind === active;
          const Icon = TAB_ICONS[tab.kind];
          const mark = TAB_MARKS[tab.kind];

          return (
            <button
              key={tab.kind}
              ref={(element) => {
                buttonRefs.current[tab.kind] = element;
              }}
              id={assetTabId(tab.kind)}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={assetPanelId(tab.kind)}
              tabIndex={isActive ? 0 : -1}
              onClick={() => onChange(tab.kind)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              className={`relative z-10 flex min-w-32 cursor-pointer items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 ${
                isActive ? "text-white" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {/* {mark ? (
                <span aria-hidden="true" className={`inline-flex h-6 min-w-6 items-center justify-center rounded border px-1 text-[10px] font-extrabold leading-none ${isActive ? "border-white/70 bg-white/15 text-white" : "border-slate-300 bg-slate-100 text-slate-600"}`}>
                  {mark}
                </span>
              ) : Icon ? <Icon size={16} aria-hidden="true" /> : null} */}
              <span>{UI_TEXT.assetKinds[tab.kind].tab}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
