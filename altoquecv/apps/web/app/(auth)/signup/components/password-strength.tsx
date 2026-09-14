import React from 'react';
import { validatePassword } from '@/lib/auth';
import { Check, X } from 'lucide-react';

export function PasswordStrength({ password }: { password: string }) {
  const validation = validatePassword(password);
  
  const rules = [
    { label: 'Mínimo 8 caracteres', valid: password.length >= 8 },
    { label: 'Una mayúscula', valid: /[A-Z]/.test(password) },
    { label: 'Una minúscula', valid: /[a-z]/.test(password) },
    { label: 'Un número', valid: /\d/.test(password) },
  ];

  const getBarColor = () => {
    if (password.length === 0) return 'bg-surface-container-highest';
    if (validation.strength === 'fuerte') return 'bg-success';
    if (validation.strength === 'media') return 'bg-warning text-warning';
    return 'bg-error text-error';
  };

  const getLabel = () => {
    if (password.length === 0) return '';
    return validation.strength.charAt(0).toUpperCase() + validation.strength.slice(1);
  };

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between text-label-sm">
        <span className="text-on-surface-variant">Fortaleza:</span>
        <span className={`font-semibold ${getBarColor().replace('bg-', 'text-')}`}>{getLabel()}</span>
      </div>
      <div className="flex gap-1 h-1.5">
        <div className={`flex-1 rounded-full ${password.length > 0 ? getBarColor() : 'bg-surface-container-highest'}`} />
        <div className={`flex-1 rounded-full ${validation.strength === 'media' || validation.strength === 'fuerte' ? getBarColor() : 'bg-surface-container-highest'}`} />
        <div className={`flex-1 rounded-full ${validation.strength === 'fuerte' ? getBarColor() : 'bg-surface-container-highest'}`} />
      </div>
      <div className="grid grid-cols-2 gap-1 mt-2">
        {rules.map((rule, idx) => (
          <div key={idx} className={`flex items-center gap-1 text-[11px] ${rule.valid ? 'text-success' : 'text-on-surface-variant'}`}>
            {rule.valid ? <Check size={12} /> : <X size={12} />} {rule.label}
          </div>
        ))}
      </div>
    </div>
  );
}