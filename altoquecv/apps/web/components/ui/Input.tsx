import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  valid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", error, valid, ...props }, ref) => {
    let stateClasses = "border-outline focus:border-primary focus:ring-1 focus:ring-primary";
    if (error) stateClasses = "border-error focus:border-error focus:ring-1 focus:ring-error text-error";
    if (valid) stateClasses = "border-success focus:border-success focus:ring-1 focus:ring-success";

    return (
      <input
        ref={ref}
        className={`flex h-10 w-full rounded-input border bg-surface-container-lowest px-3 py-2 text-body-md text-on-surface placeholder:text-on-surface-variant outline-none transition-all disabled:cursor-not-allowed disabled:opacity-50 ${stateClasses} ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";