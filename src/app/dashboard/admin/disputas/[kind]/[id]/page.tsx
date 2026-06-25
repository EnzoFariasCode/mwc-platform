import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, ReceiptText, ShieldCheck } from "lucide-react";
import { PageContainer } from "@/modules/dashboard/components/PageContainer";
import { requireAdminRole } from "@/lib/get-session";
import { formatCurrencyBR, formatDateTimeBR } from "@/lib/formatters";
import { db } from "@/lib/prisma";
import { getAdminAuditLogs } from "@/modules/admin/actions/audit-log";

type PageProps = {
  params: Promise<{ kind: string; id: string }>;
};

function formatMoney(amount: number | null) {
  return formatCurrencyBR(amount);
}

function formatDate(value: Date | string | null | undefined) {
  return formatDateTimeBR(value);
}

function textOrFallback(value: string | null | undefined) {
  return value && value.trim() ? value : "Nao informado";
}

function extractResolutionLabel(value: string | null | undefined) {
  if (!value) return "Sem decisao registrada";
  if (value.includes("DISPUTE_RESOLVED_REFUND")) return "Reembolso aprovado";
  if (value.includes("DISPUTE_RESOLVED_RELEASE")) {
    return "Pagamento liberado ao profissional";
  }
  return value;
}

export default async function AdminDisputeDetailPage({ params }: PageProps) {
  await requireAdminRole(["OWNER", "SUPPORT"]);

  const { kind, id } = await params;
  const normalizedKind = kind.toLowerCase();

  if (normalizedKind === "tech") {
    return <TechDisputeDetail id={id} />;
  }

  if (normalizedKind === "health") {
    return <HealthDisputeDetail id={id} />;
  }

  notFound();
}

