"use client";

import { useState } from "react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Search, UserCog, UserX } from "lucide-react";
import { toast } from "sonner";
import { toggleUserStatus } from "@/modules/admin/actions/user-actions";

export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  userType: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  industry: "TECH" | "HEALTH";
  isActive: boolean;
  createdAt: string;
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

function isWithinDateRange(value: string, dateFrom: string, dateTo: string) {
  const date = new Date(value);

  if (dateFrom) {
    const from = new Date(`${dateFrom}T00:00:00`);
    if (date < from) return false;
  }

  if (dateTo) {
    const to = new Date(`${dateTo}T23:59:59`);
    if (date > to) return false;
  }

  return true;
}

function userTypeLabel(userType: AdminUserItem["userType"]) {
  const labels = {
    CLIENT: "Cliente",
    PROFESSIONAL: "Profissional",
    ADMIN: "Admin",
  };

  return labels[userType];
}

function industryLabel(industry: AdminUserItem["industry"]) {
  return industry === "HEALTH" ? "Saúde" : "Tech";
}

export default function AdminUsuariosView({
  users,
}: {
  users: AdminUserItem[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<
    "ALL" | AdminUserItem["userType"]
  >("ALL");
  const [industryFilter, setIndustryFilter] = useState<
    "ALL" | AdminUserItem["industry"]
  >("ALL");
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "SUSPENDED"
  >("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  function handleToggle(user: AdminUserItem) {
    startTransition(async () => {
      const result = await toggleUserStatus(user.id);

      if (result.success) {
        toast.success(
          result.data?.isActive ? "Usuário reativado." : "Usuário suspenso.",
        );
        router.refresh();
      } else {
        toast.error(result.error || "Não foi possível alterar o usuário.");
      }
    });
  }

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter((user) => {
    const haystack = [
      user.id,
      user.name,
      user.email,
      user.userType,
      user.industry,
      user.isActive ? "ativo active" : "suspenso suspended",
    ]
      .join(" ")
      .toLowerCase();

    return (
      (!normalizedSearch || haystack.includes(normalizedSearch)) &&
      (userTypeFilter === "ALL" || user.userType === userTypeFilter) &&
      (industryFilter === "ALL" || user.industry === industryFilter) &&
      (statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && user.isActive) ||
        (statusFilter === "SUSPENDED" && !user.isActive)) &&
      isWithinDateRange(user.createdAt, dateFrom, dateTo)
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#d73cbe]/20 bg-[#d73cbe]/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#d73cbe]">
            <UserCog className="h-3.5 w-3.5" />
            CRM interno
          </div>
          <h1 className="text-2xl font-bold text-white font-futura">
            Controle de Usuários
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Visualize os 50 usuários mais recentes e suspenda contas sem apagar
            dados transacionais ou médicos.
          </p>
        </div>

        <div className="rounded-xl border border-white/5 bg-slate-900 px-4 py-3 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
            Listados
          </p>
          <p className="text-xl font-bold text-white">{users.length}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900 p-4">
        <div className="grid gap-3 xl:grid-cols-[1.5fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por ID real, email, nome..."
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]"
            />
          </label>
          <select
            value={userTypeFilter}
            onChange={(event) =>
              setUserTypeFilter(
                event.target.value as "ALL" | AdminUserItem["userType"],
              )
            }
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-[#d73cbe]"
          >
            <option value="ALL">Todos tipos</option>
            <option value="CLIENT">Cliente</option>
            <option value="PROFESSIONAL">Profissional</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            value={industryFilter}
            onChange={(event) =>
              setIndustryFilter(
                event.target.value as "ALL" | AdminUserItem["industry"],
              )
            }
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-[#d73cbe]"
          >
            <option value="ALL">Todos setores</option>
            <option value="TECH">Tech</option>
            <option value="HEALTH">Saude</option>
          </select>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as "ALL" | "ACTIVE" | "SUSPENDED",
              )
            }
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-[#d73cbe]"
          >
            <option value="ALL">Todos status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="SUSPENDED">Suspenso</option>
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-[#d73cbe]"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-[#d73cbe]"
          />
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              setUserTypeFilter("ALL");
              setIndustryFilter("ALL");
              setStatusFilter("ALL");
              setDateFrom("");
              setDateTo("");
            }}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-4 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800"
          >
            Limpar
          </button>
        </div>
        <p className="mt-3 text-xs font-bold text-slate-500">
          Exibindo {filteredUsers.length} de {users.length} usuarios carregados.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900 shadow-lg shadow-black/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-white/5 bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Criado em</th>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Setor</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="transition-colors hover:bg-white/[0.02]"
                >
                  <td className="px-5 py-4 text-slate-400">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-bold text-white">{user.name}</p>
                  </td>
                  <td className="max-w-[260px] px-5 py-4">
                    <p className="truncate text-slate-300">{user.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-full border border-white/10 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">
                      {userTypeLabel(user.userType)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                        user.industry === "HEALTH"
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-[#d73cbe]/10 text-[#d73cbe]"
                      }`}
                    >
                      {industryLabel(user.industry)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                        user.isActive
                          ? "bg-emerald-500/10 text-emerald-300"
                          : "bg-red-500/10 text-red-300"
                      }`}
                    >
                      {user.isActive ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <UserX className="h-3.5 w-3.5" />
                      )}
                      {user.isActive ? "Ativo" : "Suspenso"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => handleToggle(user)}
                      disabled={isPending || user.userType === "ADMIN"}
                      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        user.isActive
                          ? "border border-red-500/20 bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white"
                          : "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500 hover:text-black"
                      }`}
                    >
                      {isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : user.isActive ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {user.isActive ? "Suspender" : "Reativar"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
