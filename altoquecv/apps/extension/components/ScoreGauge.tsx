import React from 'react';

export function ScoreGauge({ score, size = 80 }: { score: number; size?: number }) {
  const getColorClasses = (v: number) => {
    if (v >= 85) return 'text-success stroke-success';
    if (v >= 70) return 'text-warning stroke-warning';
    return 'text-error stroke-error';
  };

  const radius = size / 2.5;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute inset-0 w-full h-full -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" className="stroke-surface-container-highest" strokeWidth={strokeWidth} />
        <circle cx={size/2} cy={size/2} r={radius} fill="transparent" className={getColorClasses(score)} strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <span className={`font-bold text-lg ${getColorClasses(score).split(' ')[0]}`}>{score}%</span>
    </div>
  );
}