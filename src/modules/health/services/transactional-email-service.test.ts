import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { EmailOutboxDatabaseClient } from "@/modules/email/services/email-outbox-service";
import {
  enqueueCancellationEmails,
  enqueueHealthOperationalAttentionEmail,
  enqueuePaymentConfirmedEmails,
  enqueueRefundProcessedEmail,
  ensureAppointmentPaymentConfirmedEmails,
} from "./transactional-email-service";

function makeClient(existing: unknown = null) {
  return {
    emailOutbox: {
      findUnique: vi.fn().mockResolvedValue(existing),
      create: vi
        .fn()
        .mockImplementation(({ data }) => ({ id: "email_1", ...data })),
    },
    emailDeliveryAttempt: {},
  } as unknown as EmailOutboxDatabaseClient;
}

const appointment = {
  appointmentId: "appointment_1",
  patient: {
    id: "patient_1",
    email: "PATIENT@example.com",
    name: "Paciente",
  },
  professional: {
    id: "professional_1",
    email: "professional@example.com",
    displayName: "Profissional",
  },
  date: new Date("2026-09-10T00:00:00.000Z"),
  time: "10:00",
  price: 150,
};

describe("health transactional email service", () => {
  it("carrega a consulta paga e registra os dois e-mails pela mesma transacao", async () => {
    const emailClient = makeClient();
    const appointmentFindUnique = vi.fn().mockResolvedValue({
      id: appointment.appointmentId,
      status: "MEETING_PENDING",
      paymentConfirmedAt: new Date("2026-08-26T12:00:00.000Z"),
      date: appointment.date,
      time: appointment.time,
      price: appointment.price,
      patient: appointment.patient,
      professional: appointment.professional,
    });
    const client = {
      ...emailClient,
      appointment: { findUnique: appointmentFindUnique },
    } as unknown as Parameters<
      typeof ensureAppointmentPaymentConfirmedEmails
    >[0];

    await ensureAppointmentPaymentConfirmedEmails(
      client,
      appointment.appointmentId,
    );

    expect(appointmentFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: appointment.appointmentId } }),
    );
    expect(emailClient.emailOutbox.create).toHaveBeenCalledTimes(2);
  });

  it("registra a confirmacao para paciente e profissional sem expor o Meet", async () => {
    const client = makeClient();

    await enqueuePaymentConfirmedEmails(client, appointment);

    expect(client.emailOutbox.create).toHaveBeenCalledTimes(2);
    expect(client.emailOutbox.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey:
            "HEALTH_APPOINTMENT_CONFIRMED:appointment_1:patient_1",
          recipientEmail: "patient@example.com",
          templateKey: "health.appointment.confirmed",
          payload: expect.objectContaining({
            actionPath: "/agendar-consulta/historico",
          }),
        }),
      }),
    );
    expect(client.emailOutbox.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey:
            "HEALTH_APPOINTMENT_CONFIRMED:appointment_1:professional_1",
          recipientEmail: "professional@example.com",
          payload: expect.objectContaining({
            actionPath: "/agendar-consulta/dashboard-profissional",
          }),
        }),
      }),
    );
    expect(
      JSON.stringify(vi.mocked(client.emailOutbox.create).mock.calls),
    ).not.toContain("meet.google.com");
  });

  it("registra o cancelamento para os dois participantes", async () => {
    const client = makeClient();

    await enqueueCancellationEmails(client, {
      ...appointment,
      cancellationEventId: "cancellation_1",
      canceledBy: "patient",
      refundRequested: true,
      reason: "Imprevisto",
    });

    expect(client.emailOutbox.create).toHaveBeenCalledTimes(2);
    expect(client.emailOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        eventType: "HEALTH_APPOINTMENT_CANCELED",
        templateKey: "health.appointment.canceled",
      }),
    });
  });

  it("nao duplica a confirmacao de reembolso recebida por mais de um webhook", async () => {
    const existing = { id: "existing_email" };
    const client = makeClient(existing);

    const result = await enqueueRefundProcessedEmail(client, {
      ...appointment,
      refundId: "refund_1",
    });

    expect(result).toEqual({ email: existing, created: false });
    expect(client.emailOutbox.findUnique).toHaveBeenCalledWith({
      where: {
        idempotencyKey:
          "HEALTH_REFUND_PROCESSED:appointment_1:patient_1",
      },
    });
    expect(client.emailOutbox.create).not.toHaveBeenCalled();
  });

  it("prioriza alertas operacionais e direciona o admin ao painel", async () => {
    const client = makeClient();

    await enqueueHealthOperationalAttentionEmail(client, {
      eventType: "HEALTH_MEETING_REQUIRES_ATTENTION",
      entityType: "APPOINTMENT",
      entityId: "appointment_1",
      appointmentId: "appointment_1",
      title: "Sala exige atencao",
      summary: "A sala nao ficou pronta no limite operacional.",
      recipient: {
        id: "admin_1",
        email: "admin@example.com",
        name: "Administrador",
      },
    });

    expect(client.emailOutbox.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        priority: 20,
        templateKey: "health.operational.attention",
        payload: expect.objectContaining({
          actionPath: "/dashboard/admin/reconciliacoes",
        }),
      }),
    });
  });
});
