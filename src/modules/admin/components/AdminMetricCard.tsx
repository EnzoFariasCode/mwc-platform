import type { LucideIcon } from "lucide-react";

const tones = {
  brand: "bg-[#d73cbe]/10 text-[#ec8ddd]",
  neutral: "bg-slate-800 text-slate-300",
  success: "bg-emerald-500/10 text-emerald-300",
  warning: "bg-amber-500/10 text-amber-300",
  danger: "bg-red-500/10 text-red-300",
} as const;

export function AdminMetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "brand",
}: {
  label: string;
  value: number | string;
  detail?: string;
  icon?: LucideIcon;
  tone?: keyof typeof tones;
}) {
  const isTextValue = typeof value === "string" && value.length > 8;

  return (
    <article className="min-w-0 rounded-xl border border-white/[0.08] bg-slate-900/70 px-4 py-3.5 shadow-sm shadow-black/10">
      <div className="flex min-w-0 items-start gap-3">
        {Icon ? (
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}
          >
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-400">{label}</p>
          <p
            className={`mt-1 max-w-full font-semibold leading-tight text-white [overflow-wrap:anywhere] ${
              isTextValue ? "text-base sm:text-lg" : "text-xl sm:text-2xl"
            }`}
          >
            {value}
          </p>
          {detail ? (
            <p className="mt-1.5 break-words text-[11px] leading-4 text-slate-500">
              {detail}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}
