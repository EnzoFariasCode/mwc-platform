import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  clientRecordFindMany: vi.fn(),
  userFindUnique: vi.fn(),
  userFindMany: vi.fn(),
}));

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({
    user: {
      id: "professional-1",
      userType: "PROFESSIONAL",
      industry: "HEALTH",
    },
  })),
}));

vi.mock("@/lib/prisma", () => ({
  db: {
    clientRecord: { findMany: mocks.clientRecordFindMany },
    user: {
      findUnique: mocks.userFindUnique,
      findMany: mocks.userFindMany,
    },
  },
}));

import { listProfessionalClientRecords } from "./client-record-actions";

const scheduledPatient = {
  id: "patient-1",
  name: "Paciente Teste",
  displayName: "Paciente",
  email: "patient@example.com",
  city: "Sao Paulo",
  patientAppointments: [
    {
      date: new Date("2026-08-25T00:00:00.000Z"),
      time: "14:00",
      status: "MEETING_PENDING",
      createdAt: new Date("2026-08-19T12:00:00.000Z"),
    },
  ],
};

describe("diretorio de registros do profissional Online", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.clientRecordFindMany.mockResolvedValue([]);
    mocks.userFindUnique.mockResolvedValue({ onlineSpecialty: "PSYCHOLOGIST" });
    mocks.userFindMany.mockResolvedValue([scheduledPatient]);
  });

  it("lista paciente pago enquanto a sala ainda esta sendo preparada", async () => {
    const result = await listProfessionalClientRecords();

    expect(result.success).toBe(true);
    expect(result.records).toEqual([
      expect.objectContaining({
        id: "scheduled:patient-1",
        patientId: "patient-1",
        patientName: "Paciente",
        specialty: "PSYCHOLOGIST",
        recordStarted: false,
        appointmentStatus: "MEETING_PENDING",
      }),
    ]);
  });

  it("nao duplica o paciente quando o registro ja foi iniciado", async () => {
    mocks.clientRecordFindMany.mockResolvedValue([
      {
        id: "record-1",
        patientId: "patient-1",
        patientName: "Paciente",
        patientEmail: "patient@example.com",
        patientCity: "Sao Paulo",
        specialty: "PSYCHOLOGIST",
        chiefComplaint: null,
        updatedAt: new Date("2026-08-20T12:00:00.000Z"),
        sessionNotes: [],
        legalCases: [],
        _count: { sessionNotes: 0, legalCases: 0 },
      },
    ]);

    const result = await listProfessionalClientRecords();

    expect(result.records).toHaveLength(1);
    expect(result.records?.[0]).toEqual(
      expect.objectContaining({
        id: "record-1",
        patientId: "patient-1",
        recordStarted: true,
        appointmentStatus: "MEETING_PENDING",
      }),
    );
  });
});
