import { useState, useMemo, useEffect } from 'react';
import { CV, ATSAnalysis, CompatibilidadComparativa } from '@/types';
import { cvMock, generateATSAnalysisMock, generateComparativaATSMock } from '@/lib/mock/cv-analyzer.mock';
import { loadFromStorage, saveToStorage } from '@/lib/storage';

const CV_STORAGE_KEY = 'altoquecv_cv';

export function useCVAnalyzer() {
  const [cv, setCV] = useState<CV | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = loadFromStorage<CV>(CV_STORAGE_KEY);
    if (saved) {
      setCV(saved);
    } else {
      setCV(cvMock);
      saveToStorage(CV_STORAGE_KEY, cvMock);
    }
    setIsLoading(false);
  }, []);

  const analysis: ATSAnalysis | null = useMemo(() => {
    return cv ? generateATSAnalysisMock(cv) : null;
  }, [cv]);

  const comparativa: CompatibilidadComparativa = useMemo(() => {
    return generateComparativaATSMock();
  }, []);

  const updateCV = (updatedCV: CV) => {
    setCV(updatedCV);
    saveToStorage(CV_STORAGE_KEY, updatedCV);
  };

  return { cv, analysis, comparativa, isLoading, updateCV };
}