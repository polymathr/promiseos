import { trpc } from "@/lib/trpc";
import { BarChart3, ShieldCheck } from "lucide-react";

export function ReliabilityDashboard() {
  const dashboard = trpc.promise.personalReliability.useQuery();
  if (dashboard.isLoading) return <section className="mt-6 h-40 animate-pulse rounded-[1.25rem] border bg-white/60" />;
  const data = dashboard.data;
  if (!data) return null;
  return <section className="mt-6 overflow-hidden rounded-[1.25rem] border border-[#d7e3df] bg-white shadow-[0_8px_20px_rgba(30,42,50,.05)]"><div className="flex flex-wrap items-start justify-between gap-4 p-5"><div><p className="text-xs font-extrabold uppercase tracking-[.12em] text-[#66737b]">Private reliability dashboard</p><h2 className="mt-1 text-lg font-extrabold tracking-[-.025em]">Your follow-through, made visible.</h2><p className="mt-1.5 max-w-xl text-xs leading-5 text-[#66737b]">Visible only to you. This is not a public ranking and is never shared with participants.</p></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5f0ee] text-[#1f5558]"><ShieldCheck className="h-5 w-5" /></span></div><div className="border-t border-[#edf0ee] p-5"><div className="flex flex-wrap items-end gap-4"><div><p className="text-4xl font-extrabold tracking-[-.05em] text-[#1f5558]">{data.score ?? "—"}</p><p className="mt-1 text-xs font-extrabold text-[#526a6b]">{data.label}</p></div><div className="min-w-[200px] flex-1"><div className="h-2 overflow-hidden rounded-full bg-[#e8edeb]"><div className="h-full rounded-full bg-[#1f5558]" style={{ width: `${data.score ?? 0}%` }} /></div><p className="mt-2 text-[11px] leading-5 text-[#66737b]">{data.evidenceCount} resolved commitment{data.evidenceCount === 1 ? "" : "s"} in your private record.</p></div><BarChart3 className="mb-1 h-5 w-5 text-[#96aaa6]" /></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-5"><Metric label="Completed" value={data.completed} tone="bg-[#e8f0ea] text-[#3f6b50]" /><Metric label="Acknowledged" value={data.acknowledged} tone="bg-[#e5f0ee] text-[#1f5558]" /><Metric label="Renegotiated" value={data.renegotiated} tone="bg-[#f5e8e3] text-[#7d493b]" /><Metric label="Blocked" value={data.blocked} tone="bg-[#ecebf3] text-[#56546d]" /><Metric label="Disputed" value={data.disputed} tone="bg-[#f7e5e1] text-[#894038]" /></div><p className="mt-4 text-[11px] leading-5 text-[#66737b]">{data.explanation}</p></div></section>;
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={`rounded-xl p-3 ${tone}`}><p className="text-lg font-extrabold">{value}</p><p className="mt-1 text-[10px] font-extrabold uppercase tracking-[.07em]">{label}</p></div>;
}
