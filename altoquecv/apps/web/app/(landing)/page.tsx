'use client';

import React from 'react';
import { HeroSection } from './components/hero';
import { Features } from './components/features';
import { HowItWorks } from './components/how-it-works';
import { ComparadorATS } from './components/comparador-ats';
import { Ecosystem } from './components/ecosystem';
import { Testimonials } from './components/testimonials';
import { CTAFinal } from './components/cta-final';
import { Footer } from './components/footer';

export default function LandingPage() {
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