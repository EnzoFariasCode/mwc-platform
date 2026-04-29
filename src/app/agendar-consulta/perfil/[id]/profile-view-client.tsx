"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Edit3 } from "lucide-react";
import { EditProProfileModal } from "@/modules/health/components/edit-pro-profile-modal";

export function ProfileViewClient({
  proId,
  proData,
}: {
  proId: string;
  proData: any;
}) {
  const { data: session } = useSession();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Verifica se o ID do usuário logado é igual ao ID da página do perfil
  const isOwner = (session?.user as any)?.id === proId;

  // Se não for o dono, não renderiza o botão nem o modal
  if (!isOwner) return null;

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
