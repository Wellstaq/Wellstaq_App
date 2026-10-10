"use client";

import Link from "next/link";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function RouteError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div role="alert" className="w-full max-w-md rounded-[14px] border border-line bg-white p-8 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-error-5 text-error-1" aria-hidden="true">
          <AlertCircle className="h-6 w-6" />
        </span>
        <h1 className="mt-5 text-xl font-bold text-grey-1">This page hit a problem</h1>
        <p className="mt-2 text-sm leading-6 text-grey-2">Try again. If it keeps happening, reload the console.</p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="inline-flex h-10 items-center justify-center gap-2 rounded-[12px] bg-primary-hover px-6 text-sm font-medium text-white hover:bg-[#A84A00]">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Try again
          </button>
          <Link href="/" className="inline-flex h-10 items-center justify-center rounded-[12px] border border-line px-6 text-sm font-medium text-grey-1 hover:bg-grey-5">
            Go to overview
          </Link>
        </div>
      </div>
    </main>
  );
}
