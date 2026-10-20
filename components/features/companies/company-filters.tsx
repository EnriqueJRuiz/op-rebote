"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Search, Crown, ChessBishop, SlidersHorizontal, X } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { UI_STYLES } from "@/styles/ui-styles";
import { MARKET_SESSION_OPTIONS, MarketSessionFilter } from "@/domain/constants";

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
  onChange = () => {},
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
        className={`w-full flex items-center text-left pr-8 ${UI_STYLES.filter.select}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex items-center gap-2 truncate">
          {selectedOption.icon}
          <span className="truncate">{selectedOption.label}</span>
        </span>
      </button>

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
  marketSessionFilter: MarketSessionFilter;
  onMarketSessionFilterChange: (value: MarketSessionFilter) => void;
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
  marketSessionFilter,
  onMarketSessionFilterChange,
  sectores,
}: CompanyFiltersProps) {
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const searchInputId = `company-search-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const sectorInputId = `company-sector-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const sessionInputId = `company-session-${title.toLowerCase().replace(/\s+/g, "-")}`;
  const priceInputId = `company-price-${title.toLowerCase().replace(/\s+/g, "-")}`;
  
  const sectorLabel = UI_TEXT.table.columns.sector;

  const sectorOptions: FilterOption<string>[] = [
    { value: FILTER_ALL, label: `${sectorLabel}: Todos` },
    ...sectores.map((sector) => ({ value: sector, label: `${sectorLabel}: ${sector}` })),
  ];

  // Contar cuántos filtros activos hay para mostrar un badge en el botón
  const activeFiltersCount = [
    priceFilter !== FILTER_ALL,
    marketSessionFilter !== FILTER_ALL,
    sectorFilter !== FILTER_ALL,
    dividendFilter !== FILTER_ALL,
  ].filter(Boolean).length;

  // Cerrar modal al hacer clic fuera o presionar Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileFilterOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="w-full">
      {/* BARRA PRINCIPAL: Búsqueda + Botón de Filtros (Móvil) */}
      <div className="flex items-center gap-2">
        {/* Buscador (ocupa todo el espacio restante) */}
        <div className="relative flex-1 sm:min-w-60">
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

        {/* Botón de Filtros solo visible en móvil */}
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(true)}
          className="relative flex items-center justify-center gap-2 h-10 px-3.5 rounded-md border border-slate-200 bg-white text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:hidden shrink-0"
          aria-expanded={isMobileFilterOpen}
          aria-label="Abrir filtros"
        >
          <SlidersHorizontal size={16} className="text-slate-500" />
          <span>Filtros</span>
          {activeFiltersCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-[11px] font-semibold text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* FILTROS EN ESCRITORIO (sm:flex) - Permanece exactamente como el original */}
        <div className="hidden sm:flex sm:items-center sm:gap-2 sm:flex-wrap">
          <TableFilterSelect
            id={priceInputId}
            label={UI_TEXT.table.filters.priceAriaLabel}
            value={priceFilter}
            options={PRICE_FILTER_OPTIONS}
            onChange={onPriceFilterChange}
            className="sm:min-w-44 sm:flex-none"
          />

          <TableFilterSelect
            id={sessionInputId}
            label={UI_TEXT.table.filters.sessionAriaLabel}
            value={marketSessionFilter}
            options={MARKET_SESSION_OPTIONS}
            onChange={onMarketSessionFilterChange}
            className="sm:min-w-44 sm:flex-none"
          />

          <TableFilterSelect
            id={sectorInputId}
            label={sectorLabel}
            value={sectorFilter}
            options={sectorOptions}
            onChange={onSectorFilterChange}
            className="sm:min-w-44 sm:flex-none"
          />

          <DividendFilterSelect
            value={dividendFilter}
            onChange={onDividendFilterChange}
            className="sm:min-w-44 sm:flex-none"
          />
        </div>
      </div>

      {/* MODAL / DIÁLOGO DE FILTROS EN MÓVIL */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center sm:hidden bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          {/* Backdrop click to close */}
          <div className="fixed inset-0" onClick={() => setIsMobileFilterOpen(false)} />

          <div
            ref={modalRef}
            className="relative z-10 w-full rounded-t-2xl bg-white p-5 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200"
          >
            {/* Cabecera del Dialog */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-slate-700" />
                <h3 className="font-semibold text-slate-800 text-base">Filtros de búsqueda</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Formulario de Filtros en columna vertical */}
            <div className="space-y-3.5 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Último Precio</label>
                <TableFilterSelect
                  id={`${priceInputId}-mobile`}
                  label={UI_TEXT.table.filters.priceAriaLabel}
                  value={priceFilter}
                  options={PRICE_FILTER_OPTIONS}
                  onChange={onPriceFilterChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Sesión de Mercado</label>
                <TableFilterSelect
                  id={`${sessionInputId}-mobile`}
                  label={UI_TEXT.table.filters.sessionAriaLabel}
                  value={marketSessionFilter}
                  options={MARKET_SESSION_OPTIONS}
                  onChange={onMarketSessionFilterChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Sector</label>
                <TableFilterSelect
                  id={`${sectorInputId}-mobile`}
                  label={sectorLabel}
                  value={sectorFilter}
                  options={sectorOptions}
                  onChange={onSectorFilterChange}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Dividendo</label>
                <DividendFilterSelect
                  value={dividendFilter}
                  onChange={onDividendFilterChange}
                  className="w-full"
                />
              </div>
            </div>

            {/* Botón de Confirmación */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md shadow-sm transition-colors text-center"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}