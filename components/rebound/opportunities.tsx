import { StockCandidate } from "@/domain/models/trading";

interface ReboundOpportunitiesProps {
  top: StockCandidate[];
  mid: StockCandidate[];
}

function OpportunityBlock({ title, opportunities }: { title: string; opportunities: StockCandidate[] }) {
  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {opportunities.length === 0 ? (
        <div className="rounded border border-dashed border-gray-700 px-4 py-8 text-center text-sm text-gray-500">
          No hay oportunidades que cumplan el segundo filtro.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-800 text-gray-400">
              <tr>
                <th className="p-3">Ticker</th>
                <th className="p-3">Nombre</th>
                <th className="p-3">Precio</th>
                <th className="p-3">RSI</th>
                <th className="p-3">Volumen</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {opportunities.map((opportunity) => (
                <tr key={opportunity.ticker} className="text-gray-200">
                  <td className="p-3 font-bold">{opportunity.ticker}</td>
                  <td className="p-3">{opportunity.nombre}</td>
                  <td className="p-3">{opportunity.precio.toFixed(2)}</td>
                  <td className="p-3">{opportunity.rsi.toFixed(2)}</td>
                  <td className="p-3">{opportunity.volumen.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function ReboundOpportunities({ top, mid }: ReboundOpportunitiesProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <OpportunityBlock title="TOP" opportunities={top} />
      <OpportunityBlock title="MID" opportunities={mid} />
    </div>
  );
}