"use client";

import { useState, useTransition } from "react";
import { Activity, BellRing, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { BullishSignal } from "@/domain/models/bullish-impulse";
import { scanBullishImpulseAction } from "@/app/actions/search-bullish-impulses";

export function BullishImpulsePanel({ initialSignals, initialError }: { initialSignals: BullishSignal[]; initialError?: string }) {
  const [signals, setSignals] = useState(initialSignals);
  const [message, setMessage] = useState(initialError ?? "");
  const [isPending, startTransition] = useTransition();
  const early = signals.filter((s) => s.tipo === "TEMPRANA");
  const confirmed = signals.filter((s) => s.tipo === "CONFIRMADA");
  const runScan = () => startTransition(async () => {
    const result = await scanBullishImpulseAction();
    setMessage(result.message);
    if (result.success) window.location.reload();
  });
  const fmt = (date: string) => new Date(date).toLocaleString("es-ES", { dateStyle: "short", timeStyle: "short" });
  const panel = (title: string, subtitle: string, rows: BullishSignal[], icon: React.ReactNode) => <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="mb-4 flex items-start gap-3"><div className="rounded-xl bg-slate-100 p-2 text-slate-700">{icon}</div><div><h2 className="font-semibold text-slate-900">{title}</h2><p className="text-sm text-slate-500">{subtitle}</p></div><span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-sm font-semibold">{rows.length}</span></div>
    {rows.length === 0 ? <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No hay señales guardadas de este tipo.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="py-2 pr-3">Empresa</th><th className="py-2 pr-3">Precio</th><th className="py-2 pr-3">Barra</th><th className="py-2 pr-3">Volumen rel.</th><th className="py-2 pr-3">Detectada</th></tr></thead><tbody>{rows.map((s, i) => <tr key={`${s.ticker}-${s.tipo}-${s.detectadaEn}-${i}`} className="border-t border-slate-100"><td className="py-3 pr-3"><div className="font-medium text-slate-900">{s.ticker}</div><div className="max-w-48 truncate text-xs text-slate-500">{s.nombre}</div><div className="mt-1 text-xs text-slate-500">{s.motivo}</div></td><td className="whitespace-nowrap py-3 pr-3">{s.precio.toLocaleString("es-ES", { maximumFractionDigits: 3 })}</td><td className={`whitespace-nowrap py-3 pr-3 ${s.variacionBarraPct >= 0 ? "text-emerald-700" : "text-rose-700"}`}>{s.variacionBarraPct.toFixed(2)}%</td><td className="py-3 pr-3">{s.volumenRelativo == null ? "—" : `${s.volumenRelativo.toFixed(2)}×`}</td><td className="whitespace-nowrap py-3 pr-3">{fmt(s.detectadaEn)}</td></tr>)}</tbody></table></div>}
  </section>;
  return <div className="space-y-6">
    <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><div className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700"><Activity size={16}/> Estrategia independiente</div><h1 className="text-3xl font-bold tracking-tight text-slate-900">Impulso Alcista</h1><p className="mt-2 max-w-3xl text-slate-600">Busca señales intradía en las empresas ya guardadas en Empresas Radar. No modifica las reglas de Rebotes.</p></div><button onClick={runScan} disabled={isPending} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"> <RefreshCw size={16} className={isPending ? "animate-spin" : ""}/>{isPending ? "Analizando universo…" : "Analizar ahora"}</button></header>
    <div className="grid gap-3 md:grid-cols-3"><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-sm text-slate-500">Frecuencia objetivo</div><div className="mt-1 text-xl font-semibold">15 minutos</div><div className="mt-1 text-xs text-slate-500">La ejecución automática se configura en el cron externo.</div></div><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-sm text-slate-500">Tipos de alerta</div><div className="mt-1 text-xl font-semibold">Temprana + confirmada</div><div className="mt-1 text-xs text-slate-500">Reglas independientes entre sí.</div></div><div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-sm text-slate-500">Independencia</div><div className="mt-1 flex items-center gap-2 text-xl font-semibold"><ShieldCheck size={20}/> Rebotes intacto</div><div className="mt-1 text-xs text-slate-500">Las señales se guardan en una tabla separada.</div></div></div>
    {message && <div className="rounded-xl border border-slate-200 bg-white p-3 text-sm text-slate-700">{message}</div>}
    {panel("Señales tempranas", "Primer indicio de impulso; mayor probabilidad de falsas señales.", early, <BellRing size={20}/>)}
    {panel("Señales confirmadas", "Ruptura de máximos recientes acompañada de volumen.", confirmed, <TrendingUp size={20}/>)}
    <p className="text-xs leading-5 text-slate-500">Las reglas son una primera versión técnica, no una recomendación automática de compra. La cobertura intradía depende de la disponibilidad de datos de Yahoo Finance y debe validarse con pruebas históricas.</p>
  </div>;
}
