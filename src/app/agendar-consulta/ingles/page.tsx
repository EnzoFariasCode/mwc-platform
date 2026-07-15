import { permanentRedirect } from "next/navigation";

export default function LegacyEnglishTeacherPage() {
  permanentRedirect("/agendar-consulta/professor");
}
