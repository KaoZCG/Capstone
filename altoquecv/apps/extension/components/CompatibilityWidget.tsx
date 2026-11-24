import React, { useEffect, useRef, useState } from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import type { OfertaDetectada, CompatibilidadWidget as ICompatibilidadWidget } from '../types/oferta';
import { ScoreGauge } from './ScoreGauge';
import { ScoreBreakdown } from './ScoreBreakdown';
import { DetectedDataCard } from './DetectedDataCard';
import type { WidgetProfileData } from '../types/oferta';
import { getAppUrl } from '../runtime-config';

declare const chrome: any;

interface Props {
  oferta: OfertaDetectada;
  compatibilidad: ICompatibilidadWidget | null;
  profileData: WidgetProfileData | null;
  detectedFieldCount: number;
  onDetectedFieldCountChange: (count: number) => void;
  aiResponseStatus: string;
  onAiResponseStatusChange: (status: string) => void;
  cargando?: boolean;
  onClose: () => void;
}

export function CompatibilityWidget({
  oferta,
  compatibilidad,
  profileData,
  detectedFieldCount,
  onDetectedFieldCountChange,
  aiResponseStatus,
  onAiResponseStatusChange,
  cargando = false,
  onClose,
}: Props) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const generatedQuestionsAndAnswers = useRef<{ pregunta: string; respuesta: string }[]>([]);
  const generatedCompatibility = useRef<number | null>(null);
  const generatedForm = useRef<HTMLFormElement | null>(null);

  useEffect(() => {
    const handleApplicationSubmit = (event: Event) => {
      if (
        !generatedQuestionsAndAnswers.current.length
        || !(event.target instanceof HTMLFormElement)
        || event.target !== generatedForm.current
      ) return;
      const portal = oferta.portal === 'trabajando' ? 'trabajando' : 'laborum';
      void chrome.runtime.sendMessage({
        type: 'ALTOQUE_REGISTRAR_POSTULACION',
        cargo: oferta.titulo,
        empresa: oferta.empresa,
        compatibilidad: generatedCompatibility.current,
        tipo: portal,
        url_oferta: oferta.url,
      }).then((result: { exito?: boolean; detail?: string }) => {
        if (result?.exito) {
          setToastMsg('Postulación guardada en tu tablero Premium.');
          generatedQuestionsAndAnswers.current = [];
          generatedCompatibility.current = null;
          generatedForm.current = null;
        } else {
          console.info('AltoqueCV: No se pudo guardar la postulación en el tablero.', result?.detail);
          if (result?.detail) setToastMsg(result.detail);
        }
      }).catch((error: unknown) => console.info('AltoqueCV: No se pudo guardar la postulación.', error));
    };

    document.addEventListener('submit', handleApplicationSubmit);
    return () => document.removeEventListener('submit', handleApplicationSubmit);
  }, [oferta]);

  const handleAutoFill = async () => {
    setIsLoading(true);
    onAiResponseStatusChange("Generando...");
    setToastMsg("🤖 Cargando tu Perfil Maestro y adaptando respuestas al cargo...");

    try {
      const elementos = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
        'textarea, input[type="text"]'
      );

      const camposValidos: { elemento: HTMLInputElement | HTMLTextAreaElement, pregunta: string }[] = [];
      const preguntas: string[] = [];

      elementos.forEach((el) => {
        if (el.disabled || el.readOnly || el.offsetParent === null) return;
        let textoPregunta = el.parentElement?.parentElement?.innerText || el.placeholder || "";
        textoPregunta = textoPregunta.replace(/Ingresa tu respuesta|\*/gi, "").trim();

        if (textoPregunta && textoPregunta.length > 10) {
          camposValidos.push({ elemento: el, pregunta: textoPregunta });
          preguntas.push(textoPregunta);
        }
      });
      onDetectedFieldCountChange(camposValidos.length);

      if (preguntas.length === 0) throw new Error("⚠️ No se detectaron preguntas válidas.");

      const data = await chrome.runtime.sendMessage({
        type: 'ALTOQUE_AUTOCOMPLETAR',
        preguntas,
        cargo: oferta.titulo || document.querySelector("h1")?.innerText || "Cargo",
        empresa: oferta.empresa || "Empresa",
        tipo: oferta.portal === 'trabajando' ? 'trabajando' : 'laborum',
        url_oferta: oferta.url,
        descripcion_oferta: oferta.descripcion || "",
      });

      if (!data?.exito || !Array.isArray(data.respuestas)) {
        throw new Error(data?.detail || 'No se recibieron respuestas de la IA.');
      }

      let respuestasValidas = 0;
      const preguntasRespuestas: { pregunta: string; respuesta: string }[] = [];
      camposValidos.forEach((campo, index) => {
        const respuestaIA = data.respuestas[index];
        if (respuestaIA && !respuestaIA.includes("Error")) {
          campo.elemento.value = respuestaIA;
          campo.elemento.dispatchEvent(new Event("input", { bubbles: true }));
          campo.elemento.dispatchEvent(new Event("change", { bubbles: true }));
          respuestasValidas += 1;
          preguntasRespuestas.push({ pregunta: campo.pregunta, respuesta: respuestaIA });
        }
      });
      generatedQuestionsAndAnswers.current = preguntasRespuestas;
      generatedCompatibility.current = compatibilidad?.scoreGeneral ?? null;
      generatedForm.current = camposValidos[0]?.elemento.form ?? null;

      onAiResponseStatusChange(respuestasValidas ? "Generada" : "Sin respuestas válidas");
      const remaining = data.uso_diario?.subscription_plan === 'free'
        ? ` Te quedan ${data.uso_diario.restantes} de 5 vacantes hoy.`
        : '';
      setToastMsg(respuestasValidas ? `✨ ¡Postulación autocompletada!${remaining}` : "La IA no generó respuestas válidas.");
    } catch (error) {
      console.error("Error:", error);
      onAiResponseStatusChange("No disponible");
      setToastMsg(error instanceof Error ? error.message : "Falló la conexión.");
    } finally {
      setTimeout(() => setToastMsg(null), 8000);
      setIsLoading(false);
    }
  };

  const handleAdaptCV = () => {
    try {
      const appUrl = getAppUrl();
      if (!appUrl) {
        setToastMsg('Configura PLASMO_PUBLIC_APP_URL para abrir el adaptador de CV.');
        return;
      }
      const destination = new URL('/adaptador', appUrl);
      destination.searchParams.set('cargo', oferta.titulo);
      if (oferta.empresa && oferta.empresa !== 'Empresa Confidencial') {
        destination.searchParams.set('empresa', oferta.empresa);
      }
      if (oferta.descripcion) {
        destination.searchParams.set('descripcion', oferta.descripcion.slice(0, 1800));
      }
      window.open(destination.toString(), '_blank', 'noopener,noreferrer');
    } catch (error) {
      setToastMsg(error instanceof Error ? error.message : 'No se pudo abrir el adaptador de CV.');
    }
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] w-[320px] max-h-[calc(100vh-2rem)] overflow-y-auto overflow-x-hidden bg-surface rounded-2xl shadow-2xl border border-border font-sans">
      {/* Cabecera Premium */}
      <div className="bg-gradient-to-r from-surface-container-lowest to-surface-container-low p-4 border-b border-border flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 bg-primary text-white rounded-md font-extrabold text-sm flex items-center justify-center shadow-sm">A</div>
          <span className="text-sm font-bold text-on-surface tracking-tight">AltoqueCV</span>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-error transition-colors p-1 rounded-md hover:bg-error/10">
          <X size={18} />
        </button>
      </div>

      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="mx-3 mt-3 rounded-xl bg-on-surface px-3 py-2.5 text-center text-xs font-medium leading-5 text-surface shadow-lg [overflow-wrap:anywhere]"
        >
          {toastMsg}
        </div>
      )}

      {/* Cuerpo Principal */}
      <div className="p-5 bg-surface-container-lowest">

        {/* Título de la Oferta */}
        <div className="text-center mb-6">
          <h3 className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">Análisis de Perfil</h3>
          <p className="text-sm font-semibold text-on-surface truncate px-2" title={oferta.titulo}>
            {oferta.titulo}
          </p>
        </div>

        {/* Sección de Puntaje Centralizada */}
        <div className="flex flex-col items-center gap-5 mb-7 bg-surface-container-low p-5 rounded-2xl border border-border/40 shadow-inner">
          <h4 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
            Score ATS en vivo
          </h4>
          {cargando || !compatibilidad ? (
            <p className="text-xs text-on-surface-variant text-center">Leyendo la oferta y comparando tu Perfil Maestro…</p>
          ) : (
            <>
              <ScoreGauge score={compatibilidad.scoreGeneral} />
              <div className="w-full">
                <ScoreBreakdown desglose={compatibilidad.desglose} />
              </div>
              {compatibilidad.mensaje && (
                <p className="text-xs text-on-surface-variant text-center">{compatibilidad.mensaje}</p>
              )}
            </>
          )}
        </div>

        <DetectedDataCard
          profile={profileData}
          detectedFieldCount={detectedFieldCount}
          aiResponseStatus={aiResponseStatus}
          loading={cargando}
        />

        {/* Botones de Acción */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleAutoFill}
            disabled={isLoading}
            className={`w-full text-white font-semibold text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm ${isLoading ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed' : 'bg-primary hover:bg-primary/90 hover:shadow-md hover:-translate-y-0.5'}`}
          >
            <Sparkles size={16} /> {isLoading ? "Adaptando respuestas..." : "Autocompletar con IA"}
          </button>

          <button onClick={handleAdaptCV} className="w-full bg-surface hover:bg-surface-container-low border border-border text-on-surface font-medium text-sm py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors">
            <ExternalLink size={16} /> Adaptar CV a esta oferta
          </button>
        </div>
      </div>
    </div>
  );
}
