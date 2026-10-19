"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

interface SearchableSelectProps {
  id: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
}

function normalizeSearch(value: string): string {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-CL");
}

export function SearchableSelect({
  id,
  value,
  options,
  onChange,
  placeholder,
  disabled = false,
}: SearchableSelectProps) {
  const [query, setQuery] = useState(value);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isOpen) setQuery(value);
  }, [isOpen, value]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeSearch(query.trim());
    return options.filter((option) => normalizeSearch(option).includes(normalizedQuery));
  }, [options, query]);

  const selectOption = (option: string) => {
    setQuery(option);
    setIsOpen(false);
    onChange(option);
  };

  return (
    <div className="relative">
      <div className="relative">
        <input
          id={id}
          type="search"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
          aria-activedescendant={
            isOpen && filteredOptions[activeIndex] ? `${id}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => {
              setIsOpen(false);
              setQuery(value);
            }, 120);
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setIsOpen(true);
            setActiveIndex(0);
            if (value && normalizeSearch(nextQuery) !== normalizeSearch(value)) onChange("");
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowDown" && filteredOptions.length > 0) {
              event.preventDefault();
              if (!isOpen) {
                setIsOpen(true);
                setActiveIndex(0);
              } else {
                setActiveIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
              }
            } else if (event.key === "ArrowUp" && filteredOptions.length > 0) {
              event.preventDefault();
              if (!isOpen) {
                setIsOpen(true);
                setActiveIndex(filteredOptions.length - 1);
              } else {
                setActiveIndex((index) => Math.max(index - 1, 0));
              }
            } else if (event.key === "Enter" && isOpen && filteredOptions[activeIndex]) {
              event.preventDefault();
              selectOption(filteredOptions[activeIndex]);
            } else if (event.key === "Escape") {
              setIsOpen(false);
              setQuery(value);
            }
          }}
          className="h-10 w-full rounded-input border border-outline bg-surface-container-lowest px-3 py-2 pr-10 text-body-md text-on-surface outline-none transition-all placeholder:text-on-surface-variant focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <ChevronDown size={16} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
      </div>
      {isOpen && !disabled && (
        <ul
          id={`${id}-options`}
          role="listbox"
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-input border border-border bg-surface-container-lowest py-1 shadow-lg"
        >
          {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
            <li
              key={option}
              id={`${id}-option-${index}`}
              role="option"
              aria-selected={option === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectOption(option)}
              className={`cursor-pointer px-3 py-2 text-body-md text-on-surface hover:bg-surface-container ${
                index === activeIndex ? "bg-surface-container" : ""
              }`}
            >
              {option}
            </li>
          )) : (
            <li className="px-3 py-2 text-body-sm text-on-surface-variant">No hay coincidencias.</li>
          )}
        </ul>
      )}
    </div>
  );
}
