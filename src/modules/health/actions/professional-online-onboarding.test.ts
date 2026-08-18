import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let professional = {
    userType: "PROFESSIONAL",
    industry: "HEALTH",
    isActive: true,
    onlineSpecialty: "TEACHER",
    documentReg: null as string | null,
    teachingSubject: null as string | null,
    professionalVerification: { id: "verification-1", status: "DRAFT" },
  };

  const tx = {
    user: {
      update: vi.fn(async () => ({ id: "professional-1" })),
    },
    professionalVerification: {
      update: vi.fn(),
    },
    professionalAvailability: {
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
  };

  const db = {
    user: {
      findUnique: vi.fn(async () => ({ ...professional })),
    },
    $transaction: vi.fn(async (callback: (value: typeof tx) => unknown) =>
      callback(tx),
    ),
  };

  return {
    db,
    tx,
    reset() {
      professional = {
        userType: "PROFESSIONAL",
        industry: "HEALTH",
        isActive: true,
        onlineSpecialty: "TEACHER",
        documentReg: null,
        teachingSubject: null,
        professionalVerification: { id: "verification-1", status: "DRAFT" },
      };
      vi.clearAllMocks();
    },
    setProfessional(value: typeof professional) {
      professional = value;
    },
  };
});

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: "professional-1",
      userType: "PROFESSIONAL",
      industry: "HEALTH",
    },
  })),
}));
vi.mock("@/lib/prisma", () => ({ db: mocks.db }));
vi.mock("@/lib/action-rate-limit", () => ({
  consumeRateLimit: vi.fn(async () => null),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateHealthProProfile } from "./update-health-pro";
import {
  updateHealthSchedule,
  type WeeklyAvailability,
} from "./update-health-schedule";

function profileForm(fields: Record<string, string> = {}) {
  const formData = new FormData();
  formData.set("displayName", "Profissional Teste");
  formData.set("jobTitle", "Professor");
  formData.set("sessionDuration", "50");
  formData.set("consultationFee", "100");
  formData.set("timezone", "America/Sao_Paulo");

  for (const [key, value] of Object.entries(fields)) {
    formData.set(key, value);
  }

  return formData;
}

const schedule: WeeklyAvailability = {
  segunda: { active: true, start: "09:00", end: "18:00" },
  terca: { active: false, start: "09:00", end: "18:00" },
  quarta: { active: false, start: "09:00", end: "18:00" },
  quinta: { active: false, start: "09:00", end: "18:00" },
  sexta: { active: false, start: "09:00", end: "18:00" },
  sabado: { active: false, start: "09:00", end: "12:00" },
  domingo: { active: false, start: "00:00", end: "00:00" },
};

describe("onboarding do profissional Online", () => {
  beforeEach(() => mocks.reset());

  it("rejeita chamada direta de Professor sem materia", async () => {
    const result = await updateHealthProProfile(profileForm());

    expect(result.error).toContain("materia");
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
  });

  it("salva Professor com materia e remove qualquer registro", async () => {
    const result = await updateHealthProProfile(
      profileForm({
        displayName: "PROFISSIONAL TESTE",
        teachingSubject: "Matematica",
        documentRegType: "CRM",
        documentRegNumber: "12345",
      }),
    );

    expect(result).toEqual({ success: true });
    expect(mocks.tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          jobTitle: "Professor",
          displayName: "Profissional teste",
          teachingSubject: "Matematica",
          documentReg: null,
        }),
      }),
    );
  });

  it("preserva o registro regulamentado para o fluxo documental", async () => {
    mocks.setProfessional({
      userType: "PROFESSIONAL",
      industry: "HEALTH",
      isActive: true,
      onlineSpecialty: "PSYCHOLOGIST",
      documentReg: null,
      teachingSubject: null,
      professionalVerification: { id: "verification-1", status: "DRAFT" },
    });

    const result = await updateHealthProProfile(
      profileForm({ jobTitle: "Psicologo(a)" }),
    );

    expect(result).toEqual({ success: true });
    expect(mocks.tx.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ documentReg: null }),
      }),
    );
  });

  it("revalida no banco se a conta profissional continua ativa", async () => {
    mocks.setProfessional({
      userType: "PROFESSIONAL",
      industry: "HEALTH",
      isActive: false,
      onlineSpecialty: "TEACHER",
      documentReg: null,
      teachingSubject: "Matematica",
      professionalVerification: { id: "verification-1", status: "APPROVED" },
    });

    const result = await updateHealthProProfile(profileForm());

    expect(result).toEqual({ error: "Nao autorizado" });
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
  });

  it("permite que Professor com materia configure a agenda", async () => {
    mocks.setProfessional({
      userType: "PROFESSIONAL",
      industry: "HEALTH",
      isActive: true,
      onlineSpecialty: "TEACHER",
      documentReg: null,
      teachingSubject: "Fisica",
      professionalVerification: { id: "verification-1", status: "APPROVED" },
    });

    const result = await updateHealthSchedule(schedule);

    expect(result).toEqual({ success: true });
    expect(mocks.db.$transaction).toHaveBeenCalledOnce();
  });

  it("bloqueia agenda de Professor sem materia no backend", async () => {
    const result = await updateHealthSchedule(schedule);

    expect(result.error).toContain("materia");
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });
});
