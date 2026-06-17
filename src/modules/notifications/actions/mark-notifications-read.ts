"use server";

import { revalidatePath } from "next/cache";
import { getUserSession } from "@/lib/get-session";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/notifications/services/notification-service";
import { ActionResponse } from "@/modules/users/types/user-types";

export async function markNotificationAsRead(
  notificationId: string,
): Promise<ActionResponse> {
  const session = await getUserSession();

  if (!session?.id) {
    return { success: false, error: "Nao autorizado." };
  }

  if (!notificationId) {
    return { success: false, error: "Notificacao invalida." };
  }

  await markNotificationRead({ userId: session.id, notificationId });
  revalidatePath("/dashboard");

  return { success: true };
}

export async function markAllUserNotificationsAsRead(): Promise<ActionResponse> {
  const session = await getUserSession();

  if (!session?.id) {
    return { success: false, error: "Nao autorizado." };
  }

  await markAllNotificationsRead(session.id);
  revalidatePath("/dashboard");

  return { success: true };
}
