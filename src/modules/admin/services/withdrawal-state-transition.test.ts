import { describe, expect, it, vi } from "vitest";
import {
  claimWithdrawalTransition,
  transitionWithdrawalTransaction,
} from "./withdrawal-state-transition";

function transactionClient({ withdrawalCount = 1, transactionCount = 1 } = {}) {
  return {
    withdrawalRequest: {
      updateMany: vi.fn().mockResolvedValue({ count: withdrawalCount }),
    },
    transaction: {
      updateMany: vi.fn().mockResolvedValue({ count: transactionCount }),
    },
  };
}

describe("withdrawal state transitions", () => {
  it("claims a withdrawal only while it remains in an expected state", async () => {
    const tx = transactionClient();

    await claimWithdrawalTransition(tx as never, {
      withdrawalId: "withdrawal-1",
      expectedStatuses: ["PENDING", "PROCESSING"],
      nextStatus: "FAILED",
      data: { failureReason: "Dados bancarios invalidos" },
    });

    expect(tx.withdrawalRequest.updateMany).toHaveBeenCalledWith({
      where: {
        id: "withdrawal-1",
        status: { in: ["PENDING", "PROCESSING"] },
      },
      data: {
        failureReason: "Dados bancarios invalidos",
        status: "FAILED",
      },
    });
  });

  it("rejects a competing request that lost the atomic claim", async () => {
    const tx = transactionClient({ withdrawalCount: 0 });

    await expect(
      claimWithdrawalTransition(tx as never, {
        withdrawalId: "withdrawal-1",
        expectedStatuses: ["PENDING", "PROCESSING"],
        nextStatus: "CANCELED",
      }),
    ).rejects.toThrow("Esta solicitacao de saque ja foi processada.");
  });

  it("rolls back when the linked financial transaction is inconsistent", async () => {
    const tx = transactionClient({ transactionCount: 0 });

    await expect(
      transitionWithdrawalTransaction(tx as never, {
        transactionId: "transaction-1",
        expectedStatuses: ["PENDING", "PROCESSING"],
        nextStatus: "FAILED",
      }),
    ).rejects.toThrow("estado inconsistente");
  });
});
