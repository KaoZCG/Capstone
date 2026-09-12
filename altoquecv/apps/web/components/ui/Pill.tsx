import React from "react";

export function Pill({ className = "", children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-pill bg-surface-container border border-outline-variant px-3 py-1 text-label-sm text-on-surface-variant ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}