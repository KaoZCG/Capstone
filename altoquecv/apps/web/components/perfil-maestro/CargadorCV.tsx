"use client";
import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { saveOriginalProfileCV, type StoredProfileCV } from '@/lib/profile-cv-storage';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

interface CargadorCVProps {
  ownerId: string;
  onDataExtracted: (datos: any) => void;
  onCVStored: (file: StoredProfileCV) => void;
}

export default function CargadorCV({ ownerId, onDataExtracted, onCVStored }: CargadorCVProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<'inactivo' | 'cargando' | 'exito' | 'error'>('inactivo');
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
    setEstado('inactivo');
    setMensaje('');
  };

  const procesarCV = async () => {
    if (!archivo) return;

    setEstado('cargando');
    setMensaje('La IA está analizando y estructurando tu perfil...');

    const formData = new FormData();
    formData.append('cv_file', archivo);

    try {
      const response = await fetch(`${API_URL}/auth/ia/procesar-cv`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.exito || !data.datos) {
        throw new Error(data.error || data.detail || 'No se pudo extraer el perfil del PDF.');
      }

      let archiveWarning = '';
      try {
        const savedFile = await saveOriginalProfileCV(ownerId, archivo);
        onCVStored(savedFile);
      } catch (error) {
        console.error('No se pudo guardar una copia del CV original:', error);
        archiveWarning = 'No se pudo guardar una copia descargable en este navegador.';
      }

      onDataExtracted(data.datos);
      setEstado('exito');
      const hasExperience = Array.isArray(data.datos.experience) && data.datos.experience.length > 0;
      const hasEducation = Array.isArray(data.datos.education) && data.datos.education.length > 0;
      const profileMessage = data.advertencia || (
        hasExperience && hasEducation
          ? '¡Perfil Maestro completado con éxito!'
          : 'Perfil actualizado parcialmente. Revisa y completa las secciones que no se detectaron.'
      );
      setMensaje([profileMessage, archiveWarning].filter(Boolean).join(' '));

    } catch (error) {
      setEstado('error');
      setMensaje(error instanceof Error ? error.message : 'Hubo un error al procesar el documento con la IA.');
    }
  };

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
        </div>

        {/* Zona de Drop */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-container cursor-pointer transition-all duration-200
            ${archivo
              ? 'border-primary bg-primary/10'
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
            <div className="flex flex-col items-center text-primary">
              <FileText size={40} className="mb-3 opacity-90" />
              <span className="font-semibold text-body-lg text-center">{archivo.name}</span>
              <span className="text-label-sm mt-1 opacity-70">{(archivo.size / 1024 / 1024).toFixed(2)} MB</span>
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
            ${estado === 'cargando' ? 'bg-primary-container/30 text-primary' : ''}
            ${estado === 'exito' ? 'bg-success-container/30 text-success' : ''}
          `}>
            {estado === 'error' && <AlertCircle size={18} className="shrink-0" />}
            {estado === 'cargando' && <Loader2 size={18} className="animate-spin shrink-0" />}
            {estado === 'exito' && <CheckCircle size={18} className="shrink-0" />}
            <span>{mensaje}</span>
          </div>
        )}

        {/* Botón de acción usando tu UI kit */}
        <div className="flex justify-end mt-2">
          <Button
            onClick={procesarCV}
            disabled={!archivo || estado === 'cargando'}
            variant="primary"
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
