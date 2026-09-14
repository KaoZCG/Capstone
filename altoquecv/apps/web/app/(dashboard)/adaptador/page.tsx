'use client';

import { Download, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCVAnalyzer } from '@/hooks/use-cv-analyzer';

import { CVPreview } from './components/cv-preview';
import { ATSScoreGauge } from './components/ats-score-gauge';
import { KeywordAnalyzer } from './components/keyword-analyzer';
import { SuggestionsPanel } from './components/suggestions-panel';
import { ComparadorATS } from './components/comparador-ats';

export default function AdaptadorCVPage() {
  const { cv, analysis, comparativa, isLoading } = useCVAnalyzer();

  if (isLoading || !cv || !analysis || !comparativa) {
    return <div className="flex-1 flex items-center justify-center text-on-surface-variant">Analizando documento con IA...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-lg text-on-surface mb-1 flex items-center gap-2">
            <Sparkles className="text-primary" size={28} /> Adaptador de CV
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Análisis simulado por IA para optimizar tu compatibilidad con los sistemas ATS.
          </p>
        </div>
        <Button variant="secondary" className="gap-2">
          <Download size={18} /> Descargar PDF
        </Button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Columna Izquierda: Preview Documento */}
        <div className="lg:col-span-5 order-2 lg:order-1 relative">
          <div className="sticky top-6">
            <h3 className="text-label-md font-semibold text-on-surface-variant mb-4 uppercase tracking-wider">
              Vista Previa (Lectura ATS)
            </h3>
            <CVPreview cv={cv} />
          </div>
        </div>

        {/* Columna Derecha: Panel de Análisis IA */}
        <div className="lg:col-span-7 order-1 lg:order-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <ATSScoreGauge score={analysis.score} />
            <ComparadorATS comparativa={comparativa} />
          </div>
          
          <KeywordAnalyzer keywords={analysis.keywords} />
          
          <div className="bg-surface-container-lowest rounded-container border border-border p-6">
            <SuggestionsPanel sugerencias={analysis.sugerencias} />
          </div>
        </div>
      </div>
    </div>
  );
}