import React, { useState } from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import type { OfertaDetectada, CompatibilidadWidget as ICompatibilidadWidget } from '../types/oferta';
import { ScoreGauge } from './ScoreGauge';
import { ScoreBreakdown } from './ScoreBreakdown';

declare const chrome: any;

const APP_URL = 'http://localhost:3000';

interface Props {
  oferta: OfertaDetectada;
  compatibilidad: ICompatibilidadWidget | null;
  cargando?: boolean;
  onClose: () => void;
}

export function CompatibilityWidget({ oferta, compatibilidad, cargando = false, onClose }: Props) {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAutoFill = async () => {
    setIsLoading(true);
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

      if (preguntas.length === 0) throw new Error("⚠️ No se detectaron preguntas válidas.");

      const data = await chrome.runtime.sendMessage({
        type: 'ALTOQUE_AUTOCOMPLETAR',
        preguntas,
        cargo: oferta.titulo || document.querySelector("h1")?.innerText || "Cargo",
        empresa: oferta.empresa || "Empresa",
        descripcion_oferta: oferta.descripcion || "",
      });

      if (!data?.exito || !Array.isArray(data.respuestas)) {
        throw new Error(data?.detail || 'No se recibieron respuestas de la IA.');
      }

      camposValidos.forEach((campo, index) => {
        const respuestaIA = data.respuestas[index];
        if (respuestaIA && !respuestaIA.includes("Error")) {
          campo.elemento.value = respuestaIA;
          campo.elemento.dispatchEvent(new Event("input", { bubbles: true }));
          campo.elemento.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });

      setToastMsg("✨ ¡Postulación autocompletada!");
    } catch (error) {
      console.error("Error:", error);
      setToastMsg(error instanceof Error ? error.message : "Falló la conexión.");
    } finally {
      setTimeout(() => setToastMsg(null), 4000);
      setIsLoading(false);
    }
  };

  const handleAdaptCV = () => {
    const destination = new URL('/adaptador', APP_URL);
    destination.searchParams.set('cargo', oferta.titulo);
    if (oferta.empresa && oferta.empresa !== 'Empresa Confidencial') {
      destination.searchParams.set('empresa', oferta.empresa);
    }
    if (oferta.descripcion) {
      destination.searchParams.set('descripcion', oferta.descripcion.slice(0, 1800));
    }
    window.open(destination.toString(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed top-4 right-4 z-[9999] w-[320px] bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden font-sans">
      {/* Notificación Flotante */}
      {toastMsg && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-xs font-medium px-4 py-1.5 rounded-full z-10 shadow-lg whitespace-nowrap animate-in fade-in slide-in-from-top-2">
          {toastMsg}
        </div>
      )}

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
