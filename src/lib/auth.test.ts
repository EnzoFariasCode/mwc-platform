import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => vi.fn());
const queryRawMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));
vi.mock("@/auth", () => ({ auth: authMock, signOut: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  db: { $queryRaw: queryRawMock },
}));

import { verifySession } from "./auth";

describe("verifySession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({
      user: {
        id: "admin-1",
        role: "ADMIN",
        userType: "ADMIN",
        industry: "TECH",
        adminRole: "OWNER",
        isActive: true,
      },
    });
  });

  it("uses the current admin role from the database", async () => {
    queryRawMock.mockResolvedValue([
      {
        isActive: true,
        userType: "ADMIN",
        industry: "TECH",
        adminRole: "SUPPORT",
      },
    ]);

    await expect(verifySession()).resolves.toMatchObject({
      sub: "admin-1",
      userType: "ADMIN",
      adminRole: "SUPPORT",
    });
  });

  it("denies active admin accounts without an explicit database role", async () => {
    queryRawMock.mockResolvedValue([
      {
        isActive: true,
        userType: "ADMIN",
        industry: "TECH",
        adminRole: null,
      },
    ]);

    await expect(verifySession()).resolves.toMatchObject({
      sub: "admin-1",
      adminRole: null,
    });
  });
});
