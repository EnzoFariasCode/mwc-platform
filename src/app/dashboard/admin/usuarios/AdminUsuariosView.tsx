"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, Search, UserCog, UserX } from "lucide-react";
import { toast } from "sonner";
import { formatDateBR, formatDateTimeBR } from "@/lib/formatters";
import {
  toggleUserStatus,
  updateAdminRole,
} from "@/modules/admin/actions/user-actions";
import { AdminPageHeader } from "@/modules/admin/components/AdminPageHeader";
import { AdminMetricCard } from "@/modules/admin/components/AdminMetricCard";

export type AdminUserItem = {
  id: string;
  name: string;
  email: string;
  userType: "CLIENT" | "PROFESSIONAL" | "ADMIN";
  industry: "TECH" | "HEALTH";
  adminRole: "OWNER" | "FINANCE" | "SUPPORT" | null;
  isActive: boolean;
  createdAt: string;
  auditLog: {
    id: string;
    action: string;
    reason: string | null;
    createdAt: string;
    actorName: string | null;
    actorEmail: string | null;
  } | null;
};

function formatDate(value: string) {
  return formatDateBR(value);
}

function formatDateTime(value: string) {
  return formatDateTimeBR(value);
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

function adminRoleLabel(adminRole: NonNullable<AdminUserItem["adminRole"]>) {
  const labels = {
    OWNER: "Dono",
    FINANCE: "Financeiro",
    SUPPORT: "Suporte",
  };

  return labels[adminRole];
}

function auditActionLabel(action: string) {
  const labels: Record<string, string> = {
    USER_ACCOUNT_SUSPENDED: "Suspensao",
    USER_ACCOUNT_REACTIVATED: "Reativacao",
    ADMIN_ROLE_UPDATED: "Papel admin atualizado",
  };

  return labels[action] ?? action;
}

export default function AdminUsuariosView({
  users,
  pagination,
  query,
}: {
  users: AdminUserItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  query: {
    search: string;
    userType: string;
    industry: string;
    status: string;
    dateFrom: string;
    dateTo: string;
  };
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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

  function handleAdminRoleChange(
    user: AdminUserItem,
    adminRole: NonNullable<AdminUserItem["adminRole"]>,
  ) {
    startTransition(async () => {
      const result = await updateAdminRole(user.id, adminRole);

      if (result.success) {
        toast.success("Papel admin atualizado.");
        router.refresh();
      } else {
        toast.error(result.error || "Nao foi possivel alterar o papel admin.");
      }
    });
  }

  function pageHref(page: number) {
    const params = new URLSearchParams();
    if (query.search) params.set("q", query.search);
    if (query.userType !== "ALL") params.set("userType", query.userType);
    if (query.industry !== "ALL") params.set("industry", query.industry);
    if (query.status !== "ALL") params.set("status", query.status);
    if (query.dateFrom) params.set("dateFrom", query.dateFrom);
    if (query.dateTo) params.set("dateTo", query.dateTo);
    params.set("page", String(page));
    return `/dashboard/admin/usuarios?${params.toString()}`;
  }

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="CRM interno"
        title="Controle de usuários"
        description="Consulte todos os usuários e suspenda contas sem apagar dados transacionais ou médicos."
        icon={UserCog}
        actions={
          <div className="w-full min-w-44 sm:w-auto">
            <AdminMetricCard
              label="Usuários encontrados"
              value={pagination.totalItems}
              icon={UserCog}
            />
          </div>
        }
      />

      <div className="rounded-xl border border-white/[0.08] bg-slate-900/70 p-4">
        <form
          method="get"
          className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-[1.5fr_0.75fr_0.75fr_0.75fr_0.75fr_0.75fr_auto_auto]"
        >
          <label className="relative sm:col-span-2 xl:col-span-2 2xl:col-span-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              name="q"
              defaultValue={query.search}
              placeholder="Buscar por ID real, email, nome..."
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-[#d73cbe]"
            />
          </label>
          <select
            name="userType"
            defaultValue={query.userType}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-[#d73cbe]"
          >
            <option value="ALL">Todos tipos</option>
            <option value="CLIENT">Cliente</option>
            <option value="PROFESSIONAL">Profissional</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select
            name="industry"
            defaultValue={query.industry}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-[#d73cbe]"
          >
            <option value="ALL">Todos setores</option>
            <option value="TECH">Tech</option>
            <option value="HEALTH">Saude</option>
          </select>
          <select
            name="status"
            defaultValue={query.status}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-[#d73cbe]"
          >
            <option value="ALL">Todos status</option>
            <option value="ACTIVE">Ativo</option>
            <option value="SUSPENDED">Suspenso</option>
          </select>
          <input
            type="date"
            name="dateFrom"
            defaultValue={query.dateFrom}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-[#d73cbe]"
          />
          <input
            type="date"
            name="dateTo"
            defaultValue={query.dateTo}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-[#d73cbe]"
          />
          <button
            type="submit"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-[#d73cbe] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#b02da0]"
          >
            Aplicar
          </button>
          <Link
            href="/dashboard/admin/usuarios"
            className="inline-flex h-11 items-center justify-center rounded-lg border border-white/10 bg-slate-950 px-4 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            Limpar
          </Link>
        </form>
        <p className="mt-3 text-xs font-bold text-slate-500">
          Exibindo {users.length} de {pagination.totalItems} resultado(s).
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-slate-900/70 shadow-sm shadow-black/10">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="border-b border-white/5 bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-4">Criado em</th>
                <th className="px-5 py-4">Nome</th>
                <th className="px-5 py-4">Email</th>
                <th className="px-5 py-4">Tipo</th>
                <th className="px-5 py-4">Setor</th>
                <th className="px-5 py-4">Papel admin</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Auditoria</th>
                <th className="px-5 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.map((user) => (
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
                    {user.userType === "ADMIN" ? (
                      <select
                        value={user.adminRole ?? "OWNER"}
                        onChange={(event) =>
                          handleAdminRoleChange(
                            user,
                            event.target.value as NonNullable<
                              AdminUserItem["adminRole"]
                            >,
                          )
                        }
                        disabled={isPending}
                        className="h-9 rounded-xl border border-white/10 bg-slate-950 px-2 text-xs font-bold text-slate-300 outline-none focus:border-[#d73cbe] disabled:cursor-wait disabled:opacity-60"
                      >
                        <option value="OWNER">{adminRoleLabel("OWNER")}</option>
                        <option value="FINANCE">
                          {adminRoleLabel("FINANCE")}
                        </option>
                        <option value="SUPPORT">
                          {adminRoleLabel("SUPPORT")}
                        </option>
                      </select>
                    ) : (
                      <span className="rounded-full border border-white/10 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">
                        N/A
                      </span>
                    )}
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
                  <td className="max-w-[260px] px-5 py-4">
                    {user.auditLog ? (
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wide text-slate-300">
                          {auditActionLabel(user.auditLog.action)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user.auditLog.actorName || "Admin"} -{" "}
                          {formatDateTime(user.auditLog.createdAt)}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {user.auditLog.reason || "Sem motivo registrado"}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-600">
                        Sem log administrativo
                      </span>
                    )}
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
      {pagination.totalPages > 1 && (
        <nav className="flex items-center justify-between gap-4 text-sm">
          <Link
            href={pageHref(Math.max(1, pagination.page - 1))}
            aria-disabled={pagination.page === 1}
            className={`rounded-xl border px-4 py-2 font-bold ${pagination.page === 1 ? "pointer-events-none border-white/5 text-slate-700" : "border-white/10 text-slate-300 hover:bg-slate-800"}`}
          >
            Anterior
          </Link>
          <span className="text-slate-400">
            Pagina {pagination.page} de {pagination.totalPages}
          </span>
          <Link
            href={pageHref(
              Math.min(pagination.totalPages, pagination.page + 1),
            )}
            aria-disabled={pagination.page === pagination.totalPages}
            className={`rounded-xl border px-4 py-2 font-bold ${pagination.page === pagination.totalPages ? "pointer-events-none border-white/5 text-slate-700" : "border-white/10 text-slate-300 hover:bg-slate-800"}`}
          >
            Proxima
          </Link>
        </nav>
      )}
    </div>
  );
}
