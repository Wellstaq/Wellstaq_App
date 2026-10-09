"use client";

import { Search, X } from "lucide-react";
import { SelectablePill } from "@wellstaq/ui/selectable-pill";

export function SearchInput({ value, onChange, label, placeholder }: { value: string; onChange: (value: string) => void; label: string; placeholder: string }) {
  return (
    <div className="relative w-full sm:w-[320px] sm:shrink-0">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-3" aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
        className="h-10 w-full rounded-[8px] border border-grey-4 bg-white pl-9 pr-9 text-sm text-grey-1 placeholder:text-grey-3 focus:border-primary-1 focus:outline-none focus:ring-2 focus:ring-primary-1/20 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" aria-label="Clear search" onClick={() => onChange("")} className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-grey-3 hover:bg-grey-5 hover:text-grey-1">
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

export function FilterPills<T extends string>({ options, value, onChange, label }: { options: { value: T; label: string }[]; value: T; onChange: (value: T) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="no-scrollbar flex w-full items-center overflow-x-auto sm:w-auto">
      {options.map((option) => (
        <SelectablePill key={option.value} selected={value === option.value} appearance="plain" onClick={() => onChange(option.value)} className="whitespace-nowrap">
          {option.label}
        </SelectablePill>
      ))}
    </div>
  );
}

export function Toolbar({ children }: { children: React.ReactNode }) {
  return <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">{children}</div>;
}
