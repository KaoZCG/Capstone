import React from "react";
import { Input } from "./Input";
import { Select } from "./Select";

interface PhoneInputProps {
  value?: string;
  onChange?: (value: string) => void;
  error?: boolean;
  valid?: boolean;
  countryCode?: string;
  onCountryCodeChange?: (code: string) => void;
  placeholder?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      onChange,
      error,
      valid,
      countryCode = "+56",
      onCountryCodeChange,
      placeholder = "9 1234 5678",
    },
    ref
  ) => {
    return (
      <div className="flex gap-2">
        <Select
          value={countryCode}
          onChange={(e) => onCountryCodeChange?.(e.target.value)}
          className="w-24 flex-shrink-0"
          error={error}
          valid={valid}
        >
          <option value="+56">+56</option>
          <option value="+54">+54 (AR)</option>
          <option value="+57">+57 (CO)</option>
          <option value="+55">+55 (BR)</option>
          <option value="+51">+51 (PE)</option>
        </Select>
        <Input
          ref={ref}
          type="tel"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          error={error}
          valid={valid}
          className="flex-1"
        />
      </div>
    );
  }
);
PhoneInput.displayName = "PhoneInput";
