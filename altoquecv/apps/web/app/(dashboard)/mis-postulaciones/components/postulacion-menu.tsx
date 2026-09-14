import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Eye, ArrowRightCircle, Trash2 } from 'lucide-react';
import { Postulacion, PostulacionStatus } from '@/types';

interface MenuProps {
  postulacion: Postulacion;
  onViewDetails: () => void;
  onMove: (status: PostulacionStatus) => void;
  onDelete: () => void;
}

const statuses: { value: PostulacionStatus; label: string }[] = [
  { value: 'postulada', label: 'Postuladas' },
  { value: 'cv-en-revision', label: 'CV en Revisión' },
  { value: 'entrevista-agendada', label: 'Entrevista Agendada' },
  { value: 'oferta-negociacion', label: 'Ofertas / Negociación' },
];

export function PostulacionMenu({ postulacion, onViewDetails, onMove, onDelete }: MenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showMoveSubmenu, setShowMoveSubmenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowMoveSubmenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container-high transition-colors cursor-pointer"
      >
        <MoreVertical size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-6 w-48 bg-surface-container-highest border border-border rounded-card shadow-lg z-20 py-1">
          <button
            onClick={() => { onViewDetails(); setIsOpen(false); }}
            className="w-full text-left px-4 py-2 text-label-sm text-on-surface hover:bg-surface-container flex items-center gap-2"
          >
            <Eye size={14} /> Ver detalles
          </button>
          
          <div 
            className="relative"
            onMouseEnter={() => setShowMoveSubmenu(true)}
            onMouseLeave={() => setShowMoveSubmenu(false)}
          >
            <button className="w-full text-left px-4 py-2 text-label-sm text-on-surface hover:bg-surface-container flex items-center gap-2 justify-between">
              <span className="flex items-center gap-2"><ArrowRightCircle size={14} /> Mover a...</span>
              <span>›</span>
            </button>
            
            {showMoveSubmenu && (
              <div className="absolute right-full top-0 w-48 bg-surface-container-highest border border-border rounded-card shadow-lg py-1 mr-1">
                {statuses.filter(s => s.value !== postulacion.status).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => { onMove(s.value); setIsOpen(false); setShowMoveSubmenu(false); }}
                    className="w-full text-left px-4 py-2 text-label-sm text-on-surface hover:bg-surface-container"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (window.confirm('¿Seguro que deseas eliminar esta postulación?')) {
                onDelete();
                setIsOpen(false);
              }
            }}
            className="w-full text-left px-4 py-2 text-label-sm text-error hover:bg-error-container/20 flex items-center gap-2"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      )}
    </div>
  );
}