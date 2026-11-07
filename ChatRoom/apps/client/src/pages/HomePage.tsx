
import { HeroSection } from "../components/home/HeroSection";
import { FeaturesSection } from "../components/home/FeaturesSection";
import { HowItWorksSection } from "../components/home/HowItWorksSection";
import { CallToActionSection } from "../components/home/CallToActionSection";

export function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CallToActionSection />
    </>
  );
}
