"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Calendar,
  User,
  Briefcase,
  Code2,
  Plus,
  Github,
  Linkedin,
  FileText,
  Link as LinkIcon,
  Trash2,
  Save,
  AlertCircle,
  MapPin,
  DollarSign,
  Loader2,
} from "lucide-react";

// --- LISTA DE ESTADOS (IBGE) ---
const BRAZIL_STATES = [
  { sigla: "AC", nome: "Acre" },
  { sigla: "AL", nome: "Alagoas" },
  { sigla: "AP", nome: "Amapá" },
  { sigla: "AM", nome: "Amazonas" },
  { sigla: "BA", nome: "Bahia" },
  { sigla: "CE", nome: "Ceará" },
  { sigla: "DF", nome: "Distrito Federal" },
  { sigla: "ES", nome: "Espírito Santo" },
  { sigla: "GO", nome: "Goiás" },
  { sigla: "MA", nome: "Maranhão" },
  { sigla: "MT", nome: "Mato Grosso" },
  { sigla: "MS", nome: "Mato Grosso do Sul" },
  { sigla: "MG", nome: "Minas Gerais" },
  { sigla: "PA", nome: "Pará" },
  { sigla: "PB", nome: "Paraíba" },
  { sigla: "PR", nome: "Paraná" },
  { sigla: "PE", nome: "Pernambuco" },
  { sigla: "PI", nome: "Piauí" },
  { sigla: "RJ", nome: "Rio de Janeiro" },
  { sigla: "RN", nome: "Rio Grande do Norte" },
  { sigla: "RS", nome: "Rio Grande do Sul" },
  { sigla: "RO", nome: "Rondônia" },
  { sigla: "RR", nome: "Roraima" },
  { sigla: "SC", nome: "Santa Catarina" },
  { sigla: "SP", nome: "São Paulo" },
  { sigla: "SE", nome: "Sergipe" },
  { sigla: "TO", nome: "Tocantins" },
];

type PortfolioItem = {
  title: string;
  url: string;
};

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    name: string | null;
    displayName: string | null;
    email: string | null;
    userType: "CLIENT" | "PROFESSIONAL" | "ADMIN";
    birthDate?: string | Date | null;
    city?: string | null;
    state?: string | null;
    hourlyRate?: number | null;
    jobTitle?: string | null;
    skills?: string[];
    socialGithub?: string | null;
    socialLinkedin?: string | null;
    portfolio?: any;
    certificates?: any;
  };
  onSave: (data: any) => void;
}

interface CityIBGE {
  id: number;
  nome: string;
}

