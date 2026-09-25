import React from 'react';

interface ATSScoreGaugeProps {
  score: number;
  label?: string;
}

export function ATSScoreGauge({ score, label = "Compatibilidad ATS" }: ATSScoreGaugeProps) {
  const getScoreColor = (value: number) => {
    if (value >= 85) return 'text-success stroke-success';
    if (value >= 70) return 'text-primary stroke-primary';
    return 'text-error stroke-error';
  };

  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-surface-container-low rounded-container border border-border">
      <div className="relative w-40 h-40 flex items-center justify-center">
        {/* Círculo de fondo */}
        <svg className="absolute inset-0 w-full h-full -rotate-90">
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            className="stroke-surface-container-highest"
            strokeWidth="12"
          />
          {/* Círculo de progreso */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="flex flex-col items-center z-10">
          <span className={`text-display-lg font-bold ${getScoreColor(score).split(' ')[0]}`}>
            {score}
          </span>
          <span className="text-label-md text-on-surface-variant">%</span>
        </div>
      </div>
      <h3 className="text-label-lg text-on-surface mt-4 font-semibold">{label}</h3>
    </div>
  );
}