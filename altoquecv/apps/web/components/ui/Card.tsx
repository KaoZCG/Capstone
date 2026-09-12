import React from "react";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`bg-surface-container-lowest border border-border rounded-card p-6 shadow-sm hover:shadow-md transition-shadow dark:shadow-none dark:hover:bg-surface-container-low ${className}`}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";