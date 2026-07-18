import { Fluxo } from "./landingComponents/Fluxo";
import ContractPathsSection from "./landingComponents/ContractPathsSection";
import { HeroSection } from "./landingComponents/HeroSection";
import HowToUse from "./landingComponents/HowToUse";
import PayInfo from "./landingComponents/PayInfo";
import ServicesSection from "./landingComponents/ServicesSection";
import TelemedicinaSection from "./landingComponents/TelemedicinaSection";
import { WorkerSection } from "./landingComponents/WorkerSection";
import { getPublicPaymentMethods } from "@/modules/stripe/services/payment-method-health";

async function LandingPage() {
  const paymentMethods = await getPublicPaymentMethods();

  return (
    <div className="bg-slate-950 min-h-screen">
      <HeroSection />
      <ServicesSection />
      <ContractPathsSection />
      <HowToUse />
      <Fluxo />
      <WorkerSection />
      <TelemedicinaSection />
      <PayInfo paymentMethods={paymentMethods} />
    </div>
  );
}

export default LandingPage;