async function TechDisputeDetail({ id }: { id: string }) {
  const [project, transactions, chargebackLiabilities, auditLogs] =
    await Promise.all([
    db.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            state: true,
            createdAt: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            jobTitle: true,
            city: true,
            state: true,
            createdAt: true,
          },
        },
        proposals: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            price: true,
            estimatedDays: true,
            coverLetter: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            professional: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        deliverables: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            description: true,
            fileUrl: true,
            link: true,
            createdAt: true,
            sender: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    db.transaction.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        amount: true,
        type: true,
        status: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    }),
    db.techChargebackLiability.findMany({
      where: { projectId: id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        stripeDisputeId: true,
        stripePaymentId: true,
        grossAmount: true,
        professionalAmount: true,
        recoveredAmount: true,
        outstandingAmount: true,
        status: true,
        reason: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    getAdminAuditLogs({ entityType: "TECH_PROJECT", entityId: id }),
  ]);

  if (!project) notFound();

  const disputeEvents = project.deliverables.filter((item) =>
    item.description?.startsWith("DISPUTE_"),
  );
  const openedEvent = disputeEvents.find((item) =>
    item.description?.startsWith("DISPUTE_OPENED"),
  );
  const resolvedEvent = disputeEvents.find((item) =>
    item.description?.startsWith("DISPUTE_RESOLVED"),
  );
  const attachments = JSON.stringify(project.attachments ?? [], null, 2);

  return (
    <PageContainer>
      <DetailShell
        title={project.title}
        subtitle="Detalhes completos da disputa Tech"
        status={project.status}
        backHref="/dashboard/admin/disputas"
      >
        <SummaryGrid>
          <InfoCard label="ID real do projeto" value={project.id} mono />
          <InfoCard label="Status" value={project.status} />
          <InfoCard label="Criado em" value={formatDate(project.createdAt)} />
          <InfoCard label="Atualizado em" value={formatDate(project.updatedAt)} />
          <InfoCard
            label="Orcamento inicial"
            value={formatMoney(project.budgetValue.toNumber())}
          />
          <InfoCard
            label="Valor acordado"
            value={formatMoney(project.agreedPrice?.toNumber() ?? null)}
          />
          <InfoCard
            label="Stripe Session"
            value={project.stripeSessionId ?? "Nao informado"}
            mono
          />
          <InfoCard
            label="PaymentIntent"
            value={project.stripePaymentIntentId ?? "Nao informado"}
            mono
          />
        </SummaryGrid>

        <TwoColumns>
          <Section title="Cliente">
            <PersonDetails
              id={project.owner.id}
              name={project.owner.name}
              email={project.owner.email}
              phone={project.owner.phone}
              location={[project.owner.city, project.owner.state]
                .filter(Boolean)
                .join(" / ")}
              createdAt={project.owner.createdAt}
            />
          </Section>

          <Section title="Profissional">
            {project.professional ? (
              <PersonDetails
                id={project.professional.id}
                name={project.professional.name}
                email={project.professional.email}
                phone={project.professional.phone}
                role={project.professional.jobTitle}
                location={[project.professional.city, project.professional.state]
                  .filter(Boolean)
                  .join(" / ")}
                createdAt={project.professional.createdAt}
              />
            ) : (
              <EmptyText>Nenhum profissional vinculado.</EmptyText>
            )}
          </Section>
        </TwoColumns>

        <Section title="Projeto">
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoCard label="Categoria" value={project.category} />
            <InfoCard label="Prazo" value={project.deadline} />
            <InfoCard label="Propostas" value={project.bidsCount.toString()} />
          </div>
          <TextBlock label="Descricao" value={project.description} />
          <TextBlock label="Tags" value={project.tags.join(", ") || null} />
          <TextBlock label="Anexos do pedido" value={attachments} mono />
        </Section>

        <Section title="Disputa">
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoCard
              label="Abertura"
              value={formatDate(openedEvent?.createdAt ?? project.disputeOpenedAt)}
            />
            <InfoCard
              label="Resolucao"
              value={formatDate(
                resolvedEvent?.createdAt ?? project.disputeResolvedAt,
              )}
            />
            <InfoCard
              label="Decisao"
              value={extractResolutionLabel(
                resolvedEvent?.description ?? project.disputeResolution,
              )}
            />
          </div>
          <TextBlock
            label="Motivo informado"
            value={openedEvent?.description?.replace(
              /^DISPUTE_OPENED\s*-\s*/,
              "",
            ) ?? project.disputeReason}
          />
          <TextBlock
            label="Motivo da decisao"
            value={
              resolvedEvent?.description?.replace(
                /^DISPUTE_RESOLVED_(REFUND|RELEASE)\s*-\s*/,
                "",
              ) ?? project.disputeResolution
            }
          />
          <TextBlock
            label="Payload resumido Stripe"
            value={project.disputeResolution}
            mono
          />
        </Section>

        <Section title="Auditoria formal">
          <AuditLogList logs={auditLogs} />
        </Section>

        <Section title="Responsabilidade financeira">
          <ChargebackLiabilityList
            liabilities={chargebackLiabilities.map((liability) => ({
              ...liability,
              grossAmount: liability.grossAmount.toNumber(),
              professionalAmount: liability.professionalAmount.toNumber(),
              recoveredAmount: liability.recoveredAmount.toNumber(),
              outstandingAmount: liability.outstandingAmount.toNumber(),
            }))}
          />
        </Section>

        <Section title="Transacoes financeiras">
          <TransactionTable
            transactions={transactions.map((transaction) => ({
              ...transaction,
              amount: transaction.amount.toNumber(),
            }))}
          />
        </Section>

        <Section title="Propostas">
          {project.proposals.length === 0 ? (
            <EmptyText>Nenhuma proposta registrada.</EmptyText>
          ) : (
            <div className="space-y-3">
              {project.proposals.map((proposal) => (
                <TimelineItem
                  key={proposal.id}
                  title={`${proposal.status} - ${formatMoney(
                    proposal.price.toNumber(),
                  )}`}
                  meta={`${proposal.professional.name || "Profissional"} - ${
                    proposal.professional.email || "Sem email"
                  } - ${formatDate(proposal.createdAt)}`}
                  body={`Prazo: ${proposal.estimatedDays} dias\n${proposal.coverLetter}`}
                />
              ))}
            </div>
          )}
        </Section>

        <Section title="Entregas e eventos">
          {project.deliverables.length === 0 ? (
            <EmptyText>Nenhuma entrega ou evento registrado.</EmptyText>
          ) : (
            <div className="space-y-3">
              {project.deliverables.map((deliverable) => (
                <TimelineItem
                  key={deliverable.id}
                  title={deliverable.sender.name || "Usuario"}
                  meta={`${deliverable.sender.email || "Sem email"} - ${formatDate(
                    deliverable.createdAt,
                  )}`}
                  body={deliverable.description || "Sem descricao."}
                  link={deliverable.link || deliverable.fileUrl}
                />
              ))}
            </div>
          )}
        </Section>
      </DetailShell>
    </PageContainer>
  );
}

