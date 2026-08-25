import { Handshake, Home, Settings, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startLogin } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { ReactNode } from "react";
import { Link, useLocation } from "wouter";

const items = [
  { label: "Today", href: "/", icon: Home },
  { label: "Promises", href: "/promises", icon: Handshake },
  { label: "People", href: "/people", icon: UsersRound },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { isAuthenticated } = useAuth();
  return <div className="min-h-screen bg-[#f7f7f4] text-[#1e2a32]"><div className="mx-auto flex min-h-screen max-w-[1440px]"><aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-[#dce3e0] bg-white/65 px-4 py-5 backdrop-blur-xl lg:flex"><div className="flex items-center justify-between gap-2"><Link href="/" className="flex items-center gap-3 px-2"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1f5558] text-white"><Handshake className="h-5 w-5" /></span><span><strong className="block text-[15px] tracking-[-0.04em]">PromiseOS</strong><span className="block text-[10px] font-bold tracking-[0.09em] text-[#7a898b]">A DIGITAL HANDSHAKE</span></span></Link>{!isAuthenticated && <Button onClick={() => startLogin()} variant="outline" size="sm" className="rounded-lg text-[11px]">Sign in</Button>}</div><nav className="mt-8 space-y-1">{items.map(item => { const active = location === item.href || (item.href === "/promises" && location.startsWith("/promises/")); return <Link key={item.href} href={item.href} className={`flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-bold ${active ? "bg-[#e5f0ee] text-[#1f5558]" : "text-[#66737b] hover:bg-[#f2f4f1]"}`}><item.icon className="h-4 w-4" />{item.label}</Link>; })}</nav><div className="mt-auto rounded-[1.2rem] border border-[#dce7e3] bg-[#f1f6f4] p-3.5"><p className="text-xs font-extrabold text-[#1f5558]">Private by default</p><p className="mt-1 text-[11px] leading-5 text-[#587072]">Shared commitments are visible only to people you invite.</p></div></aside><main className="min-w-0 flex-1 px-4 pb-24 pt-5 sm:px-7 lg:px-10 lg:py-8"><div className="mb-4 flex justify-end lg:hidden">{!isAuthenticated && <Button onClick={() => startLogin()} variant="outline" size="sm" className="rounded-lg text-[11px]">Sign in</Button>}</div>{children}</main></div><nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[#dce3e0] bg-white/95 px-2 py-2 backdrop-blur lg:hidden">{items.map(item => { const active = location === item.href || (item.href === "/promises" && location.startsWith("/promises/")); return <Link key={item.href} href={item.href} className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[10px] font-extrabold ${active ? "text-[#1f5558]" : "text-[#7a898b]"}`}><item.icon className="h-[18px] w-[18px]" />{item.label}</Link>; })}</nav></div>;
}
