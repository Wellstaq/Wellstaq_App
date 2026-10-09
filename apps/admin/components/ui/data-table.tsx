"use client";

import type { KeyboardEvent, ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@wellstaq/ui/utils";

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** Hidden on the mobile card layout (the primary column is always the card title). */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  caption: string;
  onRowClick?: (row: T) => void;
}

/**
 * Responsive table: a real <table> from md up, stacked cards below it
 * (the same table-to-card pattern used on the org Teams page).
 */
export function DataTable<T>({ rows, columns, getRowId, caption, onRowClick }: DataTableProps<T>) {
  const [primary, ...rest] = columns;
  const activate = (row: T) => onRowClick?.(row);
  const onKeyDown = (event: KeyboardEvent, row: T) => {
    if (!onRowClick || (event.key !== "Enter" && event.key !== " ")) return;
    if (event.target !== event.currentTarget) return;
    event.preventDefault();
    activate(row);
  };

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-grey-4 text-xs font-medium uppercase tracking-wide text-grey-2">
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn("whitespace-nowrap px-4 py-3 font-medium", column.className)}>{column.header}</th>
              ))}
              {onRowClick && <th scope="col" className="w-10 px-2"><span className="sr-only">Open</span></th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowId(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => activate(row) : undefined}
                onKeyDown={(event) => onKeyDown(event, row)}
                className={cn("border-b border-grey-4 last:border-b-0", onRowClick && "cursor-pointer transition-colors hover:bg-grey-5 focus-visible:bg-grey-5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary-1")}
              >
                {columns.map((column) => (
                  <td key={column.key} className={cn("px-4 py-3 align-middle text-sm text-grey-2", column.className)}>{column.render(row)}</td>
                ))}
                {onRowClick && <td className="px-2 text-grey-3"><ChevronRight className="h-4 w-4" aria-hidden="true" /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="flex flex-col gap-3 md:hidden" aria-label={caption}>
        {rows.map((row) => {
          const body = (
            <>
              <div className="min-w-0">{primary.render(row)}</div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3">
                {rest.filter((column) => !column.hideOnMobile).map((column) => (
                  <div key={column.key} className="min-w-0">
                    <dt className="text-xs text-grey-3">{column.header}</dt>
                    <dd className="mt-0.5 truncate text-sm text-grey-2">{column.render(row)}</dd>
                  </div>
                ))}
              </dl>
            </>
          );
          return (
            <li key={getRowId(row)}>
              {onRowClick ? (
                <button type="button" onClick={() => activate(row)} className="w-full rounded-[12px] border border-grey-4 bg-white p-4 text-left transition-colors hover:bg-grey-5 active:scale-[0.99]">
                  {body}
                </button>
              ) : (
                <div className="rounded-[12px] border border-grey-4 bg-white p-4">{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
