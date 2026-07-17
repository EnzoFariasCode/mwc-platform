import type { Prisma, TransactionStatus, WithdrawalStatus } from "@prisma/client";

type WithdrawalTransitionInput = {
  withdrawalId: string;
  expectedStatuses: WithdrawalStatus[];
  nextStatus: WithdrawalStatus;
  data?: Omit<Prisma.WithdrawalRequestUpdateManyMutationInput, "status">;
};

type TransactionTransitionInput = {
  transactionId: string;
  expectedStatuses: TransactionStatus[];
  nextStatus: TransactionStatus;
};

export async function claimWithdrawalTransition(
  tx: Prisma.TransactionClient,
  {
    withdrawalId,
    expectedStatuses,
    nextStatus,
    data,
  }: WithdrawalTransitionInput,
) {
  const claimed = await tx.withdrawalRequest.updateMany({
    where: {
      id: withdrawalId,
      status: { in: expectedStatuses },
    },
    data: {
      ...data,
      status: nextStatus,
    },
  });

  if (claimed.count !== 1) {
    throw new Error("Esta solicitacao de saque ja foi processada.");
  }
}

export async function transitionWithdrawalTransaction(
  tx: Prisma.TransactionClient,
  {
    transactionId,
    expectedStatuses,
    nextStatus,
  }: TransactionTransitionInput,
) {
  const transitioned = await tx.transaction.updateMany({
    where: {
      id: transactionId,
      status: { in: expectedStatuses },
    },
    data: { status: nextStatus },
  });

  if (transitioned.count !== 1) {
    throw new Error(
      "A transacao financeira do saque esta em um estado inconsistente.",
    );
  }
}
