import React from 'react';
import { RefreshCw, Link as LinkIcon, Unlink, AlertCircle } from 'lucide-react';
import { PortalIntegracion } from '@/types';
import { Button } from '@/components/ui/Button';

interface PortalCardProps {
  portal: PortalIntegracion;
  isSyncing: boolean;
  onSync: () => void;
  onToggleConnect: () => void;
}

export function PortalCard({ portal, isSyncing, onSync, onToggleConnect }: PortalCardProps) {
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Nunca';
    return new Date(isoString).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-surface-container-low border border-border rounded-card p-5 flex flex-col justify-between transition-all hover:border-primary/30">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-headline-sm text-on-surface capitalize">{portal.nombre}</h3>
        <span className={`px-2 py-0.5 rounded-pill text-label-sm font-semibold flex items-center gap-1 ${
          portal.conectado ? 'bg-success-container/20 text-success' : 'bg-surface-container-highest text-on-surface-variant'
        }`}>
          {portal.conectado ? <LinkIcon size={12} /> : <Unlink size={12} />}
          {portal.conectado ? 'Conectado' : 'Desconectado'}
        </span>
      </div>

      <div className="mb-5 text-label-sm text-on-surface-variant">
        {portal.conectado ? (
          <p>Última sync: <span className="font-medium text-on-surface">{formatTime(portal.ultimaSincronizacion)}</span></p>
        ) : (
          <p className="flex items-center gap-1"><AlertCircle size={14} /> Requiere login mediante extensión</p>
        )}
      </div>

      <div className="flex gap-2 mt-auto">
        {portal.conectado ? (
          <>
            <Button 
              variant="secondary" 
              className="flex-1 gap-2 text-label-sm" 
              onClick={onSync}
              disabled={isSyncing}
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
            <Button variant="ghost" className="px-3 text-error hover:bg-error-container/10" onClick={onToggleConnect}>
              <Unlink size={16} />
            </Button>
          </>
        ) : (
          <Button variant="primary" className="w-full gap-2 text-label-sm" onClick={onToggleConnect}>
            Conectar Portal
          </Button>
        )}
      </div>
    </div>
  );
}