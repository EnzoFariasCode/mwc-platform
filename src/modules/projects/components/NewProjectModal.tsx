"use client";

import {
  X,
  Upload,
  Clock,
  Plus,
  Link as LinkIcon,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { useRef, useState, KeyboardEvent } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { createProject } from "@/modules/projects/actions/create-project";

const PROJECT_TITLE_MIN = 8;
const PROJECT_DESCRIPTION_MIN = 10;
const PROJECT_DESCRIPTION_MAX = 5000;
const PROJECT_BUDGET_MIN = 10;

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function NewProjectModal({
  isOpen,
  onClose,
  onCreated,
}: NewProjectModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [budgetType, setBudgetType] = useState<"fixed" | "hourly">("fixed");
  const [budgetValue, setBudgetValue] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreated, setIsCreated] = useState(false);
  const [deadline, setDeadline] = useState("Urgente (em até 24h)");

  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");

  // --- NOVOS ESTADOS PARA ANEXOS ---
  const [attachments, setAttachments] = useState<string[]>([]);
  const [currentLink, setCurrentLink] = useState("");

  useGSAP(() => {
    if (isOpen) {
      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
        display: "flex",
      });
      gsap.fromTo(
        modalRef.current,
        { y: 50, opacity: 0, scale: 0.95 },
        { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.2)" }
      );
    } else {
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        display: "none",
      });
    }
  }, [isOpen]);

  const handleAddTag = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const tag = currentTag.trim();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      setTags([...tags, tag]);
      setCurrentTag("");
    }
  };

  const handleKeyDownTag = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // --- LÓGICA DE ANEXOS ---
  const parseBudgetValue = (value: string) => {
    const compactValue = value.trim().replace(/\s/g, "");
    const normalizedValue = compactValue.includes(",")
      ? compactValue.replace(/\./g, "").replace(",", ".")
      : compactValue;

    return Number(normalizedValue);
  };

  const isValidHttpUrl = (value: string) => {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:";
    } catch {
      return false;
    }
  };

  const handleAddLink = () => {
    const link = currentLink.trim();

    if (link) {
      if (!isValidHttpUrl(link)) {
        setFormError("Informe um link valido, com http:// ou https://.");
        return;
      }

      setAttachments([...attachments, link]);
      setCurrentLink("");
      setFormError("");
    }
  };

  const handleRemoveLink = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleClose = () => {
    const shouldRefresh = isCreated;
    setIsCreated(false);
    onClose();
    if (shouldRefresh) {
      onCreated?.();
    }
  };

  const handleSubmit = async () => {
    const normalizedTitle = title.trim();
    const normalizedCategory = category.trim();
    const normalizedDescription = description.trim();
    const normalizedDeadline = deadline.trim();
    const numericBudgetValue = parseBudgetValue(budgetValue);

    setFormError("");

    if (
      !normalizedTitle ||
      !normalizedCategory ||
      !normalizedDescription ||
      !budgetValue.trim()
    ) {
      setFormError("Preencha todos os campos obrigatorios.");
      return;
    }

    if (normalizedTitle.length < PROJECT_TITLE_MIN) {
      setFormError(
        `Informe um nome de projeto com pelo menos ${PROJECT_TITLE_MIN} caracteres.`,
      );
      return;
    }

    if (
      normalizedDescription.length < PROJECT_DESCRIPTION_MIN ||
      normalizedDescription.length > PROJECT_DESCRIPTION_MAX
    ) {
      setFormError(
        `Informe uma descricao com pelo menos ${PROJECT_DESCRIPTION_MIN} caracteres.`,
      );
      return;
    }

    if (
      !Number.isFinite(numericBudgetValue) ||
      numericBudgetValue < PROJECT_BUDGET_MIN
    ) {
      setFormError(
        `Informe um orcamento valido a partir de R$ ${PROJECT_BUDGET_MIN},00.`,
      );
      return;
    }

    setIsLoading(true);

    try {
      const response = await createProject({
        title: normalizedTitle,
        category: normalizedCategory,
        description: normalizedDescription,
        tags,
        budgetType,
        budgetValue: numericBudgetValue,
        deadline: normalizedDeadline,
        attachments, // Envia os links
      });

      if (response.success) {
        setTitle("");
        setCategory("");
        setDescription("");
        setBudgetType("fixed");
        setBudgetValue("");
        setDeadline("Urgente (em até 24h)");
        setTags([]);
        setCurrentTag("");
        setAttachments([]);
        setCurrentLink("");
        setFormError("");
        setIsCreated(true);
      } else {
        setFormError(response.error || "Nao foi possivel publicar o projeto.");
      }
    } catch {
      setFormError("Erro ao enviar projeto.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] bg-slate-950/80 backdrop-blur-sm hidden items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]"
      >
        {isCreated ? (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white p-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-9 w-9" />
            </div>
            <h2 className="font-futura text-2xl font-bold text-slate-900">
              Projeto publicado com sucesso
            </h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
              Seu pedido ja esta disponivel para profissionais enviarem
              propostas. Voce pode acompanhar tudo em Meus pedidos.
            </p>
            <div className="mt-7 flex w-full max-w-sm flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50"
              >
                Fechar
              </button>
              <Link
                href="/dashboard/meus-projetos"
                onClick={handleClose}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#d73cbe] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-purple-200 transition-colors hover:bg-[#b0269a]"
              >
                Ir para Meus pedidos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-white shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 font-futura">
              Publicar Novo Projeto
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Preencha os dados para que os profissionais encontrem seu projeto.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-6 overflow-y-auto bg-slate-50/50 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Nome do Projeto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Criação de Identidade Visual para Café Gourmet"
              className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-800 placeholder:text-slate-400 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] focus:outline-none transition-all shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Categoria Principal <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 text-slate-700 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none appearance-none cursor-pointer shadow-sm"
                >
                  <option value="" disabled>
                    Selecione uma categoria
                  </option>
                  <option>Design e Multimedia</option>
                  <option>TI e Programação</option>
                  <option>Marketing e Vendas</option>
                  <option>Tradução e Conteúdo</option>
                  <option>Jurídico</option>
                  <option>Engenharia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Habilidades (Tags){" "}
                <span className="text-xs font-normal text-slate-400 ml-2">
                  (Max 5)
                </span>
              </label>
              <div className="w-full bg-white border border-slate-200 rounded-xl p-2 flex flex-wrap gap-2 focus-within:border-[#d73cbe] focus-within:ring-1 focus-within:ring-[#d73cbe] transition-all shadow-sm min-h-[50px]">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1"
                  >
                    {tag}{" "}
                    <button
                      onClick={() => setTags(tags.filter((t) => t !== tag))}
                      className="hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyDown={handleKeyDownTag}
                  placeholder={
                    tags.length === 0 ? "Digite e aperte Enter..." : ""
                  }
                  className="flex-1 bg-transparent outline-none text-sm text-slate-800 placeholder:text-slate-400 min-w-[100px] p-1.5"
                  disabled={tags.length >= 5}
                />
                <button
                  onClick={handleAddTag}
                  disabled={!currentTag}
                  className="text-slate-400 hover:text-[#d73cbe]"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Descrição Detalhada <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explique o que você precisa..."
              className="w-full bg-white border border-slate-200 rounded-xl p-4 text-slate-800 placeholder:text-slate-400 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none transition-all shadow-sm resize-none"
            />
            <div className="mt-1 flex justify-between gap-3 text-xs text-slate-400">
              <span>Minimo de {PROJECT_DESCRIPTION_MIN} caracteres.</span>
              <span>
                {description.trim().length}/{PROJECT_DESCRIPTION_MAX}
              </span>
            </div>
          </div>

          {/* 4. Anexos / Links */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Anexos / Links de Referência
            </label>
            <div className="space-y-3">
              {/* Input para adicionar link */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={currentLink}
                    onChange={(e) => setCurrentLink(e.target.value)}
                    placeholder="Cole aqui o link do Google Drive, Figma, Dropbox..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 pl-10 text-sm text-slate-800 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none"
                  />
                </div>
                <button
                  onClick={handleAddLink}
                  type="button"
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>

              {/* Lista de links adicionados */}
              {attachments.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-xl p-2 space-y-1">
                  {attachments.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg group"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <div className="p-1.5 bg-blue-50 text-blue-500 rounded-md shrink-0">
                          <LinkIcon className="w-3 h-3" />
                        </div>
                        <span className="text-xs text-slate-600 truncate">
                          {link}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveLink(idx)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {attachments.length === 0 && (
                <p className="text-xs text-slate-400 ml-1">
                  Adicione links para arquivos grandes ou referências visuais.
                </p>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-200 my-2" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-700">
                Qual seu orçamento?
              </label>
              <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                <button
                  onClick={() => setBudgetType("fixed")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    budgetType === "fixed"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Preço Fixo
                </button>
                <button
                  onClick={() => setBudgetType("hourly")}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                    budgetType === "hourly"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Por Hora
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={budgetValue}
                  onChange={(e) => setBudgetValue(e.target.value)}
                  placeholder={budgetType === "fixed" ? "1500,00" : "50,00"}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-800 placeholder:text-slate-400 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none transition-all shadow-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Para quando você precisa?
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <select
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-3.5 pl-10 text-slate-700 focus:border-[#d73cbe] focus:ring-1 focus:ring-[#d73cbe] outline-none appearance-none cursor-pointer shadow-sm"
                >
                  <option>Urgente (em até 24h)</option>
                  <option>Para essa semana</option>
                  <option>Para este mês</option>
                  <option>Posso esperar (sem pressa)</option>
                </select>
              </div>
              <div className="flex items-start gap-2 mt-3 p-3 bg-blue-50 text-blue-700 rounded-lg text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Projetos urgentes costumam custar 20% a mais.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center shrink-0">
          {formError ? (
            <p className="min-w-0 text-xs font-semibold text-red-500">
              {formError}
            </p>
          ) : null}
          <span className="text-xs text-slate-400 hidden md:inline-block">
            * Campos obrigatórios
          </span>
          <div className="flex gap-3 w-full md:w-auto">
            <button
              onClick={handleClose}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer font-bold"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-[#d73cbe] hover:bg-[#b0269a] text-white font-bold shadow-lg shadow-purple-200 transition-all cursor-pointer flex items-center justify-center gap-2 hover:-translate-y-0.5 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isLoading ? "Publicando..." : "Publicar Projeto"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
