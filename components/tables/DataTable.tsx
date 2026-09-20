import { ReactNode } from "react";

// Definimos la estructura de cada columna
export interface Column<T> {
  header: string;
  render: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  title: string;
  subtitle: string;
  data: T[];
  columns: Column<T>[];
  rowKey: (item: T) => string | number;
}

export function DataTable<T>({ title, subtitle, data, columns, rowKey }: DataTableProps<T>) {
  return (
    <main className="min-h-screen p-8 bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">{title}</h1>
        <p className="text-gray-400 mb-6">{subtitle}</p>

        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50 text-gray-400 text-sm">
                {columns.map((col, index) => (
                  <th key={index} className="p-4">{col.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {data.map((item) => (
                <tr key={rowKey(item)} className="hover:bg-gray-850">
                  {columns.map((col, index) => (
                    <td key={index} className="p-4">
                      {col.render(item)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}