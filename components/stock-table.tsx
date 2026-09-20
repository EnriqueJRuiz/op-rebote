import { StockCandidate } from "@/domain/models/trading";

interface StockTableProps {
  candidatos: StockCandidate[];
}

// 1. Extraemos la lógica visual a un mini-componente privado
function StatusBadge({ esValido, motivo }: { esValido: boolean; motivo?: string }) {
  const estilos = esValido 
    ? "bg-green-900/50 text-green-400 border-green-700" 
    : "bg-red-900/50 text-red-400 border-red-700";

  return (
    <span className={`px-2 py-1 border rounded text-xs ${estilos}`} title={!esValido ? motivo : undefined}>
      {esValido ? "Válido" : "Descartado"}
    </span>
  );
}

// 2. La tabla principal queda totalmente limpia y legible
export function StockTable({ candidatos }: StockTableProps) {
    return (      
    <main className="min-h-screen p-8 bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Escáner de Swing Trading</h1>
        <p className="text-gray-400 mb-6">Filtrando mid-caps (RSI y Volumen)</p>

        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden shadow-lg">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900/50 text-gray-400 text-sm">
                <th className="p-4">Ticker</th>
                <th className="p-4">Nombre</th>
                <th className="p-4">Precio</th>
                <th className="p-4">RSI</th>
                <th className="p-4">Volumen</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {candidatos.map((stock) => (
                <tr key={stock.ticker} className="hover:bg-gray-850">
                  <td className="p-4 font-bold">{stock.ticker}</td>
                  <td className="p-4 text-gray-300">{stock.nombre}</td>
                  <td className="p-4">${stock.precio.toFixed(2)}</td>
                  <td className="p-4">{stock.rsi}</td>
                  <td className="p-4">{stock.volumen.toLocaleString()}</td>
                  <td className="p-4">
                    <StatusBadge esValido={stock.esValido} motivo={stock.motivoDescarte} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}