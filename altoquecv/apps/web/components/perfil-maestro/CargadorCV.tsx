"use client";
import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { saveOriginalProfileCV, type StoredProfileCV } from '@/lib/profile-cv-storage';
import { useAIModel } from '@/hooks/use-ai-model';
import { useAuth } from '@/hooks/use-auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

interface CargadorCVProps {
  ownerId: string;
  onDataExtracted: (datos: any) => Promise<string | undefined>;
  onCVStored: (file: StoredProfileCV) => void;
}

const CV_ANALYSIS_TIMEOUT_MS = 30 * 60 * 1000;

export default function CargadorCV({ ownerId, onDataExtracted, onCVStored }: CargadorCVProps) {
  const {
    hasApiKey,
    selectedModel,
    isLoading: isLoadingProvider,
    error: aiSettingsError,
  } = useAIModel();
  const { accessToken } = useAuth();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<'inactivo' | 'archivo-listo' | 'cargando' | 'exito' | 'error'>('inactivo');
  const [mensaje, setMensaje] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validarYGuardarArchivo(e.dataTransfer.files[0]);
    }
  };

  const handleSeleccionManual = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validarYGuardarArchivo(e.target.files[0]);
    }
  };

  const validarYGuardarArchivo = (file: File) => {
    if (file.type !== 'application/pdf') {
      setEstado('error');
      setMensaje('Formato inválido. Por favor, sube únicamente un archivo PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEstado('error');
      setMensaje('El archivo supera el límite de 5MB.');
      return;
    }
    setArchivo(file);
    setEstado('archivo-listo');
    setMensaje('PDF listo para analizar.');
  };

  const procesarCV = async () => {
    if (!archivo) return;
    if (isLoadingProvider || aiSettingsError) {
      setEstado('error');
      setMensaje(aiSettingsError || 'Espera a que se cargue la configuración del modelo de IA.');
      return;
    }
    if (!accessToken) {
      setEstado('error');
      setMensaje('Tu sesión expiró. Inicia sesión nuevamente para procesar el CV.');
      return;
    }
    if (!hasApiKey || !selectedModel) {
      setEstado('error');
      setMensaje('Conecta tu API key y selecciona un modelo de OpenRouter antes de procesar el CV.');
      return;
    }

    setEstado('cargando');
    setMensaje('Estamos procesando tu CV con el modelo seleccionado...');
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), CV_ANALYSIS_TIMEOUT_MS);
    const progressTimeouts = [
      window.setTimeout(() => setMensaje('Seguimos trabajando; estamos revisando el contenido de tu CV.'), 5_000),
      window.setTimeout(() => setMensaje('La lectura puede tardar un poco si el PDF tiene varias páginas o muchos datos.'), 15_000),
      window.setTimeout(() => setMensaje('El análisis sigue en curso. No cierres esta página; te avisaremos cuando termine.'), 45_000),
      window.setTimeout(() => setMensaje('Tu CV está tardando más de lo habitual. Puedes dejar esta ventana abierta mientras termina.'), 120_000),
    ];

    const formData = new FormData();
    formData.append('cv_file', archivo);

    try {
      const response = await fetch(`${API_URL}/auth/ia/procesar-cv`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      progressTimeouts.forEach(window.clearTimeout);
      if (!response.ok || !data.exito || !data.datos) {
        throw new Error(data.error || data.detail || 'No se pudo extraer el perfil del PDF.');
      }

      setMensaje('Análisis completo. Guardando los datos extraídos en tu perfil y en la base de datos...');

      const persistenceWarning = await onDataExtracted(data.datos);
      let archiveWarning = '';
      if (!persistenceWarning) {
        try {
          const savedFile = await saveOriginalProfileCV(ownerId, archivo);
          onCVStored(savedFile);
        } catch (error) {
          console.error('No se pudo guardar una copia del CV original:', error);
          archiveWarning = 'No se pudo guardar una copia descargable en este navegador.';
        }
      }

      setEstado(persistenceWarning ? 'error' : 'exito');
      const hasExperience = Array.isArray(data.datos.experience) && data.datos.experience.length > 0;
      const hasEducation = Array.isArray(data.datos.education) && data.datos.education.length > 0;
      const profileMessage = data.advertencia || (
        hasExperience && hasEducation
          ? '¡Perfil Maestro completado con éxito!'
          : 'Perfil actualizado parcialmente. Revisa y completa las secciones que no se detectaron.'
      );
      const persistenceMessage = persistenceWarning || 'Perfil sincronizado con la base de datos.';
      setMensaje([profileMessage, persistenceMessage, archiveWarning].filter(Boolean).join(' '));

    } catch (error) {
      setEstado('error');
      setMensaje(controller.signal.aborted
        ? 'El análisis superó el límite de 30 minutos. No se sincronizaron los datos; puedes volver a intentarlo.'
        : error instanceof Error ? error.message : 'Hubo un error al procesar el documento con la IA.');
    } finally {
      window.clearTimeout(timeoutId);
      progressTimeouts.forEach(window.clearTimeout);
    }
  };

  if (isLoadingProvider || aiSettingsError || !hasApiKey || !selectedModel) {
    return (
      <Card className="p-6 sm:p-8 border-primary/20 bg-primary/5">
        <h2 className="text-headline-sm text-on-surface flex items-center gap-2">
          <Sparkles size={20} className="text-primary" />
          Autocompletar con IA
        </h2>
        <p className="mt-2 text-body-md text-on-surface-variant">
          Antes de subir tu PDF, conecta un modelo de OpenRouter para poder analizar el currículum.
        </p>
        {isLoadingProvider ? (
          <p role="status" className="mt-4 text-body-sm text-on-surface-variant">
            Comprobando la configuración del modelo...
          </p>
        ) : aiSettingsError ? (
          <p role="alert" className="mt-4 rounded-md border border-error/30 bg-error-container/20 p-3 text-body-sm text-error">
            {aiSettingsError}
          </p>
        ) : (
          <p role="status" className="mt-4 text-body-sm text-on-surface-variant">
            No se ha configurado una API key y un modelo activo. No subas el PDF todavía: primero configura la conexión.
          </p>
        )}
        {!isLoadingProvider && (
          <Link
            href="/adaptador/modelo?manage=1"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-button bg-primary px-5 py-2.5 text-label-md font-semibold text-on-primary transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Configurar modelo de OpenRouter
          </Link>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8 border-primary/20 bg-primary/5 relative overflow-hidden">
      {/* Elemento decorativo sutil de IA */}
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col gap-6 relative z-10">

        {/* Cabecera del componente */}
        <div>
          <h2 className="text-headline-sm text-on-surface flex items-center gap-2 mb-2">
            <Sparkles size={20} className="text-primary" />
            Autocompletar con IA
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Ahorra tiempo. Sube tu currículum y nuestra Inteligencia Artificial extraerá automáticamente tu experiencia, habilidades y educación.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-body-sm text-on-surface-variant">
            <span>
              Modelo actual:{' '}
              <strong className="text-on-surface">
                {selectedModel?.name ?? 'OpenRouter sin modelo seleccionado'}
              </strong>
            </span>
            <Link href="/adaptador/modelo" className="font-semibold text-primary underline">
              Elegir modelo
            </Link>
          </div>
          {aiSettingsError && (
            <p role="alert" className="mt-3 flex items-start gap-2 rounded-md border border-error/30 bg-error-container/20 p-3 text-sm text-error">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              {aiSettingsError}
            </p>
          )}
        </div>

        {/* Zona de Drop */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-container cursor-pointer transition-all duration-200
            ${archivo
                ? 'border-success bg-success-container/20'
              : 'border-border bg-surface-container-low hover:bg-surface-container hover:border-primary/50'
            }
            ${estado === 'error' ? 'border-error bg-error-container/20' : ''}
          `}
        >
          <input
            type="file"
            ref={inputRef}
            onChange={handleSeleccionManual}
            accept="application/pdf"
            className="hidden"
          />

          {archivo ? (
            <div className="flex flex-col items-center text-on-success-container">
              <CheckCircle size={40} className="mb-3" aria-hidden="true" />
              <span className="font-semibold text-body-lg text-center">{archivo.name}</span>
              <span className="text-label-sm mt-1 opacity-70">{(archivo.size / 1024 / 1024).toFixed(2)} MB</span>
              <span className="mt-2 text-label-sm font-semibold">PDF listo para analizar</span>
            </div>
          ) : (
            <div className="flex flex-col items-center text-on-surface-variant text-center">
              <UploadCloud size={40} className="mb-3 opacity-80" />
              <span className="font-semibold text-body-lg text-on-surface">Haz clic o arrastra tu PDF aquí</span>
              <span className="text-label-sm mt-1">Máximo 5MB (Solo formato PDF)</span>
            </div>
          )}
        </div>

        {/* Feedback visual */}
        {mensaje && (
          <div className={`p-3 rounded-md flex items-center gap-3 text-body-sm font-medium
            ${estado === 'error' ? 'bg-error-container/30 text-error' : ''}
            ${estado === 'cargando' ? 'bg-primary-container/30 text-on-surface' : ''}
            ${estado === 'archivo-listo' || estado === 'exito' ? 'bg-success-container text-on-success-container' : ''}
          `}>
            {estado === 'error' && <AlertCircle size={18} className="shrink-0" />}
            {estado === 'cargando' && <Loader2 size={18} className="animate-spin shrink-0" />}
            {(estado === 'archivo-listo' || estado === 'exito') && <CheckCircle size={18} className="shrink-0" />}
            <span role={estado === 'error' ? 'alert' : 'status'} aria-live="polite">{mensaje}</span>
          </div>
        )}

        {/* Botón de acción usando tu UI kit */}
        <div className="flex justify-end mt-2">
          <Button
            onClick={procesarCV}
            disabled={!archivo || estado === 'cargando'}
            variant={estado === 'exito' ? 'success' : 'primary'}
            className="w-full sm:w-auto"
          >
            {estado === 'cargando' ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" /> Procesando con IA...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Sparkles size={16} /> Generar Perfil Maestro
              </span>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
