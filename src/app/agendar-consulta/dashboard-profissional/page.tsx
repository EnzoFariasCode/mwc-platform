import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function ProHealthDashboard() {
  const session = await auth();

  if (
    !session ||
    session.user?.userType !== "PROFESSIONAL" ||
    session.user?.industry !== "HEALTH"
  ) {
    redirect("/portal");
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8 pt-24">
      <h1 className="text-3xl font-bold font-futura uppercase mb-6">
        Painel do Especialista
      </h1>
      <div className="p-12 border-2 border-dashed border-white/10 rounded-3xl text-center">
        <p className="text-slate-500">
          Área de gestão de consultas e agenda em desenvolvimento...
        </p>
      </div>
    </div>
  );
}
