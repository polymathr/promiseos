import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildPromiseCalendar } from "@/lib/calendar";
import { trpc } from "@/lib/trpc";
import {
  Bell,
  BellRing,
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  CircleHelp,
  Clock3,
  FileText,
  Flag,
  Handshake,
  HeartHandshake,
  Home as HomeIcon,
  Inbox,
  Menu,
  MoreHorizontal,
  PanelRight,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type PromiseStatus =
  | "active"
  | "at risk"
  | "blocked"
  | "renegotiation proposed"
  | "renegotiated"
  | "complete"
  | "acknowledged"
  | "disputed"
  | "proposed";

type TimelineEvent = {
  id: number;
  label: string;
  by: string;
  at: string;
  detail?: string;
  tone?: "primary" | "amber" | "clay" | "moss" | "slate";
};

type PromiseItem = {
  id: number;
  title: string;
  promisor: string;
  recipient: string;
  due: string;
  dueLabel: string;
  completion: string;
  context: string;
  status: PromiseStatus;
  responsibility: "You are responsible" | "Waiting on you" | "Shared";
  kind: "outgoing" | "incoming" | "shared";
  events: TimelineEvent[];
};

const initialPromises: PromiseItem[] = [
  {
    id: 1,
    title: "Send the revised proposal",
    promisor: "You",
    recipient: "Maya Chen",
    due: "2026-08-28",
    dueLabel: "Tomorrow · 3:00 PM",
    completion: "A shareable proposal link is sent to Maya.",
    context: "Identity refresh for the Solace Studio launch.",
    status: "at risk",
    responsibility: "You are responsible",
    kind: "outgoing",
    events: [
      { id: 1, label: "Promise confirmed", by: "You and Maya", at: "Aug 24 · 10:12 AM", tone: "primary" },
      { id: 2, label: "Maya added context", by: "Maya", at: "Aug 25 · 9:34 AM", detail: "Please include the simplified budget option.", tone: "slate" },
      { id: 3, label: "Reminder scheduled", by: "PromiseOS", at: "Aug 27 · 9:00 AM", tone: "amber" },
    ],
  },
  {
    id: 2,
    title: "Share the onboarding materials",
    promisor: "Ren Ito",
    recipient: "You",
    due: "2026-08-29",
    dueLabel: "Friday · 11:00 AM",
    completion: "The welcome deck and access links are shared.",
    context: "New research collaborator onboarding.",
    status: "renegotiation proposed",
    responsibility: "Waiting on you",
    kind: "incoming",
    events: [
      { id: 1, label: "Promise confirmed", by: "You and Ren", at: "Aug 23 · 4:20 PM", tone: "primary" },
      { id: 2, label: "A new plan was proposed", by: "Ren", at: "Today · 8:42 AM", detail: "Could we move this to Friday morning?", tone: "clay" },
    ],
  },
  {
    id: 3,
    title: "Confirm venue access details",
    promisor: "You",
    recipient: "Omar Vale",
    due: "2026-08-30",
    dueLabel: "Saturday",
    completion: "Access instructions are confirmed in writing.",
    context: "Autumn workshop planning.",
    status: "blocked",
    responsibility: "You are responsible",
    kind: "outgoing",
    events: [
      { id: 1, label: "Promise confirmed", by: "You and Omar", at: "Aug 22 · 2:10 PM", tone: "primary" },
      { id: 2, label: "Marked blocked", by: "You", at: "Yesterday · 2:16 PM", detail: "Waiting for building management approval.", tone: "slate" },
    ],
  },
  {
    id: 4,
    title: "Review the partnership outline",
    promisor: "Maya Chen",
    recipient: "You",
    due: "2026-09-02",
    dueLabel: "Next Tuesday",
    completion: "Written feedback is added to the outline.",
    context: "Solace Studio partnership planning.",
    status: "active",
    responsibility: "Shared",
    kind: "shared",
    events: [{ id: 1, label: "Promise confirmed", by: "You and Maya", at: "Aug 25 · 11:05 AM", tone: "primary" }],
  },
];

const statusClasses: Record<PromiseStatus, string> = {
  active: "status-active",
  "at risk": "status-at-risk",
  blocked: "status-blocked",
  "renegotiation proposed": "status-renegotiation",
  renegotiated: "status-active",
  complete: "status-complete",
  acknowledged: "status-acknowledged",
  disputed: "status-disputed",
  proposed: "status-pending",
};

const navItems = [
  { label: "Today", href: "/", icon: HomeIcon },
  { label: "Promises", href: "/promises", icon: Handshake },
  { label: "People", href: "/people", icon: UsersRound },
  { label: "Settings", href: "/settings", icon: Settings },
];

function StatusPill({ status }: { status: PromiseStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-[0.02em] ${statusClasses[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden="true" />
      {status}
    </span>
  );
}

function Avatar({ name, tone = "teal" }: { name: string; tone?: "teal" | "clay" | "moss" | "slate" }) {
  const tones = {
    teal: "bg-[#dcebea] text-[#1f5558]",
    clay: "bg-[#f4e2dc] text-[#8f5041]",
    moss: "bg-[#e2eee4] text-[#426c51]",
    slate: "bg-[#e8e8f0] text-[#5d5a74]",
  };
  return <span className={`inline-grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-extrabold ${tones[tone]}`}>{name.split(" ").map(part => part[0]).join("").slice(0, 2)}</span>;
}

function PromiseCard({ item, onOpen, onExport }: { item: PromiseItem; onOpen: () => void; onExport: () => void }) {
  return (
    <article className="promise-card hairline w-full rounded-2xl border bg-white p-4 text-left shadow-[0_4px_14px_rgba(30,42,50,0.035)]">
      <button onClick={onOpen} className="block w-full text-left focus-visible:outline-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[15px] font-extrabold tracking-[-0.015em] text-[#1e2a32]">{item.title}</p>
            <div className="mt-2 flex items-center gap-2 text-xs text-[#66737b]">
              <Avatar name={item.kind === "outgoing" ? item.recipient : item.promisor} tone={item.kind === "outgoing" ? "clay" : "teal"} />
              <span className="truncate">{item.kind === "outgoing" ? `With ${item.recipient}` : `From ${item.promisor}`}</span>
            </div>
          </div>
          <StatusPill status={item.status} />
        </div>
      </button>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#edf0ee] pt-3 text-xs">
        <span className="inline-flex items-center gap-1.5 font-bold text-[#66737b]"><Clock3 className="h-3.5 w-3.5" />{item.dueLabel}</span>
        <span className="flex items-center gap-2"><button onClick={onExport} className="pressable grid h-7 w-7 place-items-center rounded-lg text-[#526a6b] hover:bg-[#edf3f0] hover:text-[#1f5558]" aria-label={`Add ${item.title} to calendar`} title="Add to calendar"><CalendarDays className="h-3.5 w-3.5" /></button><button onClick={onOpen} className="pressable rounded-lg px-1 text-xs font-bold text-[#1f5558] hover:bg-[#edf3f0]">Open <ChevronRight className="inline h-3.5 w-3.5" /></button></span>
      </div>
    </article>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-[1.25rem] border border-dashed border-[#cbd7d3] bg-white/60 px-6 py-12 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-[#e5f0ee] text-[#1f5558]"><HeartHandshake className="h-6 w-6" /></div>
      <h3 className="mt-4 text-base font-extrabold">Nothing needs you right now.</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#66737b]">When an important agreement comes up, make it clear while the conversation is still fresh.</p>
      <Button onClick={onCreate} className="pressable mt-5 rounded-xl bg-[#1f5558] px-4 text-white hover:bg-[#18484b]">Create a promise</Button>
    </div>
  );
}

export default function Home() {
  const [location, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const promiseListQuery = trpc.promise.list.useQuery(undefined, { enabled: isAuthenticated });
  const createPromiseMutation = trpc.promise.create.useMutation();
  const updateReminderPreferencesMutation = trpc.promise.updateReminderPreferences.useMutation();
  const reminderPreferencesQuery = trpc.promise.reminderPreferences.useQuery(undefined, { enabled: isAuthenticated });
  const reliabilityQuery = trpc.promise.reliability.useQuery({}, { enabled: isAuthenticated });
  const [promises, setPromises] = useState<PromiseItem[]>(initialPromises);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeEnabled, setNoticeEnabled] = useState(false);
  const [confirmationFeedback, setConfirmationFeedback] = useState(false);
  const [filter, setFilter] = useState("");
  const selected = selectedId === null ? undefined : promises.find(item => item.id === selectedId);
  const activePage = location === "/" ? "Today" : navItems.find(item => item.href === location)?.label ?? "Today";
  const visiblePromises = useMemo(() => promises.filter(item => item.title.toLowerCase().includes(filter.toLowerCase()) || item.promisor.toLowerCase().includes(filter.toLowerCase()) || item.recipient.toLowerCase().includes(filter.toLowerCase())), [filter, promises]);
  const openPromises = promises.filter(item => !["complete", "acknowledged"].includes(item.status));
  const upcoming = promises.filter(item => item.id !== 2 && !["complete", "acknowledged"].includes(item.status));

  const updatePromise = (id: number, patch: Partial<PromiseItem>, event?: Omit<TimelineEvent, "id">) => {
    setPromises(current => current.map(item => item.id === id ? { ...item, ...patch, events: event ? [...item.events, { ...event, id: item.events.length + 1 }] : item.events } : item));
  };

  const respondToInvitation = (response: "accepted" | "counterproposed" | "declined" | "clarified") => {
    if (!selected) return;
    if (response === "accepted") {
      updatePromise(selected.id, { status: "active", responsibility: "Shared" }, { label: "New plan accepted", by: "You", at: "Just now", detail: "Friday at 11:00 AM works for you.", tone: "primary" });
      setConfirmationFeedback(true);
      window.setTimeout(() => setConfirmationFeedback(false), 1800);
      toast.success("The new plan is active for both of you.");
    }
    if (response === "counterproposed") {
      updatePromise(selected.id, { status: "renegotiation proposed" }, { label: "You proposed a different time", by: "You", at: "Just now", detail: "Friday at 2:00 PM would work better.", tone: "clay" });
      toast.message("Your counterproposal is ready for Ren.");
    }
    if (response === "declined") {
      updatePromise(selected.id, { status: "at risk" }, { label: "Proposed change declined", by: "You", at: "Just now", tone: "amber" });
      toast.message("The original agreement remains in view.");
    }
    if (response === "clarified") {
      updatePromise(selected.id, {}, { label: "Clarification requested", by: "You", at: "Just now", detail: "Could you confirm which access links are included?", tone: "slate" });
      toast.message("A calm clarification request was sent.");
    }
  };

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const person = String(form.get("person") || "").trim();
    const recipientEmail = String(form.get("recipientEmail") || "").trim();
    const due = String(form.get("due") || "");
    if (!title || !person) {
      toast.error("Add the promise and the person involved.");
      return;
    }
    const next: PromiseItem = {
      id: Math.max(...promises.map(item => item.id)) + 1,
      title,
      promisor: "You",
      recipient: person,
      due,
      dueLabel: due ? new Date(`${due}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" }) : "No date set",
      completion: String(form.get("completion") || "Acknowledge that the promised work has been shared."),
      context: String(form.get("context") || "No additional context added."),
      status: "proposed",
      responsibility: "You are responsible",
      kind: "outgoing",
      events: [{ id: 1, label: "Promise proposed", by: "You", at: "Just now", detail: `Waiting for ${person} to confirm the same agreement.`, tone: "primary" }],
    };
    setPromises(current => [next, ...current]);
    if (isAuthenticated) {
      createPromiseMutation.mutate({
        title,
        dueAt: due ? new Date(`${due}T12:00:00`) : undefined,
        completionCondition: next.completion,
        context: next.context,
        recipientEmail: recipientEmail || undefined,
      }, {
        onSuccess: () => {
          promiseListQuery.refetch();
          toast.success("Your promise was saved to your private workspace.");
        },
        onError: () => toast.error("The preview was created, but your synced copy could not be saved."),
      });
    }
    setSelectedId(next.id);
    setComposerOpen(false);
    toast.success(isAuthenticated ? `Promise prepared for ${person}.` : `Preview promise created for ${person}. Sign in to save it privately.`);
  };

  const requestBrowserNotifications = async () => {
    if (!("Notification" in window)) {
      toast.error("This browser does not support notifications.");
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      setNoticeEnabled(true);
      if (isAuthenticated) updateReminderPreferencesMutation.mutate({ browserNotifications: true });
      new Notification("PromiseOS reminders are ready", { body: "You control what reaches you and when." });
      toast.success("Browser reminders are enabled.");
      return;
    }
    toast.message("Browser reminders remain off. You can change this anytime.");
  };

  const navigate = (href: string) => {
    setLocation(href);
    setMobileOpen(false);
  };

  const exportPromiseToCalendar = (item: PromiseItem) => {
    if (!item.due) {
      toast.message("Add a due date before exporting this promise to your calendar.");
      return;
    }
    const calendar = buildPromiseCalendar(item);
    const blob = new Blob([calendar], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${item.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "promise"}.ics`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    toast.success("Calendar file downloaded. Choose your calendar to add this promise.");
  };

  const saveReminderPreference = (key: "dueDateReminders" | "invitationReminders" | "emailSummaries", value: boolean) => {
    if (!isAuthenticated) {
      toast.message("Sign in to keep reminder preferences across your devices.");
      return;
    }
    updateReminderPreferencesMutation.mutate({ [key]: value }, {
      onSuccess: () => {
        reminderPreferencesQuery.refetch();
        toast.success("Reminder preference updated.");
      },
      onError: () => toast.error("That reminder preference could not be saved."),
    });
  };

  const renderToday = () => (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <section className="min-w-0">
        <div className="enter flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#66737b]">Tuesday, August 26</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em] text-[#1e2a32] md:text-[34px]">Your agreements, in focus.</h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-[#66737b]">One promise needs your decision. The rest can wait until they are relevant.</p>
          </div>
          <Button onClick={() => setComposerOpen(true)} className="pressable rounded-xl bg-[#1f5558] px-4 py-5 text-sm font-extrabold text-white hover:bg-[#18484b]"><Plus className="mr-1.5 h-4 w-4" />New promise</Button>
        </div>

        <div className="enter-delayed mt-7 overflow-hidden rounded-[1.35rem] border border-[#d3dfdb] bg-[#f0f6f4] soft-shadow">
          <div className="border-b border-[#dbe7e2] px-5 py-4 md:px-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#1f5558]"><span className="grid h-6 w-6 place-items-center rounded-lg bg-white text-[#1f5558]"><Flag className="h-3.5 w-3.5" /></span>Next action</div>
              <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-[#50666a]">Needs a reply</span>
            </div>
          </div>
          <div className="p-5 md:p-6">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
              <div className="max-w-xl">
                <p className="text-xl font-extrabold tracking-[-0.035em] text-[#193b3e] md:text-2xl">Review Ren’s proposed new plan.</p>
                <p className="mt-2 text-sm leading-6 text-[#48666a]">Ren asked to move the onboarding materials to Friday at 11:00 AM. You can accept, suggest another time, or ask one focused question.</p>
                <div className="mt-4 flex items-center gap-2 text-xs font-bold text-[#526a6b]"><Avatar name="Ren Ito" />Ren Ito · shared promise</div>
              </div>
              <Button onClick={() => setSelectedId(2)} variant="outline" className="pressable shrink-0 rounded-xl border-[#9bbdb4] bg-white px-4 font-extrabold text-[#1f5558] hover:bg-[#f8fcfa]">Review plan <ChevronRight className="ml-1 h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        <div className="enter-late mt-8">
          <div className="flex items-center justify-between gap-4">
            <div><h2 className="text-lg font-extrabold tracking-[-0.025em]">Upcoming commitments</h2><p className="mt-1 text-sm text-[#66737b]">The agreements already in motion.</p></div>
            <button onClick={() => navigate("/promises")} className="text-sm font-extrabold text-[#1f5558] hover:underline">See all promises</button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">{upcoming.slice(0, 4).map(item => <PromiseCard key={item.id} item={item} onOpen={() => setSelectedId(item.id)} onExport={() => exportPromiseToCalendar(item)} />)}</div>
          {!upcoming.length && <div className="mt-4"><EmptyState onCreate={() => setComposerOpen(true)} /></div>}
        </div>
      </section>

      <aside className="enter-late space-y-4">
        <section className="rounded-[1.25rem] border bg-white p-5 subtle-shadow">
          <div className="flex items-center justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#66737b]">Promise health</p><h2 className="mt-1 text-lg font-extrabold tracking-[-0.03em]">This week</h2></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e5f0ee] text-[#1f5558]"><ShieldCheck className="h-5 w-5" /></div></div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-[#f6f7f5] p-3"><p className="text-2xl font-extrabold">{openPromises.length}</p><p className="mt-1 text-[11px] font-bold text-[#66737b]">Open</p></div>
            <div className="rounded-xl bg-[#e8f0ea] p-3"><p className="text-2xl font-extrabold text-[#3f6b50]">4</p><p className="mt-1 text-[11px] font-bold text-[#55715e]">Closed</p></div>
          </div>
          <p className="mt-4 text-xs leading-5 text-[#66737b]">The ledger describes what happened between people. It does not rank anyone.</p>
        </section>
        <section className="rounded-[1.25rem] border bg-white p-5 subtle-shadow">
          <div className="flex items-center gap-2"><BellRing className="h-4 w-4 text-[#a96f26]" /><h2 className="font-extrabold tracking-[-0.02em]">Gentle reminders</h2></div>
          <p className="mt-2 text-xs leading-5 text-[#66737b]">One clear reminder before a due date. No streaks, no guilt, no noise.</p>
          <button onClick={requestBrowserNotifications} className="pressable mt-4 flex w-full items-center justify-between rounded-xl border border-[#dfe6e2] px-3.5 py-3 text-left text-xs font-extrabold text-[#30595b] hover:bg-[#f8fbf9]">
            <span>{noticeEnabled ? "Browser reminders enabled" : "Enable browser reminders"}</span>{noticeEnabled ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </section>
      </aside>
    </div>
  );

  const renderPromises = () => (
    <section className="max-w-5xl">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#66737b]">Shared memory</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em]">Promises</h1><p className="mt-2 text-sm text-[#66737b]">The current agreement is always clear. Changes are always visible.</p></div><Button onClick={() => setComposerOpen(true)} className="pressable rounded-xl bg-[#1f5558] font-extrabold text-white hover:bg-[#18484b]"><Plus className="mr-1.5 h-4 w-4" />New promise</Button></div>
      <div className="mt-7 flex items-center gap-2 rounded-xl border bg-white px-3.5 py-2.5"><Search className="h-4 w-4 text-[#66737b]" /><Input value={filter} onChange={event => setFilter(event.target.value)} className="h-auto border-0 p-0 text-sm shadow-none focus-visible:ring-0" placeholder="Search promises or people" aria-label="Search promises or people" /></div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">{visiblePromises.map(item => <PromiseCard key={item.id} item={item} onOpen={() => setSelectedId(item.id)} onExport={() => exportPromiseToCalendar(item)} />)}</div>
      {!visiblePromises.length && <div className="mt-4"><EmptyState onCreate={() => setComposerOpen(true)} /></div>}
    </section>
  );

  const renderPeople = () => {
    const ownLedger = reliabilityQuery.data;
    const people = [
      { name: "Maya Chen", open: 2, completed: 8, renegotiated: 1, blocked: 0, tone: "clay" as const },
      { name: "Ren Ito", open: 1, completed: 5, renegotiated: 2, blocked: 0, tone: "teal" as const },
      { name: "Omar Vale", open: 1, completed: 4, renegotiated: 0, blocked: 1, tone: "moss" as const },
    ];
    return <section className="max-w-5xl"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#66737b]">Evidence, not evaluation</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em]">People & reliability</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#66737b]">A private history of shared commitments. PromiseOS never creates public rankings or a global trust score.</p></div>{isAuthenticated && <div className="mt-5 grid grid-cols-2 gap-3 rounded-[1.25rem] border border-[#d7e3df] bg-[#f0f6f4] p-4 sm:grid-cols-6"><div className="col-span-2 sm:col-span-1"><p className="text-xs font-extrabold text-[#1f5558]">Your private history</p><p className="mt-1 text-[11px] leading-5 text-[#587072]">Across commitments you can access.</p></div><div><p className="text-xl font-extrabold">{ownLedger?.open ?? 0}</p><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#66737b]">Open</p></div><div><p className="text-xl font-extrabold text-[#3f6b50]">{ownLedger?.completed ?? 0}</p><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#66737b]">Completed</p></div><div><p className="text-xl font-extrabold text-[#1f5558]">{ownLedger?.acknowledged ?? 0}</p><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#66737b]">Acknowledged</p></div><div><p className="text-xl font-extrabold text-[#7d493b]">{ownLedger?.renegotiated ?? 0}</p><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#66737b]">Renegotiated</p></div><div><p className="text-xl font-extrabold text-[#56546d]">{ownLedger?.blocked ?? 0}</p><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#66737b]">Blocked</p></div></div>}<div className="mt-7 flex items-center justify-between gap-3"><p className="rounded-full border border-[#dce5e2] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#587072]">Illustrative relationship cards · not public profiles</p>{!isAuthenticated && <button onClick={() => startLogin()} className="text-xs font-extrabold text-[#1f5558] hover:underline">Sign in to view your ledger</button>}</div><div className="mt-4 grid gap-4 md:grid-cols-3">{people.map(person => <article key={person.name} className="promise-card rounded-[1.25rem] border bg-white p-5 subtle-shadow"><div className="flex items-center gap-3"><Avatar name={person.name} tone={person.tone} /><div><h2 className="font-extrabold tracking-[-0.025em]">{person.name}</h2><p className="mt-0.5 text-xs text-[#66737b]">Example relationship ledger</p></div></div><div className="mt-5 grid grid-cols-2 gap-2"><div className="rounded-xl bg-[#f5f7f5] p-3"><p className="text-xl font-extrabold">{person.open}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#66737b]">Open</p></div><div className="rounded-xl bg-[#e8f0ea] p-3"><p className="text-xl font-extrabold text-[#3f6b50]">{person.completed}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#55715e]">Completed</p></div></div><div className="mt-4 space-y-2 text-xs"><p className="flex justify-between text-[#66737b]"><span>Renegotiated early</span><strong className="text-[#1e2a32]">{person.renegotiated}</strong></p><p className="flex justify-between text-[#66737b]"><span>Blocked by dependency</span><strong className="text-[#1e2a32]">{person.blocked}</strong></p></div><button className="mt-5 text-xs font-extrabold text-[#1f5558] hover:underline">View shared history</button></article>)}</div><div className="mt-6 rounded-[1.25rem] border border-[#d7e3df] bg-[#f0f6f4] p-5"><div className="flex gap-3"><CircleHelp className="mt-0.5 h-5 w-5 shrink-0 text-[#1f5558]" /><div><h2 className="font-extrabold">What the ledger means</h2><p className="mt-1.5 max-w-3xl text-sm leading-6 text-[#526a6b]">It summarizes observable events: completed commitments, responsible renegotiations, acknowledgments, blockers, and open work. A delay that is clearly communicated is not treated as the same thing as silence.</p></div></div></div></section>;
  };

  const renderSettings = () => {
    const preference = reminderPreferencesQuery.data;
    return (
      <section className="max-w-3xl">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#66737b]">Your attention, your choice</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.045em]">Settings</h1>
          <p className="mt-2 text-sm text-[#66737b]">Controls that keep PromiseOS useful without making it noisy.</p>
        </div>
        <div className="mt-7 space-y-4">
          <section className="rounded-[1.25rem] border bg-white p-5 subtle-shadow">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="font-extrabold">Reminder preferences</h2><p className="mt-1.5 text-sm leading-6 text-[#66737b]">Remind me for invitations, approaching dates, new plans, and completion acknowledgment.</p></div>
              <Bell className="h-5 w-5 text-[#1f5558]" />
            </div>
            <div className="mt-5 space-y-3">
              <label className="flex items-center justify-between rounded-xl bg-[#f6f7f5] px-4 py-3 text-sm font-bold">
                <span>One reminder before a due date</span>
                <input type="checkbox" checked={preference?.dueDateReminders ?? true} onChange={event => saveReminderPreference("dueDateReminders", event.target.checked)} className="h-4 w-4 accent-[#1f5558]" aria-label="One reminder before a due date" />
              </label>
              <label className="flex items-center justify-between rounded-xl bg-[#f6f7f5] px-4 py-3 text-sm font-bold">
                <span>Invitation and new-plan updates</span>
                <input type="checkbox" checked={preference?.invitationReminders ?? true} onChange={event => saveReminderPreference("invitationReminders", event.target.checked)} className="h-4 w-4 accent-[#1f5558]" aria-label="Invitation and new-plan updates" />
              </label>
              <label className="flex items-center justify-between rounded-xl bg-[#f6f7f5] px-4 py-3 text-sm font-bold">
                <span>Email summaries</span>
                <input type="checkbox" checked={preference?.emailSummaries ?? false} onChange={event => saveReminderPreference("emailSummaries", event.target.checked)} className="h-4 w-4 accent-[#1f5558]" aria-label="Email summaries" />
              </label>
            </div>
            {!isAuthenticated && <p className="mt-4 rounded-xl bg-[#f7edda] px-3 py-2.5 text-xs leading-5 text-[#7d5c28]">You are exploring a local preview. Sign in when you are ready to save preferences privately.</p>}
            <button onClick={requestBrowserNotifications} className="pressable mt-5 rounded-xl border border-[#b9cec8] px-3.5 py-2.5 text-sm font-extrabold text-[#1f5558] hover:bg-[#f6fbf8]">{noticeEnabled ? "Browser reminders enabled" : "Enable browser reminders"}</button>
            <p className="mt-3 text-xs leading-5 text-[#66737b]">Email delivery will activate when a sending provider is connected. This setting still records your preference in your private workspace.</p>
          </section>
          <section className="rounded-[1.25rem] border bg-white p-5 subtle-shadow">
            <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-[#1f5558]" /><div><h2 className="font-extrabold">Privacy defaults</h2><p className="mt-1.5 text-sm leading-6 text-[#66737b]">Promises remain private until you invite someone. Notes can be private or shared, and relationship histories are never searchable or public.</p><button className="mt-4 text-sm font-extrabold text-[#1f5558] hover:underline">Export my data</button></div></div>
          </section>
        </div>
      </section>
    );
  };

  return (
    <div className="app-shell bg-transparent">
      <div className="mx-auto flex min-h-screen max-w-[1560px]">
        <aside className="sticky top-0 hidden h-screen w-[236px] shrink-0 flex-col border-r border-[#dbe3e0] bg-white/65 px-4 py-5 backdrop-blur-xl lg:flex">
          <button onClick={() => navigate("/")} className="flex items-center gap-3 px-2 text-left"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1f5558] text-white shadow-[0_5px_12px_rgba(31,85,88,0.22)]"><Handshake className="h-[19px] w-[19px]" /></span><span><strong className="block text-[15px] font-extrabold tracking-[-0.04em]">PromiseOS</strong><span className="block text-[10px] font-bold tracking-[0.08em] text-[#7a898b]">A DIGITAL HANDSHAKE</span></span></button>
          <Button onClick={() => setComposerOpen(true)} className="pressable mt-8 h-11 rounded-xl bg-[#1f5558] text-sm font-extrabold text-white hover:bg-[#18484b]"><Plus className="mr-1.5 h-4 w-4" />New promise</Button>
          <nav className="mt-6 space-y-1" aria-label="Primary navigation">{navItems.map(item => { const active = activePage === item.label; return <button key={item.label} onClick={() => navigate(item.href)} className={`pressable flex h-10 w-full items-center gap-3 rounded-xl px-3 text-sm font-bold transition-colors ${active ? "bg-[#e5f0ee] text-[#1f5558]" : "text-[#66737b] hover:bg-[#f2f4f1] hover:text-[#2f464a]"}`}><item.icon className="h-[17px] w-[17px]" />{item.label}{item.label === "Today" && openPromises.length ? <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#1f5558]">{openPromises.length}</span> : null}</button>; })}</nav>
          <div className="mt-auto rounded-[1.2rem] border border-[#dce7e3] bg-[#f1f6f4] p-3.5"><div className="flex items-center gap-2 text-xs font-extrabold text-[#1f5558]"><ShieldCheck className="h-4 w-4" />Private by default</div><p className="mt-1.5 text-[11px] leading-5 text-[#587072]">Shared commitments are visible only to the people you invite.</p></div>
          <div className="mt-4 flex items-center gap-2 px-2"><Avatar name="Alex Morgan" tone="slate" /><div className="min-w-0"><p className="truncate text-xs font-extrabold">Alex Morgan</p><p className="truncate text-[10px] font-bold text-[#7a898b]">Personal workspace</p></div><MoreHorizontal className="ml-auto h-4 w-4 text-[#7a898b]" /></div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:py-7">
          <header className="mb-6 flex items-center justify-between gap-3 lg:mb-8">
            <div className="flex items-center gap-3 lg:hidden"><button onClick={() => setMobileOpen(true)} className="pressable grid h-10 w-10 place-items-center rounded-xl border bg-white text-[#1f5558]" aria-label="Open navigation"><Menu className="h-5 w-5" /></button><button onClick={() => navigate("/")} className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-[#1f5558] text-white"><Handshake className="h-4 w-4" /></span><strong className="text-sm tracking-[-0.03em]">PromiseOS</strong></button></div>
            <div className="hidden min-w-0 items-center gap-2 lg:flex"><span className="text-sm font-bold text-[#66737b]">{activePage}</span><ChevronRight className="h-4 w-4 text-[#a6b1b2]" /><span className="text-sm font-extrabold text-[#1e2a32]">Personal workspace</span></div>
            <div className="ml-auto flex items-center gap-2">{isAuthenticated ? <span className="hidden rounded-full border border-[#dce5e2] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#587072] sm:inline-flex">Synced as {user?.name?.split(" ")[0] || "you"}</span> : <button onClick={() => startLogin()} className="pressable hidden rounded-full border border-[#b9cec8] bg-white px-3 py-1.5 text-[11px] font-extrabold text-[#1f5558] hover:bg-[#f6fbf8] sm:inline-flex">Sign in to sync</button>}<button onClick={requestBrowserNotifications} className="pressable relative grid h-10 w-10 place-items-center rounded-xl border bg-white text-[#526a6b] hover:bg-[#fbfcfb]" aria-label="Manage reminders"><Bell className="h-4 w-4" />{!noticeEnabled && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#b96f5a]" />}</button><button onClick={() => setSelectedId(2)} className="pressable hidden h-10 items-center gap-2 rounded-xl border bg-white px-3 text-xs font-extrabold text-[#426164] hover:bg-[#fbfcfb] sm:flex"><Inbox className="h-4 w-4" />1 waiting</button></div>
          </header>

          {confirmationFeedback && <div className="confirmation-feedback mb-5 flex items-center gap-2 rounded-xl border border-[#c8ddcd] bg-[#e8f0ea] px-4 py-3 text-sm font-extrabold text-[#3f6b50]"><CheckCheck className="h-4 w-4" />You both have the same active plan.</div>}

          {activePage === "Today" && renderToday()}
          {activePage === "Promises" && renderPromises()}
          {activePage === "People" && renderPeople()}
          {activePage === "Settings" && renderSettings()}
        </main>

        {selected && <aside className="sticky top-0 hidden h-screen w-[365px] shrink-0 border-l border-[#dbe3e0] bg-white/70 p-5 backdrop-blur-xl 2xl:block"><div className="flex h-full flex-col"><div className="flex items-center justify-between"><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#66737b]">Promise detail</p><button onClick={() => setSelectedId(null)} className="pressable grid h-8 w-8 place-items-center rounded-lg text-[#66737b] hover:bg-[#f2f4f1]" aria-label="Close promise detail"><X className="h-4 w-4" /></button></div><div className="mt-5"><StatusPill status={selected.status} /><h2 className="mt-3 text-xl font-extrabold tracking-[-0.04em] leading-7">{selected.title}</h2><p className="mt-2 text-sm leading-6 text-[#66737b]">{selected.context}</p></div><div className="mt-5 rounded-xl bg-[#f6f7f5] p-3.5"><div className="flex items-center gap-2"><Avatar name={selected.promisor} tone="teal" /><ChevronRight className="h-3.5 w-3.5 text-[#a0adaa]" /><Avatar name={selected.recipient} tone="clay" /><span className="ml-1 text-xs font-extrabold text-[#526a6b]">{selected.promisor} → {selected.recipient}</span></div><p className="mt-3 border-t border-[#e5e9e6] pt-3 text-xs font-bold text-[#526a6b]"><Clock3 className="mr-1.5 inline h-3.5 w-3.5" />{selected.dueLabel}</p></div>{selected.status === "renegotiation proposed" ? <div className="mt-5"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-[#7d493b]">Your decision</p><div className="mt-3 grid grid-cols-2 gap-2"><Button onClick={() => respondToInvitation("accepted")} className="pressable rounded-xl bg-[#1f5558] text-xs font-extrabold text-white hover:bg-[#18484b]"><Check className="mr-1 h-3.5 w-3.5" />Accept plan</Button><Button onClick={() => respondToInvitation("counterproposed")} variant="outline" className="pressable rounded-xl border-[#d8c0b8] text-xs font-extrabold text-[#7d493b] hover:bg-[#fbf5f2]">Suggest time</Button><button onClick={() => respondToInvitation("clarified")} className="pressable col-span-2 rounded-xl border px-3 py-2.5 text-xs font-extrabold text-[#526a6b] hover:bg-[#f7f9f7]"><CircleHelp className="mr-1 inline h-3.5 w-3.5" />Ask for clarity</button></div></div> : <div className="mt-5 flex gap-2"><Button onClick={() => { updatePromise(selected.id, { status: "complete" }, { label: "Marked complete", by: "You", at: "Just now", tone: "moss" }); toast.success("Completion shared for acknowledgment."); }} className="pressable flex-1 rounded-xl bg-[#1f5558] text-xs font-extrabold text-white hover:bg-[#18484b]"><CheckCheck className="mr-1 h-3.5 w-3.5" />Mark complete</Button><Button onClick={() => { updatePromise(selected.id, { status: "blocked" }, { label: "Marked blocked", by: "You", at: "Just now", detail: "Waiting on a dependency.", tone: "slate" }); toast.message("The blocker is visible to everyone involved."); }} variant="outline" className="pressable rounded-xl text-xs font-extrabold text-[#526a6b]">Mark blocked</Button></div>}<div className="mt-6 min-h-0 flex-1 overflow-auto pr-1"><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#66737b]">Shared timeline</p><ol className="mt-4 space-y-4 border-l border-[#dde5e2] pl-4">{selected.events.map(event => <li key={event.id} className="relative"><span className={`absolute -left-[21px] top-1.5 h-2 w-2 rounded-full ${event.tone === "moss" ? "bg-[#4e765f]" : event.tone === "clay" ? "bg-[#b96f5a]" : event.tone === "amber" ? "bg-[#a96f26]" : event.tone === "slate" ? "bg-[#625f7a]" : "bg-[#1f5558]"}`} /><p className="text-xs font-extrabold">{event.label}</p><p className="mt-0.5 text-[11px] font-bold text-[#718083]">{event.by} · {event.at}</p>{event.detail && <p className="mt-1.5 text-xs leading-5 text-[#526a6b]">{event.detail}</p>}</li>)}</ol></div><button onClick={() => updatePromise(selected.id, { status: "disputed" }, { label: "Marked disputed", by: "You", at: "Just now", detail: "The two sides remember the completion differently.", tone: "clay" })} className="pressable mt-4 text-left text-[11px] font-extrabold text-[#8b5a4a] hover:underline">Need to dispute or clarify this promise?</button></div></aside>}
      </div>

      {selected && <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[#dce3e0] bg-white/95 px-4 py-3 backdrop-blur 2xl:hidden"><button onClick={() => setSelectedId(null)} className="flex w-full items-center justify-between rounded-xl bg-[#f4f6f4] px-4 py-3 text-left"><span><span className="block text-xs font-extrabold">{selected.title}</span><span className="mt-0.5 block text-[11px] font-bold text-[#66737b]">{selected.status} · {selected.dueLabel}</span></span><PanelRight className="h-4 w-4 text-[#1f5558]" /></button></div>}

      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-[#dbe3e0] bg-white/95 px-2 py-2 backdrop-blur lg:hidden" aria-label="Mobile navigation">{navItems.slice(0, 4).map(item => { const active = activePage === item.label; return <button key={item.label} onClick={() => navigate(item.href)} className={`pressable flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-extrabold ${active ? "text-[#1f5558]" : "text-[#7a898b]"}`}><item.icon className="h-[18px] w-[18px]" />{item.label}</button>; })}</nav>

      {mobileOpen && <div className="fixed inset-0 z-50 bg-[#1e2a32]/30 backdrop-blur-[2px] lg:hidden"><div className="h-full w-[min(86vw,320px)] bg-[#fbfcfa] p-5 soft-shadow"><div className="flex items-center justify-between"><button onClick={() => navigate("/")} className="flex items-center gap-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1f5558] text-white"><Handshake className="h-[19px] w-[19px]" /></span><strong className="tracking-[-0.04em]">PromiseOS</strong></button><button onClick={() => setMobileOpen(false)} className="pressable grid h-9 w-9 place-items-center rounded-xl border bg-white" aria-label="Close navigation"><X className="h-4 w-4" /></button></div><Button onClick={() => { setMobileOpen(false); setComposerOpen(true); }} className="pressable mt-8 h-11 w-full rounded-xl bg-[#1f5558] font-extrabold text-white"><Plus className="mr-1.5 h-4 w-4" />New promise</Button><nav className="mt-6 space-y-1">{navItems.map(item => { const active = activePage === item.label; return <button key={item.label} onClick={() => navigate(item.href)} className={`flex h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-extrabold ${active ? "bg-[#e5f0ee] text-[#1f5558]" : "text-[#66737b]"}`}><item.icon className="h-4 w-4" />{item.label}</button>; })}</nav></div></div>}

      {composerOpen && <div className="fixed inset-0 z-50 grid place-items-end bg-[#1e2a32]/30 p-0 backdrop-blur-[2px] sm:place-items-center sm:p-6"><form onSubmit={handleCreate} className="w-full max-w-[620px] rounded-t-[1.4rem] bg-[#fbfcfa] p-5 shadow-2xl sm:rounded-[1.4rem] sm:p-7"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-extrabold uppercase tracking-[0.14em] text-[#66737b]">A clear starting point</p><h2 className="mt-1 text-2xl font-extrabold tracking-[-0.04em]">Create a shared promise</h2><p className="mt-2 text-sm leading-6 text-[#66737b]">Write it in human language first. The other person can still accept, edit, decline, or ask a question.</p></div><button type="button" onClick={() => setComposerOpen(false)} className="pressable grid h-9 w-9 place-items-center rounded-xl border bg-white text-[#66737b]" aria-label="Close promise creator"><X className="h-4 w-4" /></button></div><div className="mt-6 grid gap-4"><div><Label htmlFor="promise-title" className="text-xs font-extrabold text-[#405357]">What are you promising?</Label><Input id="promise-title" name="title" className="mt-2 h-11 rounded-xl border-[#d6dfdb] bg-white px-3.5" placeholder="Send the revised budget outline" required /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="promise-person" className="text-xs font-extrabold text-[#405357]">Who is involved?</Label><Input id="promise-person" name="person" className="mt-2 h-11 rounded-xl border-[#d6dfdb] bg-white px-3.5" placeholder="Maya Chen" required /></div><div><Label htmlFor="promise-due" className="text-xs font-extrabold text-[#405357]">When is it due?</Label><Input id="promise-due" name="due" type="date" className="mt-2 h-11 rounded-xl border-[#d6dfdb] bg-white px-3.5" /></div></div>{isAuthenticated && <div><Label htmlFor="promise-email" className="text-xs font-extrabold text-[#405357]">Invite by email <span className="font-medium text-[#819093]">(optional)</span></Label><Input id="promise-email" name="recipientEmail" type="email" className="mt-2 h-11 rounded-xl border-[#d6dfdb] bg-white px-3.5" placeholder="maya@example.com" /><p className="mt-1.5 text-[11px] leading-5 text-[#66737b]">The invitation records a pending shared agreement. Delivery will activate when email sending is connected.</p></div>}<div><Label htmlFor="promise-completion" className="text-xs font-extrabold text-[#405357]">What counts as complete?</Label><Textarea id="promise-completion" name="completion" className="mt-2 min-h-20 rounded-xl border-[#d6dfdb] bg-white px-3.5 py-3" placeholder="The proposal link is shared and accessible." /></div><div><Label htmlFor="promise-context" className="text-xs font-extrabold text-[#405357]">Context <span className="font-medium text-[#819093]">(optional)</span></Label><Textarea id="promise-context" name="context" className="mt-2 min-h-16 rounded-xl border-[#d6dfdb] bg-white px-3.5 py-3" placeholder="Why this agreement matters or what it relates to." /></div></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={() => setComposerOpen(false)} className="pressable rounded-xl font-extrabold text-[#66737b]">Cancel</Button><Button type="submit" disabled={createPromiseMutation.isPending} className="pressable rounded-xl bg-[#1f5558] px-5 font-extrabold text-white hover:bg-[#18484b]"><Send className="mr-1.5 h-4 w-4" />{createPromiseMutation.isPending ? "Saving promise" : "Send for confirmation"}</Button></div></form></div>}
    </div>
  );
}
