import { AlertTriangle, CheckCircle2, Circle, Clock3, PauseCircle, ShieldAlert } from "lucide-react";

type Status = "proposed" | "active" | "at_risk" | "blocked" | "renegotiation_proposed" | "renegotiated" | "complete" | "acknowledged" | "disputed" | "declined" | "archived";

const style: Record<Status, { label: string; classes: string; Icon: typeof Circle }> = {
  proposed: { label: "Proposed", classes: "bg-[#eef0ed] text-[#5f6d70]", Icon: Clock3 },
  active: { label: "Active", classes: "bg-[#e5f0ee] text-[#1f5558]", Icon: Circle },
  at_risk: { label: "At risk", classes: "bg-[#f7edda] text-[#8d5b1e]", Icon: AlertTriangle },
  blocked: { label: "Blocked", classes: "bg-[#ecebf3] text-[#56546d]", Icon: PauseCircle },
  renegotiation_proposed: { label: "New plan proposed", classes: "bg-[#f5e8e3] text-[#7d493b]", Icon: Clock3 },
  renegotiated: { label: "Renegotiated", classes: "bg-[#f5e8e3] text-[#7d493b]", Icon: CheckCircle2 },
  complete: { label: "Complete", classes: "bg-[#e8f0ea] text-[#3f6b50]", Icon: CheckCircle2 },
  acknowledged: { label: "Acknowledged", classes: "bg-[#e8f0ea] text-[#3f6b50]", Icon: CheckCircle2 },
  disputed: { label: "Disputed", classes: "bg-[#f7e5e1] text-[#894038]", Icon: ShieldAlert },
  declined: { label: "Declined", classes: "bg-[#eef0ed] text-[#5f6d70]", Icon: Circle },
  archived: { label: "Archived", classes: "bg-[#eef0ed] text-[#5f6d70]", Icon: Clock3 },
};

export function StatusPill({ status }: { status: string }) {
  const item = style[(status as Status) in style ? status as Status : "proposed"];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-extrabold ${item.classes}`}><item.Icon className="h-3 w-3" />{item.label}</span>;
}
