import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { VillainSection } from './components/VillainSection';
import { AdSpySection } from './components/AdSpySection';
import { LumiSection } from './components/LumiSection';
import { PricingSection } from './components/PricingSection';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main id="main-content">
        <Hero />
        <VillainSection />
        <AdSpySection />
        <LumiSection />
        <PricingSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
