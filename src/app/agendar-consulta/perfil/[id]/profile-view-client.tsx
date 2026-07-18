"use client";

import { useState } from "react";
import { Edit3 } from "lucide-react";
import { EditProProfileModal } from "@/modules/health/components/edit-pro-profile-modal";
import type { HealthProfessionalProfile } from "@/modules/health/types";

export function ProfileViewClient({
  proData,
}: {
  proData: HealthProfessionalProfile;
}) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsEditModalOpen(true)}
        className="flex items-center gap-2 px-5 py-2.5 bg-[#d73cbe]/10 text-[#d73cbe] border border-[#d73cbe]/20 rounded-xl text-sm font-bold hover:bg-[#d73cbe] hover:text-white transition-all cursor-pointer shadow-lg"
      >
        <Edit3 className="w-4 h-4" /> Editar Perfil
      </button>

      <EditProProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={proData}
      />
    </>
  );
}
