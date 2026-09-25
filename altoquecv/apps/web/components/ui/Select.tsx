import React from "react";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  valid?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", error, valid, ...props }, ref) => {
    let stateClasses = "border-outline focus:border-primary focus:ring-1 focus:ring-primary";
    if (error) stateClasses = "border-error focus:border-error focus:ring-1 focus:ring-error text-error";
    if (valid) stateClasses = "border-success focus:border-success focus:ring-1 focus:ring-success";

    return (
      <select
        ref={ref}
        className={`flex h-10 rounded-input border bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50 ${stateClasses} ${className}`}
        {...props}
      />
    );
  }
);
Select.displayName = "Select";
