"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  CircleDollarSign,
  Copy,
  Landmark,
  Loader2,
  Mail,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrencyBR, formatDateTimeBR } from "@/lib/formatters";
import { approveWithdrawal } from "@/modules/admin/actions/approve-withdrawal";
import { rejectWithdrawal } from "@/modules/admin/actions/reject-withdrawal";
import { uploadWithdrawalReceipt } from "@/modules/admin/actions/upload-withdrawal-receipt";
import { resendWithdrawalReceiptEmail } from "@/modules/admin/actions/resend-withdrawal-receipt-email";

type WithdrawalStatusFilter =
  | "ALL"
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";

export type AdminWithdrawalItem = {
  id: string;
  amount: number;
  pixKey: string;
  pixKeyType: string;
  status: string;
  createdAt: string;
  requestedAt: string;
  dueAt: string;
  processedAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  providerRef: string | null;
  receiptEmailSentAt: string | null;
  receiptEmailAttempts: number;
  receiptEmailFailureReason: string | null;
  transactionId: string;
  auditLog: {
    id: string;
    action: string;
    reason: string | null;
    receiptUrl: string | null;
    receiptFileName: string | null;
    receiptFileType: string | null;
    createdAt: string;
    actorName: string | null;
    actorEmail: string | null;
  } | null;
  user: {
    id: string;
    name: string;
    email: string;
    walletBalance: number;
  };
};

const statusLabels: Record<string, string> = {
  PENDING: "Aguardando pagamento",
  PROCESSING: "Pagamento em conferencia",
  COMPLETED: "Transferido",
  FAILED: "Falhou",
  CANCELED: "Cancelado",
};

const statusClasses: Record<string, string> = {
  PENDING: "border-amber-500/20 bg-amber-500/10 text-amber-300",
  PROCESSING: "border-blue-500/20 bg-blue-500/10 text-blue-300",
  COMPLETED: "border-emerald-500/20 bg-emerald-500/10 text-emerald-300",
  FAILED: "border-red-500/20 bg-red-500/10 text-red-300",
  CANCELED: "border-slate-500/20 bg-slate-500/10 text-slate-300",
};

function formatMoney(amount: number) {
  return formatCurrencyBR(amount);
}

function formatDate(value: string) {
  return formatDateTimeBR(value);
}

function deadlineLabel(dueAt: string, status: string) {
  if (["COMPLETED", "FAILED", "CANCELED"].includes(status)) return null;
  const remainingMs = new Date(dueAt).getTime() - Date.now();
  const remainingDays = Math.ceil(remainingMs / (24 * 60 * 60 * 1000));

  if (remainingDays < 0) return `Atrasado ${Math.abs(remainingDays)} dia(s)`;
  if (remainingDays === 0) return "Vence hoje";
  return `Vence em ${remainingDays} dia(s)`;
}

