import React from 'react';
import { AutocompleteRule } from '@/types';

interface RuleItemProps {
  rule: AutocompleteRule;
  onToggle: (id: string) => void;
}

export function RuleItem({ rule, onToggle }: RuleItemProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-body-md text-on-surface font-medium">{rule.nombreCampo}</span>
      
      {/* Custom Switch / Toggle */}
      <button
        type="button"
        role="switch"
        aria-checked={rule.habilitado}
        onClick={() => onToggle(rule.id)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
          rule.habilitado ? 'bg-primary' : 'bg-surface-container-highest'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            rule.habilitado ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}