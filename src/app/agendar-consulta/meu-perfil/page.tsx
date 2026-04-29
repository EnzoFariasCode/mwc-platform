"use client";

import { useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { EditProfileModal } from "@/modules/health/components/edit-profile-modal";
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Edit3,
  MessageSquare,
} from "lucide-react";

export default function MeuPerfilPage() {
  const { data: session } = useSession();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Estados para gerenciar a imagem
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Pega o ID do usuário da sessão
  const userId = (session?.user as any)?.id;

  // A URL final da imagem: Mostra o preview local se ele acabou de escolher uma,
  // senão puxa da sua API usando o ID da sessão.
  const imageUrl =
    previewImage || (userId ? `/api/images/user/${userId}` : null);

  // Iniciais para caso não tenha foto
  const initials = session?.user?.name
    ? session.user.name.substring(0, 2).toUpperCase()
    : "US";

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Checagem de tamanho da pic
    if (file.size > 2 * 1024 * 1024) {
      alert("Por favor, escolha uma imagem menor que 2MB.");
      return;
    }

    // 1. Preview imediato (Visual)
    const localUrl = URL.createObjectURL(file);
    setPreviewImage(localUrl);

    // 2. Persistência real (Servidor)
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/images/user/${userId}`, {
        method: "POST", // Agora a rota acima vai responder a isso
        body: formData,
      });

      if (!response.ok) throw new Error("Falha no upload");

      console.log("Imagem salva com sucesso no Prisma!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar a imagem. Tente novamente.");
      setPreviewImage(null); // Remove o preview em caso de erro
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
                Gerencie suas informações e autorizações de contato.
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
            {/* LADO ESQUERDO: AVATAR E STATUS */}
            <div className="space-y-6">
              <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-8 flex flex-col items-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#d73cbe]/5 rounded-full blur-3xl pointer-events-none" />

                {/* COMPONENTE DE AVATAR INTERATIVO */}
                <div className="relative w-28 h-28 mb-4 group">
                  <div className="w-full h-full rounded-full bg-[#020617] border-2 border-white/10 flex items-center justify-center text-4xl font-bold shadow-2xl overflow-hidden relative">
                    {imageUrl ? (
                      <Image
                        src={imageUrl}
                        alt="Perfil"
                        fill
                        className={`object-cover transition-opacity ${isUploading ? "opacity-50" : "opacity-100"}`}
                        unoptimized // Importante para rotas de API locais
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  {/* Input de arquivo invisível */}
                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />

                  {/* Botão Câmera (Aciona o input invisível) */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="absolute bottom-1 right-1 w-9 h-9 bg-[#d73cbe] rounded-full flex items-center justify-center border-4 border-[#0f172a] hover:scale-110 transition-all cursor-pointer disabled:opacity-50 disabled:hover:scale-100"
                  >
                    <Camera className="w-4 h-4 text-white" />
                  </button>
                </div>

                <h2 className="text-xl font-bold">
                  {session?.user?.name || "Daniel Sodré"}
                </h2>
                <span className="mt-2 px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-emerald-500/20">
                  Paciente Ativo
                </span>
              </div>

              <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-6">
                <div className="flex items-center gap-3 text-emerald-500 mb-3">
                  <MessageSquare className="w-5 h-5" />
                  <h4 className="font-bold text-sm">WhatsApp Autorizado</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Você receberá lembretes de consultas e notificações
                  importantes no número **(11) 94839-9097**.
                </p>
              </div>
            </div>

            {/* LADO DIREITO: DADOS DETALHADOS (MANTIDO) */}
            <div className="lg:col-span-2 space-y-6">
              {/* DADOS PESSOAIS */}
              <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">
                  Informações Gerais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      E-mail
                    </span>
                    <p className="text-sm font-medium">
                      {session?.user?.email || "daniel@email.com"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      Data de Nascimento
                    </span>
                    <p className="text-sm font-medium">15/08/1990</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      WhatsApp Principal
                    </span>
                    <p className="text-sm font-medium">(11) 98765-4321</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      Sexo Biológico
                    </span>
                    <p className="text-sm font-medium">Masculino</p>
                  </div>
                </div>
              </div>

              {/* ENDEREÇO */}
              <div className="bg-[#0f172a]/60 backdrop-blur-md border border-white/10 rounded-2xl p-8">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">
                  Endereço de Faturamento
                </h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        CEP
                      </span>
                      <p className="text-sm font-medium">04855-250</p>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">
                        Cidade / UF
                      </span>
                      <p className="text-sm font-medium">SÃO PAULO / SP</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      Logradouro
                    </span>
                    <p className="text-sm font-medium">
                      R TENENTE ODILON RAPOSO, 56
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase font-bold">
                      Bairro
                    </span>
                    <p className="text-sm font-medium">JARDIM BELCITO</p>
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
      />
    </>
  );
}
