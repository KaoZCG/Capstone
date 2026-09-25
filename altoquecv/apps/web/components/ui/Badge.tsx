import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "neutral";
}

export function Badge({ className = "", variant = "neutral", children, ...props }: BadgeProps) {
  const variants = {
    success: "bg-success-container text-on-success-container",
    neutral: "bg-surface-container-high text-on-surface",
  };

  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-label-sm font-medium ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}