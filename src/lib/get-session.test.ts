import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const queryRawMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: authMock }));
vi.mock("@/lib/prisma", () => ({
  db: { $queryRaw: queryRawMock },
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { getAdminAccess } from "./get-session";

function session(overrides: Record<string, unknown> = {}) {
  return {
    user: {
      id: "admin-1",
      role: "ADMIN",
      userType: "ADMIN",
      adminRole: "OWNER",
      isActive: true,
      ...overrides,
    },
  };
}

describe("getAdminAccess", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue(session());
    queryRawMock.mockResolvedValue([
      { isActive: true, userType: "ADMIN", adminRole: "OWNER" },
    ]);
  });

  it("authorizes using the current role stored in the database", async () => {
    await expect(getAdminAccess(["OWNER"])).resolves.toMatchObject({
      status: "AUTHORIZED",
      session: { id: "admin-1", adminRole: "OWNER" },
    });
  });

  it("rejects a suspended administrator even with an active-looking session", async () => {
    queryRawMock.mockResolvedValue([
      { isActive: false, userType: "ADMIN", adminRole: "OWNER" },
    ]);

    await expect(getAdminAccess(["OWNER"])).resolves.toEqual({
      status: "UNAUTHENTICATED",
    });
  });

  it("rejects a stale session when the database role no longer has access", async () => {
    queryRawMock.mockResolvedValue([
      { isActive: true, userType: "ADMIN", adminRole: "SUPPORT" },
    ]);

    await expect(getAdminAccess(["FINANCE"])).resolves.toEqual({
      status: "FORBIDDEN",
    });
  });

  it("rejects a user whose type was changed away from ADMIN", async () => {
    queryRawMock.mockResolvedValue([
      { isActive: true, userType: "CLIENT", adminRole: null },
    ]);

    await expect(getAdminAccess(["OWNER"])).resolves.toEqual({
      status: "FORBIDDEN",
    });
  });
});
