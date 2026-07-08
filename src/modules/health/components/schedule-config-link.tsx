"use client";

type ScheduleConfigLinkProps = {
  disabled?: boolean;
};

export const OPEN_HEALTH_SCHEDULE_MODAL = "open-health-schedule-modal";

export function ScheduleConfigLink({ disabled = false }: ScheduleConfigLinkProps) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_HEALTH_SCHEDULE_MODAL))}
      disabled={disabled}
      className="text-xs font-bold uppercase tracking-wider text-[#f4a7e8] underline decoration-[#d73cbe]/50 underline-offset-4 transition hover:text-white disabled:cursor-not-allowed disabled:text-slate-500 disabled:no-underline"
    >
      Ver config.
    </button>
  );
}
