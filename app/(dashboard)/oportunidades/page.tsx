import { ReboundOpportunities } from "@/components/rebound-opportunities";

export default function OpportunitiesPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-3xl font-bold">Oportunidades de rebote</h1>
        <p className="mb-8 text-gray-400">Empresas que superen el segundo filtro.</p>
        <ReboundOpportunities top={[]} mid={[]} />
      </div>
    </main>
  );
}