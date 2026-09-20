interface ReboundOpportunitiesProps {
  top: string[];
  mid: string[];
}

function OpportunityBlock({ title, opportunities }: { title: string; opportunities: string[] }) {
  return (
    <section className="rounded-lg border border-gray-800 bg-gray-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">{title}</h2>
      {opportunities.length === 0 ? (
        <div className="rounded border border-dashed border-gray-700 px-4 py-8 text-center text-sm text-gray-500">
          No hay oportunidades que cumplan el segundo filtro.
        </div>
      ) : (
        <ul className="divide-y divide-gray-800">
          {opportunities.map((opportunity) => (
            <li key={opportunity} className="py-3 text-gray-200">{opportunity}</li>
          ))}
        </ul>
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