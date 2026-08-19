import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let professional = {
    id: "teacher-1",
    name: "Professor Teste",
    displayName: "Professor Teste",
    bio: "Professor de fisica.",
    approach: "Aulas praticas.",
    birthDate: new Date("1990-01-01"),
    phone: "(11) 99999-9999",
    image: null as string | null,
    profileImageBytes: new Uint8Array([1]),
    consultationFee: 100,
    sessionDuration: 50,
    timezone: "America/Sao_Paulo",
    onlineSpecialty: "TEACHER",
    teachingSubject: "Fisica" as string | null,
    documentReg: null as string | null,
    jobTitle: "Professor",
    professionalVerification: {
      specialty: "TEACHER",
      status: "APPROVED",
      expiresAt: null,
    },
    availabilities: [
      {
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "18:00",
        isActive: true,
      },
    ],
  };

  const tx = {
    appointment: { findFirst: vi.fn(async () => null) },
    appointmentHold: {
      deleteMany: vi.fn(),
      findFirst: vi.fn(async () => null),
      create: vi.fn(async () => ({ id: "hold-1", stripeSessionId: null })),
    },
  };

  const db = {
    user: { findFirst: vi.fn(async () => ({ ...professional })) },
    availabilityException: { findFirst: vi.fn(async () => null) },
    professionalAvailability: {
      findUnique: vi.fn(async () => ({
        isActive: true,
        startTime: "09:00",
        endTime: "18:00",
      })),
    },
    appointmentHold: { update: vi.fn() },
    paymentTermsAcceptance: {
      create: vi.fn(async () => ({ id: "acceptance-1" })),
      update: vi.fn(),
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(async (callback: (value: typeof tx) => unknown) =>
      callback(tx),
    ),
  };

  const stripe = {
    checkout: {
      sessions: {
        retrieve: vi.fn(),
        create: vi.fn(async () => ({
          id: "cs_test_teacher",
          url: "https://checkout.example/teacher",
        })),
      },
    },
  };

  return {
    db,
    stripe,
    reset() {
      professional = {
        id: "teacher-1",
        name: "Professor Teste",
        displayName: "Professor Teste",
        bio: "Professor de fisica.",
        approach: "Aulas praticas.",
        birthDate: new Date("1990-01-01"),
        phone: "(11) 99999-9999",
        image: null,
        profileImageBytes: new Uint8Array([1]),
        consultationFee: 100,
        sessionDuration: 50,
        timezone: "America/Sao_Paulo",
        onlineSpecialty: "TEACHER",
        teachingSubject: "Fisica",
        documentReg: null,
        jobTitle: "Professor",
        professionalVerification: {
          specialty: "TEACHER",
          status: "APPROVED",
          expiresAt: null,
        },
        availabilities: [
          {
            dayOfWeek: 1,
            startTime: "09:00",
            endTime: "18:00",
            isActive: true,
          },
        ],
      };
      vi.clearAllMocks();
    },
    setTeachingSubject(value: string | null) {
      professional.teachingSubject = value;
    },
    removeAvailability() {
      professional.availabilities = [];
    },
    setVerificationStatus(value: string) {
      professional.professionalVerification.status = value;
    },
  };
});

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: { id: "patient-1", email: "patient@example.com" },
  })),
}));
vi.mock("@/lib/prisma", () => ({ db: mocks.db }));
vi.mock("@/lib/stripe", () => ({ stripe: mocks.stripe }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: vi.fn(() => null) })),
}));

import { createCheckoutSession } from "./payment-actions";

function futureDate() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

describe("checkout de Professor", () => {
  beforeEach(() => {
    mocks.reset();
    vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  it("permite Professor com materia e sem registro", async () => {
    const result = await createCheckoutSession(
      "teacher-1",
      futureDate(),
      "09:00",
      { acceptedPaymentTerms: true },
    );

    expect(result).toEqual({ url: "https://checkout.example/teacher" });
    expect(mocks.stripe.checkout.sessions.create).toHaveBeenCalledOnce();
  });

  it("rejeita chamada direta para Professor sem materia", async () => {
    mocks.setTeachingSubject(null);

    const result = await createCheckoutSession(
      "teacher-1",
      futureDate(),
      "09:00",
    );

    expect(result.error).toContain("indisponivel");
    expect(mocks.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("rejeita chamada direta para profissional sem agenda ativa", async () => {
    mocks.removeAvailability();

    const result = await createCheckoutSession(
      "teacher-1",
      futureDate(),
      "09:00",
    );

    expect(result.error).toContain("indisponivel");
    expect(mocks.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });

  it("rejeita checkout enquanto os documentos ainda nao foram aprovados", async () => {
    mocks.setVerificationStatus("UNDER_REVIEW");

    const result = await createCheckoutSession(
      "teacher-1",
      futureDate(),
      "09:00",
      { acceptedPaymentTerms: true },
    );

    expect(result.error).toContain("indisponivel");
    expect(mocks.stripe.checkout.sessions.create).not.toHaveBeenCalled();
  });
});
