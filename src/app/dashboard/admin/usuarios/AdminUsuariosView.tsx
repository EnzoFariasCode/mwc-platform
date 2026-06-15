"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, UserCog, UserX } from "lucide-react";
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
