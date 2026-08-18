import { requireProfessionalSector } from "@/modules/auth/lib/require-professional-sector";

type ProfessionalSectorAreaProps = {
  children: React.ReactNode;
};

export async function TechProfessionalArea({
  children,
}: ProfessionalSectorAreaProps) {
  await requireProfessionalSector("TECH");
  return children;
}

export async function HealthProfessionalArea({
  children,
}: ProfessionalSectorAreaProps) {
  await requireProfessionalSector("HEALTH");
  return children;
}
