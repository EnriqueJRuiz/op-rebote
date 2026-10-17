import { ShieldCheck, ChevronDown } from "lucide-react";
import { UI_TEXT } from "@/domain/literales.constantes";

interface BullishImpulseConfigProps {
  isConfigOpen: boolean;
  setIsConfigOpen: (open: boolean) => void;
  confirmedCount: number;
  earlyCount: number;
}

export function BullishImpulseConfig({
  isConfigOpen,
  setIsConfigOpen,
  confirmedCount,
  earlyCount,
}: BullishImpulseConfigProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-slate-200 bg-white p-4 md:col-span-1">
        <button
          type="button"
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className="flex w-full items-center justify-between text-left md:cursor-default"
        >
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <ShieldCheck size={17} /> {UI_TEXT.pages.bullishImpulse.config.title}
          </div>
          <ChevronDown
            size={18}
            className={`text-slate-500 transition-transform md:hidden ${
              isConfigOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        <div className={`mt-3 space-y-2 text-sm ${isConfigOpen ? "block" : "hidden md:block"}`}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">{UI_TEXT.pages.bullishImpulse.config.radarCapturesLabel}</span>
            <span className="font-semibold text-slate-900">{UI_TEXT.pages.bullishImpulse.config.radarCapturesValue}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-slate-500">{UI_TEXT.pages.bullishImpulse.config.signalTypesLabel}</span>
            <span className="font-semibold text-slate-900">{UI_TEXT.pages.bullishImpulse.config.signalTypesValue}</span>
          </div>
        </div>
      </div>

      <div className="col-span-1 grid grid-cols-2 gap-3 md:col-span-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="text-sm font-medium text-emerald-900">{UI_TEXT.pages.bullishImpulse.cards.confirmedTitle}</div>
          <div className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{confirmedCount}</div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="text-sm font-medium text-amber-900">{UI_TEXT.pages.bullishImpulse.cards.earlyTitle}</div>
          <div className="mt-2 text-3xl font-bold tabular-nums text-slate-900">{earlyCount}</div>
        </div>
      </div>
    </div>
  );
}