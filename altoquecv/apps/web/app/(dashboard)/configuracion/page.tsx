'use client';

import React, { useState } from 'react';
import { Settings2, Cpu } from 'lucide-react';
import { portalesMock, autocompleteMockConfig } from '@/lib/mock/portales.mock';
import { useSyncConsole } from '@/hooks/use-sync-console';

import { PortalCard } from './components/portal-card';
import { RuleItem } from './components/rule-item';
import { AutocompleteFilters } from './components/autocomplete-filters';
import { SyncConsole } from './components/sync-console';

export default function ConfiguracionPortalesPage() {
  const [portales, setPortales] = useState(portalesMock);
  const [config, setConfig] = useState(autocompleteMockConfig);
  const { state: consoleState, sincronizarAhora, clearLogs } = useSyncConsole();

  const handleToggleConnect = (id: string) => {
    setPortales(prev => prev.map(p => 
      p.id === id ? { ...p, conectado: !p.conectado } : p
    ));
  };

  const handleToggleRule = (id: string) => {
    setConfig(prev => ({
      ...prev,
      rules: prev.rules.map(r => r.id === id ? { ...r, habilitado: !r.habilitado } : r)
    }));
  };

  return (
    <div className="space-y-8 pb-10">
      <header>
        <h1 className="text-headline-lg text-on-surface mb-2 flex items-center gap-3">
          <Settings2 className="text-primary" size={32} /> Configuración y Portales
        </h1>
        <p className="text-body-lg text-on-surface-variant">
          Administra las conexiones a bolsas de empleo y define las reglas de intervención del copiloto.
        </p>
      </header>

      {/* Sección 1: Portales */}
      <section>
        <h2 className="text-headline-sm text-on-surface mb-4">Estado de Integración de Portales</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {portales.map(portal => (
            <PortalCard 
              key={portal.id}
              portal={portal}
              isSyncing={consoleState.sincronizandoAhora}
              onToggleConnect={() => handleToggleConnect(portal.id)}
              onSync={() => sincronizarAhora(portal.id)}
            />
          ))}
        </div>
      </section>

      {/* Sección 2: Layout de Grilla para Filtros y Consola */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Columna Izquierda: Reglas y Filtros */}
        <div className="xl:col-span-7 space-y-6">
          <section className="bg-surface-container-lowest border border-border rounded-container p-6">
            <h2 className="text-headline-sm text-on-surface mb-4 flex items-center gap-2">
              <Cpu size={20} className="text-primary"/> Reglas de Autocompletado Automático
            </h2>
            <p className="text-body-sm text-on-surface-variant mb-6">
              Define qué información personal y profesional debe rellenar la extensión automáticamente cuando se detecte un formulario.
            </p>
            <div className="bg-surface-container-low rounded-card border border-border px-4 py-2">
              {config.rules.map(rule => (
                <RuleItem key={rule.id} rule={rule} onToggle={handleToggleRule} />
              ))}
            </div>
          </section>

          <section className="bg-surface-container-lowest border border-border rounded-container p-6">
            <h2 className="text-headline-sm text-on-surface mb-6">Filtros de Intervención</h2>
            <AutocompleteFilters 
              filtros={config.filtros} 
              onChange={(nuevosFiltros) => setConfig({ ...config, filtros: nuevosFiltros })}
            />
          </section>
        </div>

        {/* Columna Derecha: Consola */}
        <div className="xl:col-span-5">
          <h2 className="text-headline-sm text-on-surface mb-4">Registro de Actividad (Live)</h2>
          <SyncConsole 
            logs={consoleState.logs} 
            ultimaSincronizacion={consoleState.ultimaSincronizacion}
            onClear={clearLogs}
          />
        </div>
      </div>
    </div>
  );
}