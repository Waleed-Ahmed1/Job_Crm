"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, FileText, LayoutDashboard, Mail, MailCheck, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/email", label: "Email", icon: Mail },
  { href: "/sent", label: "Email tracker", icon: MailCheck },
  { href: "/cv", label: "My CVs", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings }
];
export function Sidebar() {
  const pathname = usePathname();
  return <aside className="border-b bg-[#13271c] text-white lg:fixed lg:inset-y-0 lg:w-64 lg:border-b-0 lg:border-r"><div className="flex h-16 items-center gap-3 px-5 lg:h-20"><div className="grid size-9 place-items-center rounded-xl bg-[#d4f0df] text-[#145c3a]"><Compass className="size-5" /></div><div><div className="font-semibold tracking-tight">Northstar</div><div className="text-xs text-white/55">Email workspace</div></div></div><nav aria-label="Primary" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:px-4 lg:py-4">{links.map(({ href, label, icon: Icon }) => {
    const active = pathname === href || pathname.startsWith(`${href}/`);
    return <Link key={href} href={href} className={cn("flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/65 hover:bg-white/10 hover:text-white", active && "bg-white/12 text-white")}><Icon className="size-4" /><span>{label}</span></Link>;
  })}</nav></aside>;
}
