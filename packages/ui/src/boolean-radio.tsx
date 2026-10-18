"use client";

import { useId } from "react";

export function BooleanRadio({ label, value, onChange }: { label: string; value: boolean; onChange: (value: boolean) => void }) {
  const name = useId();
  return <fieldset className="min-w-0 space-y-2">
    <legend className="text-sm font-medium text-grey-2">{label}</legend>
    <div className="grid grid-cols-2 gap-2">
      {[true, false].map(option => <label key={String(option)} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-[8px] border px-3 text-sm ${value === option ? "border-primary-1 bg-primary-5 text-grey-1" : "border-grey-4 text-grey-2"}`}>
        <input type="radio" name={name} value={String(option)} checked={value === option} onChange={() => onChange(option)} className="h-4 w-4 shrink-0 accent-primary-1" />
        {option ? "Yes" : "No"}
      </label>)}
    </div>
  </fieldset>;
}
