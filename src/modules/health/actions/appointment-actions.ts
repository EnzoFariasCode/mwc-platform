"use server";

import { auth } from "@/auth";
import { db } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createAppointment(formData: {
  proId: string;
  date: string;
  time: string;
}) {
  const session = await auth();

  // 1. Validação de Autenticação
  if (!session?.user?.id) {
    return { error: "Você precisa estar logado para agendar." };
  }

  try {
    // 2. Busca e Validação do Profissional Real
    const professional = await db.user.findUnique({
      where: { id: formData.proId },
      select: {
        id: true,
        userType: true,
        industry: true,
        consultationFee: true,
      },
    });

    if (
      !professional ||
      professional.userType !== "PROFESSIONAL" ||
      professional.industry !== "HEALTH"
    ) {
      return {
        error: "Profissional não encontrado ou não disponível para saúde.",
      };
    }

    // 3. Processamento de Data e Hora
    // Espera date no formato YYYY-MM-DD e time no formato HH:mm
    const appointmentDate = new Date(`${formData.date}T${formData.time}:00`);

    if (isNaN(appointmentDate.getTime())) {
      return { error: "Data ou horário inválidos." };
    }

    if (appointmentDate < new Date()) {
      return { error: "Não é possível agendar para o passado." };
    }

    // 4. Criação do Registro no Prisma
    const newAppointment = await db.appointment.create({
      data: {
        date: appointmentDate,
        status: "SCHEDULED",
        price: professional.consultationFee || 0,
        patientId: session.user.id,
        professionalId: professional.id,
        // MVP: Gerando um link de Meet "fake" funcional até integrar API do Google
        meetLink: `https://meet.google.com/mwc-${Math.random().toString(36).substring(2, 11)}`,
      },
    });

    revalidatePath("/agendar-consulta/historico");

    return {
      success: true,
      appointmentId: newAppointment.id,
      meetLink: newAppointment.meetLink,
    };
  } catch (error) {
    console.error("Erro ao criar agendamento:", error);
    return { error: "Falha interna ao processar agendamento." };
  }
}
