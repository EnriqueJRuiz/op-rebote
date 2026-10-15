"use client";

import { ReactNode } from "react";
import { UI_TEXT } from "@/domain/literales.constantes";
import { Operacion } from "@/domain/models/operacion";
import { ResultadoOperacion } from "@/domain/rules/operacion.rules";
import {
  formatOperationCapital,
  formatOperationPrice,
  formatOperationSignedCapital,
  formatOperationSignedPercent,
} from "./operation-cells";

const RESULT_TONES = {
  gain: { box: "border-emerald-200 bg-emerald-50/60", text: "text-emerald-700" },
  loss: { box: "border-rose-200 bg-rose-50/60", text: "text-rose-700" },
  even: { box: "border-slate-200 bg-slate-50/70", text: "text-slate-800" },
} as const;

// El signo se decide con el importe redondeado a céntimos, para que el color coincida con lo que se lee.
function getTone(netProfit: number | undefined) {
  if (netProfit === undefined) return RESULT_TONES.even;
  const cents = Math.round(netProfit * 100);
  return cents > 0 ? RESULT_TONES.gain : cents < 0 ? RESULT_TONES.loss : RESULT_TONES.even;
}

function SummaryRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium tabular-nums text-slate-800">{children}</dd>
    </div>
  );
}

interface CloseOperationSummaryProps {
  operacion: Operacion;
  // null cuando el precio de salida escrito no es válido todavía.
  resultado: ResultadoOperacion | null;
}

export function CloseOperationSummary({ operacion, resultado }: CloseOperationSummaryProps) {
  const texts = UI_TEXT.operations.closeDialog;
  const tone = getTone(resultado?.beneficioNeto);

  return (
    <>
      <dl className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50/70 text-sm">
        <SummaryRow label={UI_TEXT.table.columns.entryPrice}>
          {formatOperationPrice(operacion.precio_entrada)}
        </SummaryRow>
        <SummaryRow label={texts.invested}>{formatOperationCapital(operacion.capital_invertido)}</SummaryRow>
        <SummaryRow label={texts.exitAmount}>
          {resultado ? formatOperationCapital(resultado.importeSalida) : UI_TEXT.table.values.notAvailable}
        </SummaryRow>
        {resultado && resultado.costes > 0 && (
          <SummaryRow label={texts.costs}>{formatOperationSignedCapital(-resultado.costes)}</SummaryRow>
        )}
      </dl>

      <div className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 ${tone.box}`}>
        <span className="text-sm font-medium text-slate-700">{texts.result}</span>
        <span className={`text-right tabular-nums ${tone.text}`}>
          <span className="block text-lg font-bold">
            {formatOperationSignedCapital(resultado?.beneficioNeto)}
          </span>
          {resultado?.rentabilidadPct != null && (
            <span className="block text-xs font-medium">
              {texts.resultPct(formatOperationSignedPercent(resultado.rentabilidadPct))}
            </span>
          )}
        </span>
      </div>
    </>
  );
}