async function HealthDisputeDetail({ id }: { id: string }) {
  const [appointment, auditLogs] = await Promise.all([
    db.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            city: true,
            state: true,
            createdAt: true,
          },
        },
        professional: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            jobTitle: true,
            documentReg: true,
            city: true,
            state: true,
            createdAt: true,
          },
        },
        serviceType: {
          select: {
            name: true,
            duration: true,
            price: true,
          },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            amount: true,
            type: true,
            status: true,
            description: true,
            createdAt: true,
            updatedAt: true,
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    }),
    getAdminAuditLogs({ entityType: "HEALTH_APPOINTMENT", entityId: id }),
  ]);

  if (!appointment) notFound();

  const resolutionLabel = extractResolutionLabel(appointment.notes);
  const resolutionReason =
    appointment.notes?.match(/Motivo:\s*([^.\n]+)/)?.[1]?.trim() ?? null;

  return (
    <PageContainer>
      <DetailShell
        title={`Consulta ${appointment.shortId || appointment.id.slice(0, 8)}`}
        subtitle="Detalhes completos da disputa Health"
        status={appointment.status}
        backHref="/dashboard/admin/disputas"
      >
        <SummaryGrid>
          <InfoCard label="ID real da consulta" value={appointment.id} mono />
          <InfoCard label="Codigo publico" value={appointment.shortId} mono />
          <InfoCard label="Status" value={appointment.status} />
          <InfoCard label="Data" value={formatDate(appointment.date)} />
          <InfoCard label="Horario" value={appointment.time} />
          <InfoCard
            label="Valor"
            value={formatMoney(appointment.price.toNumber())}
          />
        </SummaryGrid>

        <TwoColumns>
          <Section title="Paciente">
            <PersonDetails
              id={appointment.patient.id}
              name={appointment.patient.name}
              email={appointment.patient.email}
              phone={appointment.patient.phone}
              location={[appointment.patient.city, appointment.patient.state]
                .filter(Boolean)
                .join(" / ")}
              createdAt={appointment.patient.createdAt}
            />
          </Section>

          <Section title="Profissional">
            <PersonDetails
              id={appointment.professional.id}
              name={appointment.professional.name}
              email={appointment.professional.email}
              phone={appointment.professional.phone}
              role={
                appointment.professional.documentReg ||
                appointment.professional.jobTitle
              }
              location={[
                appointment.professional.city,
                appointment.professional.state,
              ]
                .filter(Boolean)
                .join(" / ")}
              createdAt={appointment.professional.createdAt}
            />
          </Section>
        </TwoColumns>

        <Section title="Consulta">
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoCard
              label="Servico"
              value={appointment.serviceType?.name ?? "Nao informado"}
            />
            <InfoCard
              label="Duracao"
              value={
                appointment.serviceType?.duration
                  ? `${appointment.serviceType.duration} min`
                  : "Nao informado"
              }
            />
            <InfoCard
              label="Link da sala"
              value={appointment.meetLink ?? "Nao informado"}
              mono
            />
          </div>
          <TextBlock label="Stripe Session" value={appointment.stripeSessionId} mono />
          <TextBlock label="Observacoes" value={appointment.notes} />
        </Section>

        <Section title="Disputa">
          <div className="grid gap-4 lg:grid-cols-3">
            <InfoCard
              label="Abertura"
              value={formatDate(appointment.disputeOpenedAt)}
            />
            <InfoCard label="Decisao" value={resolutionLabel} />
            <InfoCard
              label="Atualizada em"
              value={formatDate(appointment.updatedAt)}
            />
          </div>
          <TextBlock label="Motivo informado" value={appointment.disputeReason} />
          <TextBlock label="Motivo da decisao" value={resolutionReason} />
        </Section>

        <Section title="Auditoria formal">
          <AuditLogList logs={auditLogs} />
        </Section>

        <Section title="Transacoes financeiras">
          <TransactionTable
            transactions={appointment.transactions.map((transaction) => ({
              ...transaction,
              amount: transaction.amount.toNumber(),
            }))}
          />
        </Section>
      </DetailShell>
    </PageContainer>
  );
}

