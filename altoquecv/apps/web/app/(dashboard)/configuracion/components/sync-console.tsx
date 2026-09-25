import React from 'react';
import { SyncLogEntry } from '@/types';
import { Terminal, Trash2, CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SyncConsoleProps {
  logs: SyncLogEntry[];
  ultimaSincronizacion?: string;
  onClear: () => void;
}

export function SyncConsole({ logs, ultimaSincronizacion, onClear }: SyncConsoleProps) {
  const getIcon = (tipo: SyncLogEntry['tipo']) => {
    switch(tipo) {
      case 'success': return <CheckCircle2 size={14} className="text-success mt-0.5" />;
      case 'error': return <XCircle size={14} className="text-error mt-0.5" />;
      case 'warning': return <AlertCircle size={14} className="text-warning mt-0.5" />;
      default: return <Info size={14} className="text-primary mt-0.5" />;
    }
  };

  return (
    <div className="bg-[#0f172a] rounded-container border border-slate-700 flex flex-col h-[500px] overflow-hidden text-slate-300 font-mono text-sm shadow-inner">
      <div className="bg-slate-800/80 border-b border-slate-700 p-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={16} className="text-slate-400" />
          <span className="font-semibold text-slate-200">Plasmo Bridge (Live Log)</span>
        </div>
        <Button variant="ghost" className="h-8 px-2 text-slate-400 hover:text-error hover:bg-slate-700/50" onClick={onClear}>
          <Trash2 size={14} className="mr-2" /> Limpiar
        </Button>
      </div>
      
      <div className="p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
        {logs.length === 0 ? (
          <div className="text-slate-500 italic text-center mt-10">Esperando eventos de sincronización...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex gap-3">
              <span className="text-slate-500 shrink-0">
                [{new Date(log.timestamp).toLocaleTimeString('es-CL')}]
              </span>
              <div className="shrink-0">{getIcon(log.tipo)}</div>
              <div className="flex-1">
                <span className="font-bold text-slate-200 capitalize mr-2">{log.portal}:</span>
                <span className={log.tipo === 'error' ? 'text-red-400' : 'text-slate-300'}>
                  {log.mensaje}
                </span>
                {log.detalles && (
                  <p className="text-slate-400 mt-0.5 text-xs border-l-2 border-slate-700 pl-2 ml-1">
                    ↳ {log.detalles}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}