import { NextResponse } from "next/server";

import { db } from "@/lib/prisma";
import {
  getBookableHealthProfessionalWhere,
  getHealthProfessionalBookingReadinessError,
} from "@/modules/health/lib/health-professional-eligibility";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return new NextResponse(null, { status: 404 });
  }

  const professional = await db.user.findFirst({
    where: {
      id,
      ...getBookableHealthProfessionalWhere(),
    },
    select: {
      profileImageBytes: true,
      profileImageType: true,
      onlineSpecialty: true,
      teachingSubject: true,
      documentReg: true,
      jobTitle: true,
      consultationFee: true,
      sessionDuration: true,
      timezone: true,
      availabilities: {
        where: { isActive: true },
        select: {
          dayOfWeek: true,
          startTime: true,
          endTime: true,
          isActive: true,
        },
      },
    },
  });

  if (
    !professional?.profileImageBytes ||
    getHealthProfessionalBookingReadinessError(professional)
  ) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(
    professional.profileImageBytes as unknown as BodyInit,
    {
      headers: {
        "Content-Type": professional.profileImageType || "image/jpeg",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
