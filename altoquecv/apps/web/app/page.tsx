import { ComparadorATS } from "./(landing)/components/comparador-ats";
import { CTAFinal } from "./(landing)/components/cta-final";
import { Ecosystem } from "./(landing)/components/ecosystem";
import { Features } from "./(landing)/components/features";
import { Footer } from "./(landing)/components/footer";
import { HeroSection } from "./(landing)/components/hero";
import { HowItWorks } from "./(landing)/components/how-it-works";
import { Testimonials } from "./(landing)/components/testimonials";

export default function Home() {
  return (
    <>
      <HeroSection />
      <Features />
      <HowItWorks />
      <ComparadorATS />
      <Ecosystem />
      <Testimonials />
      <CTAFinal />
      <Footer />
    </>
  );
}
