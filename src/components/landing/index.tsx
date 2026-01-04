import { Fluxo } from './landingComponents/Fluxo';
import { HeroSection } from './landingComponents/HeroSection';
import HowToUse from './landingComponents/HowToUse';
import Outstanding from './landingComponents/Outstanding';
import PayInfo from './landingComponents/PayInfo';
import ServicesSection from './landingComponents/ServicesSection';
import { WorkerSection } from './landingComponents/WorkerSection';


function LandingPage() {
  return (
    <div className="bg-slate-950 min-h-screen">
        <HeroSection />
        <ServicesSection />
        <HowToUse />
        <Outstanding />
        <Fluxo />
        <WorkerSection />
        <PayInfo />
    </div>
  );
}

export default LandingPage;