import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { FormEvent } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function CaptureForm() {
  const { isAuthenticated } = useAuth();
  const create = trpc.promise.create.useMutation();
  const [, setLocation] = useLocation();
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isAuthenticated) { toast.message("Sign in to save a shared promise privately."); startLogin(); return; }
    const values = new FormData(event.currentTarget);
    create.mutate({ title: String(values.get("title") || ""), recipientEmail: String(values.get("email") || "") || undefined, dueAt: values.get("due") ? new Date(`${String(values.get("due"))}T12:00:00`) : undefined, completionCondition: String(values.get("completion") || "") || undefined, context: String(values.get("context") || "") || undefined }, { onSuccess: () => { toast.success("Promise created and ready for confirmation."); setLocation("/promises"); }, onError: () => toast.error("The promise could not be created.") });
  };
  return <section className="mx-auto max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[.14em] text-[#66737b]">Clear from the start</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.045em]">Create a promise</h1><p className="mt-2 text-sm leading-6 text-[#66737b]">State the work, the person involved, and what completion looks like before memory changes shape.</p><form onSubmit={submit} className="mt-7 rounded-[1.25rem] border bg-white p-5 shadow-[0_12px_28px_rgba(30,42,50,.06)] sm:p-7"><div className="space-y-4"><div><Label htmlFor="title">What are you promising?</Label><Input id="title" name="title" className="mt-2 h-11 rounded-xl" placeholder="Send the revised proposal" required /></div><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="email">Recipient email</Label><Input id="email" name="email" type="email" className="mt-2 h-11 rounded-xl" placeholder="maya@example.com" /></div><div><Label htmlFor="due">Due date</Label><Input id="due" name="due" type="date" className="mt-2 h-11 rounded-xl" /></div></div><div><Label htmlFor="completion">What counts as complete?</Label><Textarea id="completion" name="completion" className="mt-2 min-h-20 rounded-xl" placeholder="The final shareable link is sent." /></div><div><Label htmlFor="context">Context (optional)</Label><Textarea id="context" name="context" className="mt-2 min-h-16 rounded-xl" placeholder="Why this agreement matters." /></div></div><div className="mt-6 flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setLocation("/")} className="rounded-xl">Cancel</Button><Button type="submit" disabled={create.isPending} className="rounded-xl bg-[#1f5558] text-white hover:bg-[#18484b]">{create.isPending ? "Creating…" : "Send for confirmation"}</Button></div></form></section>;
}
