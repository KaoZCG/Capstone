import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center rounded-button text-label-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none px-4 py-2";
    
    const variants = {
      primary: "bg-primary text-on-primary hover:bg-primary-container hover:text-on-primary-container",
      secondary: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest",
      ghost: "bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface",
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variants[variant]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";