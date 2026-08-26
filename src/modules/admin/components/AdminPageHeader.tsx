import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

const tones = {
  brand: "border-[#d73cbe]/20 bg-[#d73cbe]/10 text-[#ec8ddd]",
  danger: "border-red-500/20 bg-red-500/10 text-red-300",
  success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  warning: "border-amber-500/20 bg-amber-500/10 text-amber-300",
} as const;

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
  tone = "brand",
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <div
          className={`mb-3 inline-flex max-w-full items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${tones[tone]}`}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere]">{eyebrow}</span>
        </div>
        <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
          {description}
        </p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </header>
  );
}
