// src/components/CompanyTable.tsx
import { DataTable, Column } from "@/components/tables/DataTable";
import { SupabaseCompanyRow } from "@/infrastructure/repositories/upabase-companies.types";

interface CompanyTableProps {
  empresas: SupabaseCompanyRow[];
}

const STYLES = {
  tickerPill: "inline-flex justify-center items-center w-24 font-mono font-bold text-blue-400 bg-blue-950/40 px-2 py-1 rounded border border-blue-800/50 text-xs",
  companyName: "font-semibold text-white tracking-wide",
  secondaryText: "text-gray-300",
  badgeBase: "px-2 py-1 border rounded text-xs inline-block text-center",
  badgeTrue: "bg-green-900/50 text-green-400 border-green-700",
  badgeFalse: "bg-gray-800 text-gray-400 border-gray-700",
};

export function CompanyTable({ empresas }: CompanyTableProps) {
  const columns: Column<SupabaseCompanyRow>[] = [
    { 
      header: "Ticker", 
      render: (e) => (
        <span className={STYLES.tickerPill}>
          {e.ticker}
        </span>
      ) 
    },
    { 
      header: "Nombre", 
      render: (e) => <span className={STYLES.companyName}>{e.nombre}</span> 
    },
    { 
      header: "Sector", 
      render: (e) => <span className={STYLES.secondaryText}>{e.sector || "Desconocido"}</span> 
    },
    { 
      header: "Precio", 
      render: (e) => <span className={STYLES.secondaryText}>${e.precio?.toFixed(2) ?? "0.00"}</span> 
    },
    { 
      header: "Volumen", 
      render: (e) => <span className={STYLES.secondaryText}>{e.volumen?.toLocaleString() ?? 0}</span> 
    },
    { 
      header: "¿Dividendo?", 
      render: (e) => {
        const estadoClase = e.es_dividendo ? STYLES.badgeTrue : STYLES.badgeFalse;
        return (
          <span className={`${STYLES.badgeBase} ${estadoClase}`}>
            {e.es_dividendo ? "Sí" : "No"}
          </span>
        );
      } 
    }
  ];

  return (
    <DataTable 
      title="Universo de Empresas"
      subtitle="Listado sincronizado desde Supabase"
      data={empresas}
      columns={columns}
      rowKey={(e) => e.id}
    />
  );
}