export default function AdminFinanceiroView({
  withdrawals,
  pagination,
  summary,
  query,
}: {
  withdrawals: AdminWithdrawalItem[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  summary: {
    statusCounts: Record<string, number>;
    pendingCount: number;
    pendingAmount: number;
    completedAmount: number;
  };
  query: {
    search: string;
    status: string;
    dateFrom: string;
    dateTo: string;
  };
}) {
  const router = useRouter();
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [uploadingWithdrawalId, setUploadingWithdrawalId] = useState<
    string | null
  >(null);
  const [emailingId, setEmailingId] = useState<string | null>(null);
  const [copiedWithdrawalId, setCopiedWithdrawalId] = useState<string | null>(
    null,
  );
  const [withdrawalReasons, setWithdrawalReasons] = useState<
    Record<string, string>
  >({});

  async function handleApprove(
    event: FormEvent<HTMLFormElement>,
    withdrawalId: string,
  ) {
    event.preventDefault();
    setApprovingId(withdrawalId);
    const formData = new FormData(event.currentTarget);
    const result = await approveWithdrawal(formData);

    if (result.success) {
      if (result.data?.emailSent) {
        toast.success("Pagamento confirmado e comprovante enviado por e-mail.");
      } else {
        toast.warning(
          "Pagamento confirmado, mas o e-mail falhou. Use Reenviar comprovante.",
        );
      }
      router.refresh();
    } else {
      toast.error(result.error || "Nao foi possivel aprovar o saque.");
    }

    setApprovingId(null);
  }

  async function handleReject(
    withdrawalId: string,
    decision: "FAILED" | "CANCELED",
  ) {
    const reason = withdrawalReasons[withdrawalId]?.trim() ?? "";

    if (reason.length < 10) {
      toast.error("Informe um motivo com pelo menos 10 caracteres.");
      return;
    }

    setRejectingId(`${decision}:${withdrawalId}`);
    const result = await rejectWithdrawal(withdrawalId, decision, reason);

    if (result.success) {
      toast.success(
        decision === "FAILED"
          ? "Saque reprovado e saldo devolvido."
          : "Saque cancelado e saldo devolvido.",
      );
      setWithdrawalReasons((current) => {
        const next = { ...current };
        delete next[withdrawalId];
        return next;
      });
      router.refresh();
    } else {
      toast.error(result.error || "Nao foi possivel processar o saque.");
    }

    setRejectingId(null);
  }

  async function handleReceiptUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const withdrawalId = formData.get("withdrawalId")?.toString() ?? null;

    if (!withdrawalId) return;

    setUploadingWithdrawalId(withdrawalId);
    const result = await uploadWithdrawalReceipt(formData);

    if (result.success) {
      if (result.data?.emailSent) {
        toast.success("Comprovante anexado e enviado por e-mail.");
      } else {
        toast.warning(
          "Comprovante anexado, mas o e-mail falhou. Tente reenviar.",
        );
      }
      form.reset();
      router.refresh();
    } else {
      toast.error(result.error || "Nao foi possivel anexar o comprovante.");
    }

    setUploadingWithdrawalId(null);
  }

  async function handleResendReceiptEmail(withdrawalId: string) {
    setEmailingId(withdrawalId);
    const result = await resendWithdrawalReceiptEmail(withdrawalId);

    if (result.success) {
      toast.success("Comprovante reenviado por e-mail.");
      router.refresh();
    } else {
      toast.error(result.error || "Nao foi possivel reenviar o comprovante.");
    }

    setEmailingId(null);
  }

  async function handleCopyPixKey(withdrawalId: string, pixKey: string) {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopiedWithdrawalId(withdrawalId);
      toast.success("Chave Pix copiada.");
      window.setTimeout(() => setCopiedWithdrawalId(null), 2_000);
    } catch {
      toast.error("Nao foi possivel copiar a chave Pix.");
    }
  }

  const filters: Array<{ value: WithdrawalStatusFilter; label: string }> = [
    { value: "PENDING", label: "Pendentes" },
    { value: "COMPLETED", label: "Transferidos" },
    { value: "PROCESSING", label: "Processando" },
    { value: "FAILED", label: "Falhas" },
    { value: "CANCELED", label: "Cancelados" },
    { value: "ALL", label: "Todos" },
  ];

  function queryHref({ page = 1, status = query.status } = {}) {
    const params = new URLSearchParams();
    if (query.search) params.set("q", query.search);
    if (status !== "PENDING") params.set("status", status);
    if (query.dateFrom) params.set("dateFrom", query.dateFrom);
    if (query.dateTo) params.set("dateTo", query.dateTo);
    params.set("page", String(page));
    return `/dashboard/admin/financeiro?${params.toString()}`;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-300">
            <Landmark className="h-3.5 w-3.5" />
            Tesouraria
          </div>
          <h1 className="text-2xl font-bold text-white font-futura">
            Saques PIX
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Confira os dados, realize o Pix e marque como pago anexando o
            comprovante. A plataforma enviara o arquivo ao profissional por
            e-mail.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Metric label="Pendentes" value={summary.pendingCount.toString()} />
          <Metric label="A transferir" value={formatMoney(summary.pendingAmount)} />
          <Metric label="Transferido" value={formatMoney(summary.completedAmount)} />
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-slate-900 p-4">
        <form
          method="get"
          className="grid gap-3 lg:grid-cols-[1.6fr_0.8fr_0.8fr_auto_auto]"
        >
          <input type="hidden" name="status" value={query.status} />
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              name="q"
              defaultValue={query.search}
              placeholder="Buscar por ID real, email, PIX, transacao..."
              className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 pl-9 pr-3 text-sm text-white outline-none transition-colors placeholder:text-slate-600 focus:border-emerald-300"
            />
          </label>
          <input
            type="date"
            name="dateFrom"
            defaultValue={query.dateFrom}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-emerald-300"
          />
          <input
            type="date"
            name="dateTo"
            defaultValue={query.dateTo}
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-bold text-slate-300 outline-none focus:border-emerald-300"
          />
          <button
            type="submit"
            className="h-11 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-black transition-colors hover:bg-emerald-400"
          >
            Aplicar
          </button>
          <Link
            href="/dashboard/admin/financeiro"
            className="h-11 rounded-xl border border-white/10 bg-slate-950 px-4 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-800"
          >
            Limpar
          </Link>
        </form>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => {
          const count =
            filter.value === "ALL"
              ? Object.values(summary.statusCounts).reduce(
                  (total, value) => total + value,
                  0,
                )
              : summary.statusCounts[filter.value] || 0;

          return (
            <Link
              key={filter.value}
              href={queryHref({ status: filter.value })}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
                query.status === filter.value
                  ? "border-emerald-400 bg-emerald-400 text-black"
                  : "border-white/10 bg-slate-900 text-slate-300 hover:border-white/20 hover:bg-slate-800"
              }`}
            >
              {filter.label} ({count})
            </Link>
          );
        })}
      </div>

      {withdrawals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-12 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">
            Nenhum registro neste filtro
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Use os filtros acima para alternar entre pendencias e historico.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-white/5 bg-slate-900 shadow-lg shadow-black/10">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="border-b border-white/5 bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Data</th>
                  <th className="px-5 py-4">Profissional</th>
                  <th className="px-5 py-4">Valor</th>
                  <th className="px-5 py-4">Chave PIX</th>
                  <th className="px-5 py-4">Tipo</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Auditoria</th>
                  <th className="px-5 py-4 text-right">Acao</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {withdrawals.map((withdrawal) => (
                  <tr
                    key={withdrawal.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-4 text-slate-300">
                      <p>{formatDate(withdrawal.requestedAt)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Prazo: {formatDate(withdrawal.dueAt)}
                      </p>
                      {deadlineLabel(withdrawal.dueAt, withdrawal.status) && (
                        <p
                          className={`mt-1 text-xs font-bold ${new Date(withdrawal.dueAt) < new Date() ? "text-red-300" : "text-amber-300"}`}
                        >
                          {deadlineLabel(withdrawal.dueAt, withdrawal.status)}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-white">
                        {withdrawal.user.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        {withdrawal.user.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-bold text-emerald-300">
                        <CircleDollarSign className="h-4 w-4" />
                        {formatMoney(withdrawal.amount)}
                      </div>
                    </td>
                    <td className="max-w-[260px] px-5 py-4">
                      <div className="flex items-center gap-2">
                        <p
                          className="break-all font-mono text-slate-200"
                          title={withdrawal.pixKey}
                        >
                          {withdrawal.pixKey}
                        </p>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyPixKey(withdrawal.id, withdrawal.pixKey)
                          }
                          className="shrink-0 rounded-lg border border-white/10 bg-slate-950 p-2 text-slate-400 transition-colors hover:border-emerald-500/30 hover:text-emerald-300"
                          aria-label="Copiar chave Pix"
                          title="Copiar chave Pix"
                        >
                          {copiedWithdrawalId === withdrawal.id ? (
                            <CheckCircle2 className="h-3.5 w-3.5" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full border border-white/10 bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-300">
                        {withdrawal.pixKeyType}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-bold ${
                          statusClasses[withdrawal.status] ??
                          "border-white/10 bg-slate-800 text-slate-300"
                        }`}
                      >
                        {statusLabels[withdrawal.status] ?? withdrawal.status}
                      </span>
                      {withdrawal.processedAt && (
                        <p className="mt-2 text-xs text-slate-500">
                          Pago em {formatDate(withdrawal.processedAt)}
                        </p>
                      )}
                      {withdrawal.providerRef && (
                        <p className="mt-1 max-w-[180px] truncate font-mono text-xs text-slate-400">
                          Operação: {withdrawal.providerRef}
                        </p>
                      )}
                      {withdrawal.failureReason && (
                        <p className="mt-1 max-w-[180px] text-xs text-red-300">
                          {withdrawal.failureReason}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {withdrawal.auditLog ? (
                        <div className="max-w-[260px]">
                          <p className="font-bold text-slate-200">
                            {withdrawal.auditLog.actorName ||
                              "Administrador"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDate(withdrawal.auditLog.createdAt)}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {withdrawal.auditLog.reason ||
                              "Motivo nao informado"}
                          </p>
                          {withdrawal.auditLog.receiptUrl ? (
                            <div className="mt-2 space-y-2">
                              <a
                                href={withdrawal.auditLog.receiptUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs font-bold text-emerald-300 hover:text-emerald-200"
                              >
                                Ver comprovante
                              </a>
                              {withdrawal.status === "COMPLETED" && (
                                <>
                                  {withdrawal.receiptEmailSentAt ? (
                                    <p className="flex items-center gap-1.5 text-xs text-emerald-300">
                                      <Mail className="h-3.5 w-3.5" />
                                      Enviado em {formatDate(
                                        withdrawal.receiptEmailSentAt,
                                      )}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-amber-300">
                                      Comprovante ainda não enviado por e-mail.
                                    </p>
                                  )}
                                  {withdrawal.receiptEmailFailureReason && (
                                    <p className="text-xs text-red-300">
                                      Falha no e-mail: {withdrawal.receiptEmailFailureReason}
                                    </p>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleResendReceiptEmail(withdrawal.id)
                                    }
                                    disabled={emailingId === withdrawal.id}
                                    className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500 hover:text-black disabled:cursor-wait disabled:opacity-60"
                                  >
                                    {emailingId === withdrawal.id ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Mail className="h-3.5 w-3.5" />
                                    )}
                                    Reenviar por e-mail
                                  </button>
                                </>
                              )}
                            </div>
                          ) : withdrawal.status === "COMPLETED" ? (
                            <form
                              onSubmit={handleReceiptUpload}
                              className="mt-2 flex max-w-[240px] flex-col gap-2"
                            >
                              <input
                                type="hidden"
                                name="withdrawalId"
                                value={withdrawal.id}
                              />
                              <input
                                name="receipt"
                                type="file"
                                accept="application/pdf,image/png,image/jpeg,image/webp"
                                required
                                className="block w-full text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-xs file:font-bold file:text-slate-200 hover:file:bg-slate-700"
                              />
                              <button
                                type="submit"
                                disabled={
                                  uploadingWithdrawalId === withdrawal.id
                                }
                                className="inline-flex items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500 hover:text-black disabled:cursor-wait disabled:opacity-60"
                              >
                                {uploadingWithdrawalId === withdrawal.id
                                  ? "Anexando..."
                                  : "Anexar comprovante"}
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ) : withdrawal.status === "COMPLETED" ? (
                        <form
                          onSubmit={handleReceiptUpload}
                          className="flex max-w-[240px] flex-col gap-2"
                        >
                          <p className="text-xs text-amber-300">
                            Pagamento antigo sem comprovante armazenado.
                          </p>
                          <input
                            type="hidden"
                            name="withdrawalId"
                            value={withdrawal.id}
                          />
                          <input
                            name="receipt"
                            type="file"
                            accept="application/pdf,image/png,image/jpeg,image/webp"
                            required
                            className="block w-full text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-xs file:font-bold file:text-slate-200 hover:file:bg-slate-700"
                          />
                          <button
                            type="submit"
                            disabled={uploadingWithdrawalId === withdrawal.id}
                            className="inline-flex items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500 hover:text-black disabled:cursor-wait disabled:opacity-60"
                          >
                            {uploadingWithdrawalId === withdrawal.id
                              ? "Anexando..."
                              : "Anexar e enviar"}
                          </button>
                        </form>
                      ) : (
                        <span className="text-xs text-slate-600">
                          Sem log formal
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {["PENDING", "PROCESSING"].includes(
                        withdrawal.status,
                      ) ? (
                        <div className="ml-auto flex max-w-[260px] flex-col gap-2">
                          <form
                            onSubmit={(event) =>
                              handleApprove(event, withdrawal.id)
                            }
                            className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-left"
                          >
                            <input
                              type="hidden"
                              name="withdrawalId"
                              value={withdrawal.id}
                            />
                            <div>
                              <p className="text-xs font-bold text-emerald-300">
                                Depois de realizar o Pix
                              </p>
                              <p className="mt-1 text-[11px] leading-4 text-slate-400">
                                Informe a identificacao, anexe o comprovante e
                                marque o saque como pago.
                              </p>
                            </div>
                            <label className="block">
                              <span className="mb-1 block text-[11px] font-bold text-slate-300">
                                ID/E2E da transferencia
                              </span>
                              <input
                                name="providerRef"
                                type="text"
                                required
                                minLength={5}
                                maxLength={120}
                                placeholder="Ex.: E123..."
                                className="h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-xs text-white outline-none focus:border-emerald-400"
                              />
                            </label>
                            <label className="block">
                              <span className="mb-1 block text-[11px] font-bold text-slate-300">
                                Comprovante
                              </span>
                              <input
                                name="receipt"
                                type="file"
                                required
                                accept="application/pdf,image/png,image/jpeg,image/webp"
                                className="block w-full text-xs text-slate-400 file:mr-2 file:rounded-lg file:border-0 file:bg-slate-800 file:px-2 file:py-1 file:text-xs file:font-bold file:text-slate-200"
                              />
                            </label>
                            <label className="flex items-start gap-2 rounded-lg border border-white/10 bg-slate-950/70 p-2 text-[11px] leading-4 text-slate-300">
                              <input
                                type="checkbox"
                                name="paymentConfirmed"
                                value="true"
                                required
                                className="mt-0.5 h-3.5 w-3.5 accent-emerald-500"
                              />
                              Confirmo que o Pix ja foi realizado para esta
                              chave e neste valor.
                            </label>
                            <button
                              type="submit"
                              disabled={approvingId === withdrawal.id}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-bold text-black hover:bg-emerald-400 disabled:cursor-wait disabled:opacity-60"
                            >
                              {approvingId === withdrawal.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="h-4 w-4" />
                              )}
                              Marcar como pago
                            </button>
                          </form>
                          <textarea
                            value={withdrawalReasons[withdrawal.id] ?? ""}
                            onChange={(event) =>
                              setWithdrawalReasons((current) => ({
                                ...current,
                                [withdrawal.id]: event.target.value,
                              }))
                            }
                            placeholder="Motivo para reprovar ou cancelar"
                            className="min-h-[72px] resize-none rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white outline-none transition-colors placeholder:text-slate-600 focus:border-red-300"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                handleReject(withdrawal.id, "FAILED")
                              }
                              disabled={
                                rejectingId === `FAILED:${withdrawal.id}`
                              }
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 transition-colors hover:bg-red-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
                            >
                              {rejectingId === `FAILED:${withdrawal.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              Reprovar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleReject(withdrawal.id, "CANCELED")
                              }
                              disabled={
                                rejectingId === `CANCELED:${withdrawal.id}`
                              }
                              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-500/20 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 transition-colors hover:bg-slate-700 disabled:cursor-wait disabled:opacity-60"
                            >
                              {rejectingId === `CANCELED:${withdrawal.id}` ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-500">
                          Sem acao pendente
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {pagination.totalPages > 1 && (
        <nav className="flex items-center justify-between gap-4 text-sm">
          <Link
            href={queryHref({ page: Math.max(1, pagination.page - 1) })}
            aria-disabled={pagination.page === 1}
            className={`rounded-xl border px-4 py-2 font-bold ${pagination.page === 1 ? "pointer-events-none border-white/5 text-slate-700" : "border-white/10 text-slate-300 hover:bg-slate-800"}`}
          >
            Anterior
          </Link>
          <span className="text-slate-400">
            Pagina {pagination.page} de {pagination.totalPages} —{" "}
            {pagination.totalItems} resultado(s)
          </span>
          <Link
            href={queryHref({
              page: Math.min(pagination.totalPages, pagination.page + 1),
            })}
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-900 px-4 py-3 text-right">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}
