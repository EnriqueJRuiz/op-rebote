"use client";

import { Search } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { ASSET_KINDS, AssetKind } from "@/domain/rules/asset-type.rules";
import { MobileFilterField, MobileFilters } from "@/components/common/mobile/mobile-filters";
import { FILTER_ALL, FilterOption, TableFilterSelect } from "@/components/features/companies/company-filters";

export type AssetTypeFilter = typeof FILTER_ALL | AssetKind;

const TYPE_LABEL = "Tipo";

const TYPE_FILTER_OPTIONS: FilterOption<AssetTypeFilter>[] = [
  { value: FILTER_ALL, label: `${TYPE_LABEL}: Todos` },
  ...ASSET_KINDS.map((kind) => ({
    value: kind as AssetTypeFilter,
    label: `${TYPE_LABEL}: ${UI_TEXT.assetKinds[kind].tab}`,
  })),
];

interface WatchlistFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  typeFilter: AssetTypeFilter;
  onTypeFilterChange: (value: AssetTypeFilter) => void;
}

export function WatchlistFilters({
  searchTerm,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
}: WatchlistFiltersProps) {
  const activeFiltersCount = typeFilter !== FILTER_ALL ? 1 : 0;

  return (
    <div className="flex w-full items-center gap-2">
      <div className="relative flex-1 sm:min-w-60">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${UI_STYLES.filter.icon}`}
          size={16}
          aria-hidden="true"
        />
        <label htmlFor="watchlist-search" className="sr-only">
          {UI_TEXT.table.columns.searchByNameOrTicker}
        </label>
        <input
          id="watchlist-search"
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={UI_TEXT.table.columns.searchByNameOrTicker}
          className={UI_STYLES.filter.input}
        />
      </div>

      {/* Móvil: botón "Filtros" con panel inferior, igual que en Mercado */}
      <MobileFilters activeCount={activeFiltersCount}>
        <MobileFilterField label="Tipo de activo">
          <TableFilterSelect
            id="watchlist-type-mobile"
            label={UI_TEXT.assetKinds.tabsLabel}
            value={typeFilter}
            options={TYPE_FILTER_OPTIONS}
            onChange={onTypeFilterChange}
            className="w-full"
          />
        </MobileFilterField>
      </MobileFilters>

      {/* Escritorio: selector en línea */}
      <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-2">
        <TableFilterSelect
          id="watchlist-type"
          label={UI_TEXT.assetKinds.tabsLabel}
          value={typeFilter}
          options={TYPE_FILTER_OPTIONS}
          onChange={onTypeFilterChange}
          className="sm:min-w-44 sm:flex-none"
        />
      </div>
    </div>
  );
}