function DetailShell({
  title,
  subtitle,
  status,
  backHref,
  children,
}: {
  title: string;
  subtitle: string;
  status: string;
  backHref: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <Link
            href={backHref}
            className="mb-4 inline-flex items-center gap-2 text-sm font-bold text-slate-400 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para mediacao
          </Link>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-red-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Detalhe administrativo
          </div>
          <h1 className="max-w-4xl text-2xl font-bold text-white font-futura">
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
        </div>
        <span className="rounded-full border border-white/10 bg-slate-900 px-4 py-2 text-xs font-bold uppercase text-slate-300">
          {status}
        </span>
      </div>
      {children}
    </div>
  );
}

function SummaryGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{children}</div>;
}

function TwoColumns({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 xl:grid-cols-2">{children}</div>;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-white/5 bg-slate-900 p-6 shadow-lg shadow-black/10">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {children}
    </section>
  );
}

function InfoCard({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-950 px-4 py-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p
        className={`mt-1 break-words text-sm font-bold text-white ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function TextBlock({
  label,
  value,
  mono,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-950/70 p-4">
      <p className="mb-1 text-xs font-bold uppercase text-slate-500">{label}</p>
      <p
        className={`whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-300 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {textOrFallback(value)}
      </p>
    </div>
  );
}

function PersonDetails({
  id,
  name,
  email,
  phone,
  role,
  location,
  createdAt,
}: {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null;
  role?: string | null;
  location?: string;
  createdAt: Date;
}) {
  return (
    <div className="grid gap-3">
      <InfoCard label="ID" value={id} mono />
      <InfoCard label="Nome" value={textOrFallback(name)} />
      <InfoCard label="Email" value={textOrFallback(email)} mono />
      <InfoCard label="Telefone" value={textOrFallback(phone)} />
      <InfoCard label="Perfil" value={textOrFallback(role)} />
      <InfoCard label="Localizacao" value={textOrFallback(location)} />
      <InfoCard label="Conta criada" value={formatDate(createdAt)} />
    </div>
  );
}

function AuditLogList({
  logs,
}: {
  logs: Array<{
    id: string;
    action: string;
    reason: string | null;
    receiptUrl: string | null;
    metadata: unknown;
    createdAt: Date;
    actor: {
      id: string;
      name: string | null;
      email: string | null;
    };
  }>;
}) {
  if (logs.length === 0) {
    return <EmptyText>Nenhum registro formal de auditoria ainda.</EmptyText>;
  }

  return (
    <div className="space-y-3">
      {logs.map((log) => (
        <article
          key={log.id}
          className="rounded-xl border border-white/5 bg-slate-950 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-emerald-300">
                {formatAuditAction(log.action)}
              </p>
              <h3 className="mt-1 font-bold text-white">
                {log.actor.name || "Administrador"}
              </h3>
              <p className="text-xs text-slate-500">
                {log.actor.email || "Sem email"} - {formatDate(log.createdAt)}
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs font-bold text-slate-300">
              {log.action}
            </span>
          </div>

          <TextBlock label="Motivo registrado" value={log.reason} />

          {log.receiptUrl ? (
            <a
              href={log.receiptUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500 hover:text-black"
            >
              Ver comprovante PIX
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : (
            <p className="mt-3 text-xs font-bold text-slate-500">
              Sem comprovante PIX anexado.
            </p>
          )}

          <TextBlock
            label="Metadados"
            value={JSON.stringify(log.metadata ?? {}, null, 2)}
            mono
          />
        </article>
      ))}
    </div>
  );
}

function formatAuditAction(action: string) {
  const labels: Record<string, string> = {
    TECH_DISPUTE_REFUND_CLIENT: "Reembolso Tech aprovado",
    TECH_DISPUTE_RELEASE_PROFESSIONAL: "Pagamento Tech liberado",
    HEALTH_DISPUTE_REFUND_PATIENT: "Reembolso Health aprovado",
    HEALTH_DISPUTE_RELEASE_PROFESSIONAL: "Pagamento Health liberado",
    PIX_WITHDRAWAL_MARK_COMPLETED: "Saque PIX transferido",
    PIX_WITHDRAWAL_REJECTED: "Saque PIX reprovado",
    PIX_WITHDRAWAL_CANCELED: "Saque PIX cancelado",
    PIX_WITHDRAWAL_RECEIPT_ATTACHED: "Comprovante PIX anexado",
    USER_ACCOUNT_SUSPENDED: "Usuario suspenso",
    USER_ACCOUNT_REACTIVATED: "Usuario reativado",
  };

  return labels[action] ?? action;
}

function ChargebackLiabilityList({
  liabilities,
}: {
  liabilities: Array<{
    id: string;
    stripeDisputeId: string;
    stripePaymentId: string | null;
    grossAmount: number;
    professionalAmount: number;
    recoveredAmount: number;
    outstandingAmount: number;
    status: string;
    reason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
}) {
  if (liabilities.length === 0) {
    return (
      <EmptyText>
        Nenhuma responsabilidade financeira de chargeback registrada.
      </EmptyText>
    );
  }

  return (
    <div className="space-y-3">
      {liabilities.map((liability) => (
        <article
          key={liability.id}
          className="rounded-xl border border-red-500/10 bg-red-950/10 p-4"
        >
          <div className="grid gap-4 lg:grid-cols-4">
            <InfoCard label="Status" value={liability.status} />
            <InfoCard
              label="Valor profissional"
              value={formatMoney(liability.professionalAmount)}
            />
            <InfoCard
              label="Recuperado"
              value={formatMoney(liability.recoveredAmount)}
            />
            <InfoCard
              label="Pendente"
              value={formatMoney(liability.outstandingAmount)}
            />
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <InfoCard
              label="Stripe Dispute"
              value={liability.stripeDisputeId}
              mono
            />
            <InfoCard
              label="PaymentIntent"
              value={liability.stripePaymentId ?? "Nao informado"}
              mono
            />
          </div>
          <TextBlock label="Motivo e contexto" value={liability.reason} mono />
          <p className="mt-3 text-xs font-bold text-slate-500">
            Criado em {formatDate(liability.createdAt)} - Atualizado em{" "}
            {formatDate(liability.updatedAt)}
          </p>
        </article>
      ))}
    </div>
  );
}

function TransactionTable({
  transactions,
}: {
  transactions: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    user: {
      name: string | null;
      email: string | null;
    };
  }>;
}) {
  if (transactions.length === 0) {
    return <EmptyText>Nenhuma transacao vinculada.</EmptyText>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead className="bg-slate-950 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Data</th>
              <th className="px-4 py-3">Usuario</th>
              <th className="px-4 py-3">Valor</th>
              <th className="px-4 py-3">Tipo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Descricao</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3 text-slate-300">
                  {formatDate(transaction.createdAt)}
                </td>
                <td className="px-4 py-3">
                  <p className="font-bold text-white">
                    {transaction.user.name || "Usuario"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {transaction.user.email || "Sem email"}
                  </p>
                </td>
                <td className="px-4 py-3 font-bold text-white">
                  {formatMoney(transaction.amount)}
                </td>
                <td className="px-4 py-3 text-slate-300">{transaction.type}</td>
                <td className="px-4 py-3 text-slate-300">{transaction.status}</td>
                <td className="px-4 py-3 text-slate-400">
                  {transaction.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TimelineItem({
  title,
  meta,
  body,
  link,
}: {
  title: string;
  meta: string;
  body: string;
  link?: string | null;
}) {
  return (
    <article className="rounded-xl border border-white/5 bg-slate-950 p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-500">{meta}</p>
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-emerald-200"
          >
            Abrir anexo
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-300">
        {body}
      </p>
    </article>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/70 p-6 text-center text-sm text-slate-400">
      <ReceiptText className="mx-auto mb-2 h-5 w-5 text-slate-500" />
      {children}
    </div>
  );
}
