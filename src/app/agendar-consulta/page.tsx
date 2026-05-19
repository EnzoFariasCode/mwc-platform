import { HealthHomeClient } from "@/app/agendar-consulta/health-home-client";
import { getHealthSpecialtyCards } from "@/modules/health/services/specialty-service";

export default async function AgendarConsultaPage() {
  const specialties = await getHealthSpecialtyCards();

  return <HealthHomeClient specialties={specialties} />;
}