export function EditProfileModal({
  isOpen,
  onClose,
  user,
  onSave,
}: EditProfileModalProps) {
  const isPro = user.userType === "PROFESSIONAL";

  // --- REFS PARA O CLICK OUTSIDE ---
  const cityWrapperRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    displayName: "",
    birthDate: "",
    city: "",
    state: "",
    hourlyRate: "",
    jobTitle: "",
    skills: [] as string[],
    socialGithub: "",
    socialLinkedin: "",
    currentPassword: "",
    newPassword: "",
  });

  const [portfolioList, setPortfolioList] = useState<PortfolioItem[]>([]);
  const [certificateList, setCertificateList] = useState<PortfolioItem[]>([]);

  // --- ESTADOS DE CIDADE ---
  const [cities, setCities] = useState<CityIBGE[]>([]);
  const [showCityList, setShowCityList] = useState(false); // Controla se a lista aparece
  const [loadingCities, setLoadingCities] = useState(false);

  const [newSkill, setNewSkill] = useState("");
  const [newPortfolio, setNewPortfolio] = useState({ title: "", url: "" });
  const [newCertificate, setNewCertificate] = useState({ title: "", url: "" });
  const [error, setError] = useState<string | null>(null);

  // Inicializa dados quando abre modal
  useEffect(() => {
    if (isOpen) {
      let formattedDate = "";
      if (user.birthDate) {
        const dateObj = new Date(user.birthDate);
        if (!isNaN(dateObj.getTime())) {
          formattedDate = dateObj.toISOString().split("T")[0];
        } else if (typeof user.birthDate === "string") {
          formattedDate = user.birthDate;
        }
      }

      setFormData({
        name: user.name || "",
        displayName: user.displayName || "",
        birthDate: formattedDate,
        city: user.city || "",
        state: user.state || "",
        hourlyRate: user.hourlyRate ? user.hourlyRate.toString() : "",
        jobTitle: user.jobTitle || "",
        skills: user.skills || [],
        socialGithub: user.socialGithub || "",
        socialLinkedin: user.socialLinkedin || "",
        currentPassword: "",
        newPassword: "",
      });

      setPortfolioList(Array.isArray(user.portfolio) ? user.portfolio : []);
      setCertificateList(
        Array.isArray(user.certificates) ? user.certificates : []
      );

      setError(null);
      setNewSkill("");
      setShowCityList(false);
    }
  }, [isOpen, user]);

  // Busca Cidades no IBGE
  useEffect(() => {
    if (formData.state && formData.state.length === 2) {
      setLoadingCities(true);
      fetch(
        `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios`
      )
        .then((res) => res.json())
        .then((data) => {
          const sortedCities = data.sort((a: CityIBGE, b: CityIBGE) =>
            a.nome.localeCompare(b.nome)
          );
          setCities(sortedCities);
          setLoadingCities(false);
        })
        .catch((err) => {
          console.error("Erro ao buscar cidades", err);
          setLoadingCities(false);
        });
    } else {
      setCities([]);
    }
  }, [formData.state]);

  // --- DETECTAR CLIQUE FORA DA LISTA DE CIDADES ---
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        cityWrapperRef.current &&
        !cityWrapperRef.current.contains(event.target as Node)
      ) {
        setShowCityList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- FILTRO DE CIDADES (AUTOCOMPLETE) ---
  // Filtra as cidades baseado no que o usuário digitou
  const filteredCities =
    formData.city.length > 0
      ? cities.filter((c) =>
          c.nome.toLowerCase().includes(formData.city.toLowerCase())
        )
      : [];

  const addItem = (
    list: PortfolioItem[],
    setList: (l: PortfolioItem[]) => void,
    newItem: PortfolioItem,
    setNewItem: (i: PortfolioItem) => void,
    limit: number
  ) => {
    if (!newItem.title.trim() || !newItem.url.trim()) return;
    if (list.length >= limit) {
      setError(`Limite de ${limit} itens atingido.`);
      return;
    }
    setList([...list, newItem]);
    setNewItem({ title: "", url: "" });
    setError(null);
  };

  const removeItem = (
    list: PortfolioItem[],
    setList: (l: PortfolioItem[]) => void,
    index: number
  ) => {
    setList(list.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isPro) {
      if (!formData.jobTitle || formData.jobTitle.trim() === "") {
        setError(
          "O campo 'Cargo / Especialização' é obrigatório para profissionais."
        );
        return;
      }
    }

    if (formData.newPassword.trim() !== "") {
      if (!formData.currentPassword) {
        setError("Para alterar a senha, confirme a senha atual.");
        return;
      }
      if (formData.newPassword.length < 6) {
        setError("Nova senha deve ter min 6 caracteres.");
        return;
      }
    }

    const payload: any = {
      ...formData,
      skills: isPro ? formData.skills : [],
      portfolio: isPro ? portfolioList : [],
      certificates: isPro ? certificateList : [],
      jobTitle: isPro ? formData.jobTitle : null,
      hourlyRate: isPro ? formData.hourlyRate : null,
    };

    if (formData.newPassword) {
      payload.currentPassword = formData.currentPassword;
      payload.newPassword = formData.newPassword;
    }

    onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-700/50 bg-slate-900/50 shrink-0">
          <h2 className="text-xl font-bold text-white">
            Editar Perfil {isPro ? "(Profissional)" : "(Cliente)"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer group"
          >
            <X className="w-5 h-5 text-slate-400 group-hover:text-white" />
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1"
        >
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm flex items-center gap-2 animate-pulse">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* DADOS BÁSICOS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2 mb-2">
              <User className="w-4 h-4" /> Informações Básicas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Nome Completo
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300">
                  Apelido
                </label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) =>
                    setFormData({ ...formData, displayName: e.target.value })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isPro && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Cargo <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={formData.jobTitle}
                      onChange={(e) =>
                        setFormData({ ...formData, jobTitle: e.target.value })
                      }
                      className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                    />
                  </div>
                </div>
              )}
              <div className={`space-y-1.5 ${!isPro ? "col-span-2" : ""}`}>
                <label className="text-xs font-medium text-slate-300">
                  Nascimento
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-500 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-800" />

          {/* LOCAL E PREÇO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4" /> Completar Cadastro
              </h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {/* UF */}
              <div className="col-span-1 space-y-1.5">
                <label className="text-xs font-medium text-slate-300">UF</label>
                <select
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      state: e.target.value,
                      city: "",
                    })
                  }
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 uppercase outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">--</option>
                  {BRAZIL_STATES.map((uf) => (
                    <option key={uf.sigla} value={uf.sigla}>
                      {uf.sigla}
                    </option>
                  ))}
                </select>
              </div>

              {/* CIDADE CUSTOMIZADA */}
              <div
                className="col-span-2 space-y-1.5 relative"
                ref={cityWrapperRef}
              >
                <label className="text-xs font-medium text-slate-300 flex justify-between">
                  <span>Cidade</span>
                  {loadingCities && (
                    <span className="text-xs text-indigo-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" /> Buscando...
                    </span>
                  )}
                </label>

                <input
                  type="text"
                  placeholder={
                    !formData.state
                      ? "Selecione o UF primeiro"
                      : "Digite para buscar..."
                  }
                  disabled={!formData.state}
                  value={formData.city}
                  onChange={(e) => {
                    setFormData({ ...formData, city: e.target.value });
                    setShowCityList(true); // Abre a lista ao digitar
                  }}
                  onFocus={() => {
                    if (formData.city.length > 0) setShowCityList(true);
                  }}
                  className="w-full p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  autoComplete="off" // Desativa o autocomplete nativo do browser
                />

                {/* LISTA CUSTOMIZADA (FLUTUANTE) */}
                {showCityList && filteredCities.length > 0 && (
                  <ul className="absolute z-50 left-0 right-0 top-[calc(100%+4px)] bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-top-1">
                    {filteredCities.map((city) => (
                      <li
                        key={city.id}
                        onClick={() => {
                          setFormData({ ...formData, city: city.nome });
                          setShowCityList(false); // Fecha ao clicar
                        }}
                        className="px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer transition-colors"
                      >
                        {city.nome}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {isPro && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  Valor Hora Profissional
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) =>
                      setFormData({ ...formData, hourlyRate: e.target.value })
                    }
                    className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-slate-800" />

          {/* REDES SOCIAIS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Redes Sociais
            </h3>
            <div className="grid grid-cols-1 gap-3">
              {isPro && (
                <div className="relative">
                  <Github className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="URL do GitHub"
                    value={formData.socialGithub}
                    onChange={(e) =>
                      setFormData({ ...formData, socialGithub: e.target.value })
                    }
                    className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                  />
                </div>
              )}
              <div className="relative">
                <Linkedin className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  placeholder="URL do LinkedIn"
                  value={formData.socialLinkedin}
                  onChange={(e) =>
                    setFormData({ ...formData, socialLinkedin: e.target.value })
                  }
                  className="w-full pl-10 p-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-slate-200"
                />
              </div>
            </div>
          </div>

          {/* SKILLS E PORTFOLIO (PARA PROFISSIONAIS) */}
          {isPro && (
            <>
              <div className="h-px bg-slate-800" />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <Code2 className="w-4 h-4" /> Habilidades
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {formData.skills.length}/5
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nova habilidade..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newSkill && formData.skills.length < 5) {
                        setFormData({
                          ...formData,
                          skills: [...formData.skills, newSkill],
                        });
                        setNewSkill("");
                      }
                    }}
                    className="p-2 bg-slate-800 rounded-lg text-white hover:bg-slate-700"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-slate-800 rounded text-xs flex items-center gap-1"
                    >
                      {s}{" "}
                      <X
                        className="w-3 h-3 cursor-pointer"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            skills: formData.skills.filter((x) => x !== s),
                          })
                        }
                      />
                    </span>
                  ))}
                </div>
              </div>

              <div className="h-px bg-slate-800" />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Portfólio
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    {portfolioList.length}/3
                  </span>
                </div>
                {portfolioList.length < 3 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Título"
                      value={newPortfolio.title}
                      onChange={(e) =>
                        setNewPortfolio({
                          ...newPortfolio,
                          title: e.target.value,
                        })
                      }
                      className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                    />
                    <input
                      type="text"
                      placeholder="URL"
                      value={newPortfolio.url}
                      onChange={(e) =>
                        setNewPortfolio({
                          ...newPortfolio,
                          url: e.target.value,
                        })
                      }
                      className="flex-1 p-2 bg-slate-900 border border-slate-700 rounded-lg text-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addItem(
                          portfolioList,
                          setPortfolioList,
                          newPortfolio,
                          setNewPortfolio,
                          3
                        )
                      }
                      className="p-2 bg-slate-800 rounded-lg text-white"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                )}
                <div className="space-y-2">
                  {portfolioList.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center p-2 bg-slate-800/50 rounded text-sm"
                    >
                      <span className="truncate max-w-[150px] font-medium">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={item.url}
                          target="_blank"
                          className="text-blue-400 text-xs hover:underline truncate max-w-[100px]"
                        >
                          Link
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            removeItem(portfolioList, setPortfolioList, i)
                          }
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="h-px bg-slate-800" />

          {/* SEGURANÇA */}
          <div className="space-y-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">
              Segurança (Opcional)
            </h3>
            <input
              type="password"
              placeholder="Senha Atual"
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({ ...formData, currentPassword: e.target.value })
              }
              className="w-full p-2 mb-2 bg-slate-950 border border-slate-700 rounded text-sm"
            />
            <input
              type="password"
              placeholder="Nova Senha"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              className="w-full p-2 bg-slate-950 border border-slate-700 rounded text-sm"
            />
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-700/50 bg-slate-900/50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] rounded-lg shadow-lg shadow-indigo-900/20 cursor-pointer flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
