"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Crown, ChessBishop } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";

export const FILTER_ALL = "all" as const;

export type PriceFilter = typeof FILTER_ALL | "up" | "down";
export type DividendFilter = typeof FILTER_ALL | "yes" | "king" | "aristocrat" | "no";

export interface FilterOption<Value extends string> {
  value: Value;
  label: string;
  icon?: React.ReactNode;
}

export const PRICE_FILTER_OPTIONS: FilterOption<PriceFilter>[] = [
  { value: FILTER_ALL, label: UI_TEXT.table.filters.priceAll },
  { value: "up", label: UI_TEXT.table.filters.priceUp },
  { value: "down", label: UI_TEXT.table.filters.priceDown },
];

export const DIVIDEND_FILTER_OPTIONS: FilterOption<DividendFilter>[] = [
  { value: FILTER_ALL, label: UI_TEXT.table.filters.dividendAll },
  { value: "yes", label: UI_TEXT.table.filters.dividendYes },
  { 
    value: "king", 
    label: "Dividend Kings", 
    icon: <Crown size={14} className="text-amber-500" aria-hidden="true" /> 
  },
  { 
    value: "aristocrat", 
    label: "Dividend Aristocrats", 
    icon: <ChessBishop size={14} className="text-slate-500" aria-hidden="true" /> 
  },
  { value: "no", label: UI_TEXT.table.filters.dividendNo },
];

export function TableFilterSelect<Value extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className = "",
}: {
  id: string;
  label: string;
  value: Value;
  options: FilterOption<Value>[];
  onChange: (value: Value) => void;
  className?: string;
}) {
  return (
    <div className={`relative min-w-0 ${className}`}>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.currentTarget.value as Value)}
        className={UI_STYLES.filter.select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        className={`absolute right-3 top-1/2 -translate-y-1/2 ${UI_STYLES.filter.icon}`}
        size={15}
        aria-hidden="true"
      />
    </div>
  );
}

// Selector personalizado específico para dividendos que permite mostrar los iconos SVG reales
export function DividendFilterSelect({
  value,
  onChange,
  className = "",
}: {
  value: DividendFilter;
  onChange: (value: DividendFilter) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = DIVIDEND_FILTER_OPTIONS.find((opt) => opt.value === value) || DIVIDEND_FILTER_OPTIONS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative min-w-0 ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        // Usamos exactamente la misma clase de estilo y añadimos pr-8 para que el texto no tape la flecha absoluta
        className={`w-full flex items-center text-left pr-8 ${UI_STYLES.filter.select}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption.icon}
          <span className="truncate">{selectedOption.label}</span>
        </span>
      </button>

      {/* Posicionamiento absoluto idéntico al del componente TableFilterSelect */}
      <ChevronDown
        className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${UI_STYLES.filter.icon}`}
        size={15}
        aria-hidden="true"
      />

      {isOpen && (
        <ul
          role="listbox"
          className="absolute z-50 mt-1 w-full rounded-md border border-slate-200 bg-white shadow-lg py-1 text-sm"
        >
          {DIVIDEND_FILTER_OPTIONS.map((option) => {
            const isSelected = option.value === value;
            return (
              <li
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-slate-50 ${
                  isSelected ? "font-medium text-slate-900 bg-slate-100/60" : "text-slate-700"
                }`}
              >
                <span className="w-4 flex justify-center">{option.icon}</span>
                <span className="truncate">{option.label}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface CompanyFiltersProps {
  title: string;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  priceFilter: PriceFilter;
  onPriceFilterChange: (value: PriceFilter) => void;
  sectorFilter: string;
  onSectorFilterChange: (value: string) => void;
  dividendFilter: DividendFilter;
  onDividendFilterChange: (value: DividendFilter) => void;
  sectores: string[];
}

export function CompanyFilters({
  title,
  searchTerm,
  onSearchChange,
  priceFilter,
  onPriceFilterChange,
  sectorFilter,
  onSectorFilterChange,
  dividendFilter,
  onDividendFilterChange,
  sectores,
}: CompanyFiltersProps) {
  const searchInputId = `company-search-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const sectorInputId = `company-sector-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const sectorLabel = UI_TEXT.table.columns.sector;

  const sectorOptions: FilterOption<string>[] = [
    { value: FILTER_ALL, label: `${sectorLabel}: Todos` },
    ...sectores.map((sector) => ({ value: sector, label: `${sectorLabel}: ${sector}` })),
  ];

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      {/* Búsqueda */}
      <div className="relative w-full sm:min-w-60 sm:flex-1">
        <Search
          className={`absolute left-3 top-1/2 -translate-y-1/2 ${UI_STYLES.filter.icon}`}
          size={16}
          aria-hidden="true"
        />
        <label htmlFor={searchInputId} className="sr-only">
          {UI_TEXT.table.columns.searchByNameOrTicker}
        </label>
        <input
          id={searchInputId}
          type="search"
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={UI_TEXT.table.columns.searchByNameOrTicker}
          className={UI_STYLES.filter.input}
        />
      </div>

      {/* Último precio */}
      <TableFilterSelect
        id={`company-price-${title.toLowerCase().replace(/\s+/g, "-")}`}
        label={UI_TEXT.table.filters.priceAriaLabel}
        value={priceFilter}
        options={PRICE_FILTER_OPTIONS}
        onChange={onPriceFilterChange}
        className="sm:min-w-48 sm:flex-none"
      />

      {/* Sector */}
      <TableFilterSelect
        id={sectorInputId}
        label={UI_TEXT.table.filters.sectorAriaLabel}
        value={sectorFilter}
        options={sectorOptions}
        onChange={onSectorFilterChange}
        className="sm:min-w-48 sm:flex-none"
      />

      {/* Dividendo (usando el selector personalizado con iconos reales) */}
      <DividendFilterSelect
        value={dividendFilter}
        onChange={onDividendFilterChange}
        className="sm:min-w-48 sm:flex-none"
      />
    </div>
  );
}