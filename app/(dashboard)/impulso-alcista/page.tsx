import { getBullishImpulseSignals } from "@/app/actions/search-bullish-impulses";
import { BullishImpulsePanel } from "@/components/bullish-impulse-panel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BullishImpulsePage() {
  const result = await getBullishImpulseSignals();
  return <main className="min-h-screen p-5 md:p-8"><div className="mx-auto max-w-7xl">
    <BullishImpulsePanel initialSignals={result.signals} initialError={result.error} />
  </div></main>;
}
