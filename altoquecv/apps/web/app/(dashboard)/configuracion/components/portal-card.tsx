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
  return (
    <div className="bg-surface-container-low border border-border rounded-card p-5 flex flex-col justify-between transition-all hover:border-primary/30">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-headline-sm text-on-surface capitalize">{portal.nombre}</h3>
        <span className={`px-2 py-0.5 rounded-pill text-label-sm font-semibold flex items-center gap-1 ${
          portal.conectado ? 'bg-success-container/20 text-success' : 'bg-surface-container-highest text-on-surface-variant'
        }`}>
          {portal.conectado ? <LinkIcon size={12} /> : <Unlink size={12} />}
          {portal.conectado ? 'Habilitado' : 'Deshabilitado'}
        </span>
      </div>

      <div className="mb-5 text-label-sm text-on-surface-variant">
        {portal.conectado ? (
          <p>Preferencia local activa; la sincronización automática no está disponible.</p>
        ) : (
          <p className="flex items-center gap-1"><AlertCircle size={14} /> Puedes habilitarlo como preferencia local.</p>
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
            Habilitar portal
          </Button>
        )}
      </div>
    </div>
  );
}