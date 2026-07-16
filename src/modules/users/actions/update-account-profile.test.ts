import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  let latestConsent: { granted: boolean; phone: string | null } | undefined;

  const tx = {
    user: {
      findUnique: vi.fn(async () => ({
        phone: "(11) 99999-9999",
        whatsappConsentEvents: latestConsent ? [latestConsent] : [],
      })),
      update: vi.fn(),
    },
    whatsappConsentEvent: { create: vi.fn() },
  };

  const db = {
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };

  return {
    db,
    tx,
    reset() {
      latestConsent = undefined;
      vi.clearAllMocks();
    },
    setLatestConsent(value: typeof latestConsent) {
      latestConsent = value;
    },
  };
});

vi.mock("@/auth", () => ({
  auth: vi.fn(async () => ({ user: { id: "user-1" } })),
}));
vi.mock("@/lib/prisma", () => ({ db: mocks.db }));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({
    get: vi.fn((name: string) => {
      if (name === "x-forwarded-for") return "203.0.113.10";
      if (name === "user-agent") return "MWC Test";
      return null;
    }),
  })),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { updateAccountProfile } from "./update-account-profile";

function profileForm({ consent = false, phone = "11999999999" } = {}) {
  const formData = new FormData();
  formData.set("name", "Usuario Teste");
  formData.set("phone", phone);
  if (consent) formData.set("whatsappConsent", "on");
  return formData;
}

describe("consentimento de WhatsApp no perfil", () => {
  beforeEach(() => mocks.reset());

  it("registra concessao com telefone, IP, navegador e versao", async () => {
    const result = await updateAccountProfile(
      profileForm({ consent: true }),
    );

    expect(result).toEqual({ success: true });
    expect(mocks.tx.whatsappConsentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        granted: true,
        phone: "(11) 99999-9999",
        consentVersion: "whatsapp-v1.0",
        ipAddress: "203.0.113.10",
        userAgent: "MWC Test",
      }),
    });
  });

  it("registra revogacao quando um consentimento ativo e desmarcado", async () => {
    mocks.setLatestConsent({
      granted: true,
      phone: "(11) 99999-9999",
    });

    const result = await updateAccountProfile(profileForm());

    expect(result).toEqual({ success: true });
    expect(mocks.tx.whatsappConsentEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ granted: false }),
    });
  });

  it("rejeita consentimento sem telefone antes de gravar", async () => {
    const result = await updateAccountProfile(
      profileForm({ consent: true, phone: "" }),
    );

    expect(result.error).toContain("telefone");
    expect(mocks.db.$transaction).not.toHaveBeenCalled();
  });

  it("nao duplica evento quando consentimento e telefone nao mudaram", async () => {
    mocks.setLatestConsent({
      granted: true,
      phone: "(11) 99999-9999",
    });

    const result = await updateAccountProfile(
      profileForm({ consent: true }),
    );

    expect(result).toEqual({ success: true });
    expect(mocks.tx.whatsappConsentEvent.create).not.toHaveBeenCalled();
  });
});
