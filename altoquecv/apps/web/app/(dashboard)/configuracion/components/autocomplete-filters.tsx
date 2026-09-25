import React, { useState } from 'react';
import { AutocompleteConfig } from '@/types';
import { X } from 'lucide-react';

interface FiltersProps {
  filtros: AutocompleteConfig['filtros'];
  onChange: (nuevosFiltros: AutocompleteConfig['filtros']) => void;
}

export function AutocompleteFilters({ filtros, onChange }: FiltersProps) {
  const [comunaInput, setComunaInput] = useState('');

  const updateFiltro = (key: keyof AutocompleteConfig['filtros'], value: any) => {
    onChange({ ...filtros, [key]: value });
  };

  const handleAddComuna = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && comunaInput.trim()) {
      e.preventDefault();
      if (!filtros.comunas.includes(comunaInput.trim())) {
        updateFiltro('comunas', [...filtros.comunas, comunaInput.trim()]);
      }
      setComunaInput('');
    }
  };

  const removeComuna = (comunaToRemove: string) => {
    updateFiltro('comunas', filtros.comunas.filter(c => c !== comunaToRemove));
  };

  return (
    <div className="space-y-6">
      {/* Slider Compatibilidad */}
      <div>
        <div className="flex justify-between mb-2">
          <label className="text-label-md text-on-surface">Compatibilidad Mínima requerida</label>
          <span className="text-primary font-semibold">{filtros.minCompatibilidad}%</span>
        </div>
        <input 
          type="range" 
          min="0" max="100" 
          value={filtros.minCompatibilidad}
          onChange={(e) => updateFiltro('minCompatibilidad', parseInt(e.target.value))}
          className="w-full h-2 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary"
        />
      </div>

      {/* Toggles */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={filtros.soloEnRM}
            onChange={(e) => updateFiltro('soloEnRM', e.target.checked)}
            className="w-4 h-4 text-primary bg-surface-container border-border rounded focus:ring-primary accent-primary"
          />
          <span className="text-body-md text-on-surface">Solo ofertas en la Región Metropolitana (RM)</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={filtros.soloTiempoCompleto}
            onChange={(e) => updateFiltro('soloTiempoCompleto', e.target.checked)}
            className="w-4 h-4 text-primary bg-surface-container border-border rounded focus:ring-primary accent-primary"
          />
          <span className="text-body-md text-on-surface">Solo ofertas de Tiempo Completo</span>
        </label>
      </div>

      {/* Tags Comunas */}
      <div>
        <label className="text-label-md text-on-surface block mb-2">Comunas Preferidas (Presiona Enter para agregar)</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {filtros.comunas.map(com => (
            <span key={com} className="flex items-center gap-1 bg-surface-container-highest text-on-surface px-3 py-1 rounded-pill text-label-sm">
              {com}
              <button onClick={() => removeComuna(com)} className="text-on-surface-variant hover:text-error ml-1"><X size={14}/></button>
            </span>
          ))}
        </div>
        <input 
          type="text" 
          placeholder="Ej: Providencia..." 
          value={comunaInput}
          onChange={(e) => setComunaInput(e.target.value)}
          onKeyDown={handleAddComuna}
          className="w-full px-4 py-2 bg-surface-container border border-border rounded-input text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}