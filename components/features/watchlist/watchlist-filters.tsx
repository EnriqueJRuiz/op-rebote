"use client";

import { ChevronDown, Search } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";

interface WatchlistFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export function WatchlistFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: WatchlistFiltersProps) {
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative w-full sm:min-w-60 sm:flex-1">
        <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${UI_STYLES.filter.icon}`} size={16} aria-hidden="true" />
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={UI_TEXT.table.columns.searchByNameOrTicker}
          className={UI_STYLES.filter.input}
        />
      </div>

      <div className="relative min-w-0 sm:min-w-48">
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className={UI_STYLES.filter.select}
        >
          <option value="all">RSI: Todos</option>
          <option value="oversold">RSI ≤ 30 (Sobreventa activa)</option>
          <option value="out_oversold">RSI &gt; 30 (Fuera de sobreventa)</option>
        </select>
        <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 ${UI_STYLES.filter.icon}`} size={15} aria-hidden="true" />
      </div>
    </div>
  );
}
