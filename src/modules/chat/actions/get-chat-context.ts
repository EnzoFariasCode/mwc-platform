"use server";

import { db } from "@/lib/prisma";

export async function getProjectContext(projectId: string) {
  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      select: { title: true, budgetLabel: true, status: true },
    });
    return project;
  } catch {
    return null;
  }
}

export async function getBasicUserInfo(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true, jobTitle: true, id: true },
    });
    return user;
  } catch {
    return null;
  }
}
