import HeroSection from "../components/home/hero-section";
import PopularSection from "../components/home/popular-section";
import AboutSection from "../components/home/about-section";
import DevelopersSection from "../components/home/developers-section";
import ContactSection from "../components/home/contact-section";

export default function Home() {
  return (
    <div>
      <HeroSection />
      <PopularSection />
      <AboutSection />
      <DevelopersSection />
      <ContactSection />
    </div>
  );
}
