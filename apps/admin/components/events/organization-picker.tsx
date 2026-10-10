"use client";

import { useState } from "react";
import { Check, LoaderCircle, Search, X } from "lucide-react";
import { adminApi } from "@/services/admin-api";
import { useDebouncedValue, useResource } from "@/lib/use-resource";
import { plural } from "@/lib/format";

export interface PickedOrganization {
  id: string;
  name: string;
}

export function OrganizationPicker({ value, onChange, invalid }: { value: PickedOrganization[]; onChange: (value: PickedOrganization[]) => void; invalid?: boolean }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query.trim());
  const results = useResource(
    (signal) => adminApi.organizations.list({ q: debouncedQuery || undefined, status: "active", limit: 8 }, { signal }),
    [debouncedQuery],
  );
  const selectedIds = new Set(value.map((organization) => organization.id));

  const toggle = (organization: PickedOrganization) => {
    onChange(selectedIds.has(organization.id) ? value.filter((item) => item.id !== organization.id) : [...value, organization]);
  };

  return (
    <div className="flex flex-col gap-3">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Selected organizations">
          {value.map((organization) => (
            <li key={organization.id} className="inline-flex h-10 items-center gap-1 rounded-[8px] border border-primary-border bg-primary-5 pl-2.5 pr-1 text-xs font-medium text-warning-text">
              {organization.name}
              <button type="button" onClick={() => toggle(organization)} aria-label={`Remove ${organization.name}`} className="flex h-10 w-8 items-center justify-center rounded hover:bg-primary-mid">
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={`overflow-hidden rounded-[8px] border bg-white ${invalid ? "border-error-1" : "border-line"}`}>
        <div className="relative border-b border-line">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grey-3" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search organizations"
            placeholder="Search organizations"
            className="h-10 w-full bg-transparent pl-9 pr-3 text-sm text-grey-1 placeholder:text-grey-3 focus:outline-none"
          />
        </div>
        <div className="max-h-52 overflow-y-auto" aria-live="polite">
          {results.isLoading ? (
            <p className="flex items-center gap-2 px-3 py-3 text-sm text-grey-2">
              <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden="true" />
              Loading organizations...
            </p>
          ) : results.error ? (
            <p className="px-3 py-3 text-sm text-error-1">
              {results.error.message}{" "}
              <button type="button" onClick={results.reload} className="inline-flex h-10 items-center font-medium underline">Try again</button>
            </p>
          ) : !results.data?.items.length ? (
            <p className="px-3 py-3 text-sm text-grey-2">{debouncedQuery ? "No active organizations match that search." : "No active organizations yet."}</p>
          ) : (
            <ul role="listbox" aria-multiselectable="true" aria-label="Organizations">
              {results.data.items.map((organization) => {
                const selected = selectedIds.has(organization.id);
                return (
                  <li key={organization.id} role="option" aria-selected={selected}>
                    <button type="button" onClick={() => toggle({ id: organization.id, name: organization.name })} className="flex h-10 w-full items-center justify-between gap-3 px-3 text-left hover:bg-grey-5">
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-grey-1">{organization.name}</span>
                        <span className="block text-xs text-grey-2">{plural(organization.employeeCount, "employee")}</span>
                      </span>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border ${selected ? "border-primary-hover bg-primary-hover text-white" : "border-grey-3"}`} aria-hidden="true">
                        {selected && <Check className="h-3.5 w-3.5" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
