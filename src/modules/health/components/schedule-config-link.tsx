"use client";

import { useState } from "react";
import { EditScheduleModal } from "./edit-schedule-modal";
import type { HealthProfessionalProfile } from "../types";

type ScheduleConfigLinkProps = {
  professional: HealthProfessionalProfile;
  disabled?: boolean;
};

export function ScheduleConfigLink({
  professional,
  disabled = false,
}: ScheduleConfigLinkProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        disabled={disabled}
        className="text-xs font-bold uppercase tracking-wider text-[#f4a7e8] underline decoration-[#d73cbe]/50 underline-offset-4 transition hover:text-white disabled:cursor-not-allowed disabled:text-slate-500 disabled:no-underline"
      >
        Ver config.
      </button>
      <EditScheduleModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        professional={professional}
      />
    </>
  );
}
