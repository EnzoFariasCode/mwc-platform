"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { EditProfileModal } from "@/modules/health/components/edit-profile-modal";
import { ProfileInitialsAvatar } from "@/modules/health/components/profile-initials-avatar";
import {
  getCurrentPatientProfile,
  type PatientProfileData,
} from "@/modules/users/actions/update-patient-profile";
import { Camera, Edit3, MessageSquare } from "lucide-react";
import { toast } from "sonner";

function formatPhoneNumber(value?: string | null) {
  const digits = value?.replace(/\D/g, "").slice(0, 11) ?? "";

  if (digits.length !== 11) return value || "";

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function MeuPerfilPage() {
  const { data: session } = useSession();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [profile, setProfile] = useState<PatientProfileData | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const userId = session?.user?.id;

  const imageUrl =
    previewImage || (userId ? `/api/images/user/${userId}` : null);

  // Carrega os dados reais do banco
  const loadProfile = async () => {
    const result = await getCurrentPatientProfile();
    if (result.data) {
      setProfile(result.data as PatientProfileData);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // Logica de exibicao de dados (Mapeando o que vem do Banco)
  const profileName =
    profile?.displayName ||
    profile?.name ||
    session?.user?.name ||
    "Usu\u00e1rio";
  const profileEmail =
    profile?.email || session?.user?.email || "N\u00e3o informado";

  const birthDateFormatted = profile?.birthDate
    ? new Date(`${profile.birthDate}T00:00:00`).toLocaleDateString("pt-BR")
    : "N\u00e3o informado";

  const cityState =
    profile?.city || profile?.state
      ? `${profile?.city || "Cidade n\u00e3o informada"} / ${
          profile?.state || "UF"
        }`
      : "N\u00e3o informado";

  // Mapeamento de genero para ficar amigavel
  const genderMap: Record<string, string> = { M: "Masculino", F: "Feminino" };
  const genderDisplay = profile?.gender
    ? genderMap[profile.gender] || "N\u00e3o informado"
    : "N\u00e3o informado";
  const phoneDisplay = formatPhoneNumber(profile?.phone);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Por favor, escolha uma imagem menor que 2MB.");
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewImage(localUrl);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/images/user/${userId}`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Falha no upload");
      toast.success("Imagem salva com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro ao salvar a imagem.");
      setPreviewImage(null);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[#020617] text-white font-poppins pb-24 pt-8">
        <div className="container mx-auto max-w-4xl px-4">
          <div className="mb-10 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-futura font-bold uppercase tracking-tight">
                Meu <span className="text-[#d73cbe]">Perfil</span>
              </h1>
              <p className="text-slate-400 font-light">
                Gerencie suas informa&ccedil;&otilde;es e autoriza&ccedil;&otilde;es de contato.
              </p>
            </div>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#d73cbe]/10 text-[#d73cbe] border border-[#d73cbe]/20 rounded-xl text-sm font-bold hover:bg-[#d73cbe] hover:text-white transition-all cursor-pointer"
            >
              <Edit3 className="w-4 h-4" /> Editar Perfil
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* LADO ESQUERDO */}
            <div className="space-y-6">
              <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d73cbe]/5 rounded-full blur-3xl pointer-events-none" />

                <div className="relative w-28 h-28 mb-4 group">
                  <ProfileInitialsAvatar
                    name={profileName}
                    src={imageUrl}
                    className={`relative w-full h-full rounded-full bg-[#020617] border-2 border-white/10 shadow-2xl overflow-hidden transition-opacity ${
                      isUploading ? "opacity-50" : "opacity-100"
                    }`}
                    textClassName="text-4xl"
                  />

                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-1 right-1 w-9 h-9 bg-[#d73cbe] rounded-full flex items-center justify-center border-4 border-[#0f172a] hover:scale-110 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>

                <h2 className="text-xl font-bold">{profileName}</h2>
                <span className="mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
                  Paciente Ativo
                </span>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-emerald-500 mb-3">
                  <MessageSquare className="w-5 h-5" />
                  <h4 className="font-bold text-sm">WhatsApp Ativo</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {phoneDisplay
                    ? `Notifica\u00e7\u00f5es autorizadas para o n\u00famero: ${phoneDisplay}`
                    : "Voc\u00ea ainda n\u00e3o cadastrou um n\u00famero para notifica\u00e7\u00f5es."}
                </p>
              </div>
            </div>

            {/* LADO DIREITO: DADOS DETALHADOS */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">
                  Informa&ccedil;&otilde;es Gerais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      E-mail
                    </span>
                    <p className="text-sm font-medium">{profileEmail}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      Data de Nascimento
                    </span>
                    <p className="text-sm font-medium">{birthDateFormatted}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      WhatsApp Principal
                    </span>
                    <p className="text-sm font-medium">
                      {phoneDisplay || "N\u00e3o cadastrado"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      Sexo Biol&oacute;gico
                    </span>
                    <p className="text-sm font-medium">{genderDisplay}</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">
                  Endere&ccedil;o Residencial
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        CEP
                      </span>
                      <p className="text-sm font-medium">
                        {profile?.cep || "N\u00e3o informado"}
                      </p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Cidade / UF
                      </span>
                      <p className="text-sm font-medium">{cityState}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      Logradouro
                    </span>
                    <p className="text-sm font-medium">
                      {profile?.address
                        ? `${profile.address}, ${profile.addressNumber || "S/N"}`
                        : "N\u00e3o informado"}
                      {profile?.complement && ` - ${profile.complement}`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      Bairro
                    </span>
                    <p className="text-sm font-medium">
                      {profile?.neighborhood || "N\u00e3o informado"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={profile}
        onSaved={loadProfile}
      />
    </>
  );
}
