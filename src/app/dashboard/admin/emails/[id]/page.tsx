import Link from "next/link";
import { ArrowLeft, CheckCircle2, ExternalLink, RotateCcw, ShieldAlert } from "lucide-react";
import { notFound } from "next/navigation";

import { retryEmailOutboxAdmin } from "@/modules/admin/actions/retry-email-outbox";
import { getAdminEmailOutboxDetail } from "@/modules/admin/services/admin-email-outbox-service";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { renderTransactionalEmailTemplate } from "@/modules/email/templates/email-template-registry";

const resultMessages: Record<string, string> = {
  "smoke-queued": "Teste operacional criado. O cron processara este e-mail em poucos minutos.",
  queued: "Nova tentativa criada e colocada na fila.",
  "already-queued": "Este envio já possui uma nova tentativa vinculada.",
  "not-retryable": "O estado atual não permite uma nova tentativa.",
  "rate-limited": "Limite operacional atingido. Aguarde alguns minutos.",
  error: "Não foi possível criar a nova tentativa.",
};

export default async function AdminEmailDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ result?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const email = await getAdminEmailOutboxDetail(id);
  if (!email) notFound();

  let rendered: { subject: string; text: string; html: string } | null = null;
  let renderError: string | null = null;
  try {
    rendered = renderTransactionalEmailTemplate({
      templateKey: email.templateKey,
      templateVersion: email.templateVersion,
      payload: email.payload,
    });
  } catch (error) {
    renderError = error instanceof Error ? error.message : "Falha ao renderizar o conteúdo.";
  }

  const links = rendered?.text.match(/https?:\/\/[^\s]+/g) ?? [];
  const expectedOrigin = (() => {
    try { return new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.maximusworldclick.com.br").origin; }
    catch { return "https://www.maximusworldclick.com.br"; }
  })();
  const safeLinks = links.filter((link) => {
    try { return new URL(link).origin === expectedOrigin; } catch { return false; }
  });
  const linksAreSafe = safeLinks.length === links.length;
  const recipientIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.recipientEmail);
  const retryable = email.status === "REQUIRES_ATTENTION" && !email.retry;

  return (
    <PageContainer>
      <div className="space-y-8">
        <Link href="/dashboard/admin/emails" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Voltar para e-mails
        </Link>

        {query.result && resultMessages[query.result] && (
          <div className="rounded-xl border border-[#d73cbe]/25 bg-[#d73cbe]/10 px-4 py-3 text-sm text-[#f0a6e5]">
            {resultMessages[query.result]}
          </div>
        )}

        <section className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#e879d8]">{email.eventType}</p>
            <h1 className="mt-2 text-2xl font-bold text-white">Detalhes do envio</h1>
            <p className="mt-2 text-sm text-slate-400">{email.recipientEmail} · {email.status}</p>
          </div>
          {retryable && (
            <form action={retryEmailOutboxAdmin}>
              <input type="hidden" name="outboxId" value={email.id} />
              <button className="inline-flex items-center gap-2 rounded-xl bg-[#d73cbe] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#bd31a7]">
                <RotateCcw className="h-4 w-4" /> Criar nova tentativa
              </button>
            </form>
          )}
        </section>

        {(email.retry || email.retryOf) && (
          <section className="rounded-xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-blue-200">
            {email.retryOf && <p>Este envio é uma nova tentativa de <Link className="font-bold underline" href={`/dashboard/admin/emails/${email.retryOf.id}`}>{email.retryOf.id}</Link>.</p>}
            {email.retry && <p>Nova tentativa vinculada: <Link className="font-bold underline" href={`/dashboard/admin/emails/${email.retry.id}`}>{email.retry.id}</Link> ({email.retry.status}).</p>}
          </section>
        )}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Info label="Criado em" value={email.createdAt.toLocaleString("pt-BR")} />
          <Info label="Tentativas" value={`${email.attemptCount}/${email.maxAttempts}`} />
          <Info label="Aceito pelo Resend" value={email.sentAt?.toLocaleString("pt-BR") || "Ainda não"} />
          <Info label="Entregue" value={email.deliveredAt?.toLocaleString("pt-BR") || "Ainda não"} />
        </section>

        {email.lastErrorMessage && (
          <section className="rounded-2xl border border-red-400/20 bg-red-400/10 p-5">
            <div className="flex gap-3"><ShieldAlert className="h-5 w-5 shrink-0 text-red-300" /><div><h2 className="font-bold text-red-100">{email.lastErrorCode || "Falha de entrega"}</h2><p className="mt-1 text-sm text-red-100/70">{email.lastErrorMessage}</p></div></div>
          </section>
        )}

        <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-5">
          <h2 className="font-bold text-white">Validação de destinatário, links e conteúdo</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Validation label="Destinatário" ok={recipientIsValid} detail={email.recipientEmail} />
            <Validation label="Links internos" ok={linksAreSafe} detail={links.length ? `${links.length} link(s) verificado(s)` : "Nenhum link no texto"} />
            <Validation label="Template" ok={Boolean(rendered)} detail={`${email.templateKey}:v${email.templateVersion}`} />
          </div>
          {renderError ? (
            <p className="mt-5 rounded-xl bg-red-400/10 p-4 text-sm text-red-300">{renderError}</p>
          ) : rendered && (
            <div className="mt-5 space-y-4">
              <div><p className="text-xs uppercase text-slate-500">Assunto</p><p className="mt-1 text-white">{rendered.subject}</p></div>
              <div><p className="text-xs uppercase text-slate-500">Conteúdo em texto</p><pre className="mt-2 max-h-96 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-slate-950 p-4 font-sans text-sm leading-6 text-slate-300">{rendered.text}</pre></div>
              {safeLinks.map((link) => <a key={link} href={link} target="_blank" rel="noreferrer" className="mr-3 inline-flex items-center gap-1 text-sm text-[#e879d8] hover:underline">Verificar link <ExternalLink className="h-3.5 w-3.5" /></a>)}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900/70">
          <div className="border-b border-white/10 p-5"><h2 className="font-bold text-white">Histórico de tentativas</h2></div>
          {email.attempts.length === 0 ? <p className="p-5 text-sm text-slate-500">Ainda não houve tentativa de processamento.</p> : (
            <div className="divide-y divide-white/5">{email.attempts.map((attempt) => <div key={attempt.id} className="grid gap-2 p-5 text-sm md:grid-cols-4"><span className="font-bold text-white">#{attempt.attemptNumber} · {attempt.outcome}</span><span className="text-slate-400">{attempt.startedAt.toLocaleString("pt-BR")}</span><span className="truncate text-slate-500">{attempt.providerMessageId || "Sem ID do provedor"}</span><span className={attempt.errorMessage ? "text-red-300" : "text-emerald-300"}>{attempt.errorMessage || "Processamento aceito"}</span></div>)}</div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}

function Info({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-white/10 bg-slate-900/70 p-4"><p className="text-xs uppercase text-slate-500">{label}</p><p className="mt-2 text-sm font-bold text-white">{value}</p></div>; }
function Validation({ label, ok, detail }: { label: string; ok: boolean; detail: string }) { return <div className="rounded-xl border border-white/10 bg-black/15 p-4"><div className="flex items-center gap-2"><CheckCircle2 className={`h-4 w-4 ${ok ? "text-emerald-300" : "text-red-300"}`} /><span className="font-bold text-white">{label}</span></div><p className="mt-2 break-all text-xs text-slate-500">{detail}</p></div>; }
