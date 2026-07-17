import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdminRole: vi.fn(),
  userCount: vi.fn(),
  userFindMany: vi.fn(),
  withdrawalCount: vi.fn(),
  withdrawalFindMany: vi.fn(),
  withdrawalGroupBy: vi.fn(),
  queryRaw: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/get-session", () => ({
  requireAdminRole: mocks.requireAdminRole,
}));
vi.mock("@/lib/prisma", () => ({
  db: {
    user: { count: mocks.userCount, findMany: mocks.userFindMany },
    withdrawalRequest: {
      count: mocks.withdrawalCount,
      findMany: mocks.withdrawalFindMany,
      groupBy: mocks.withdrawalGroupBy,
    },
    $queryRaw: mocks.queryRaw,
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/modules/admin/actions/audit-log", () => ({
  createAdminAuditLog: vi.fn(),
}));

import { getAdminWithdrawals } from "./get-withdrawals";
import { getAdminUsers } from "./user-actions";

describe("admin server-side list queries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdminRole.mockResolvedValue({ id: "admin-1" });
    mocks.userFindMany.mockResolvedValue([]);
    mocks.withdrawalFindMany.mockResolvedValue([]);
    mocks.withdrawalGroupBy.mockResolvedValue([]);
  });

  it("searches and paginates users across the full matching dataset", async () => {
    mocks.userCount.mockResolvedValue(61);

    const result = await getAdminUsers({
      page: 3,
      search: "old-user@example.com",
      status: "SUSPENDED",
    });

    expect(mocks.userCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        isActive: false,
        OR: expect.arrayContaining([
          { email: { contains: "old-user@example.com", mode: "insensitive" } },
        ]),
      }),
    });
    expect(mocks.userFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 50, take: 25 }),
    );
    expect(result.pagination).toEqual({
      page: 3,
      pageSize: 25,
      totalItems: 61,
      totalPages: 3,
    });
  });

  it("searches and paginates withdrawals without a silent 100-item cap", async () => {
    mocks.withdrawalCount.mockResolvedValue(76);

    const result = await getAdminWithdrawals({
      page: 4,
      search: "pix@example.com",
      status: "ALL",
    });

    expect(mocks.withdrawalCount).toHaveBeenCalledWith({
      where: expect.objectContaining({
        OR: expect.arrayContaining([
          { pixKey: { contains: "pix@example.com", mode: "insensitive" } },
          {
            user: {
              email: {
                contains: "pix@example.com",
                mode: "insensitive",
              },
            },
          },
        ]),
      }),
    });
    expect(mocks.withdrawalFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 75, take: 25 }),
    );
    expect(result.pagination).toEqual({
      page: 4,
      pageSize: 25,
      totalItems: 76,
      totalPages: 4,
    });
  });
});
