import Link from "next/link";
import { Compass } from "@wellstaq/ui/icons";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 text-center">
      <span className="empty-state-icon mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-grey-5" aria-hidden="true">
        <Compass className="h-9 w-9" strokeWidth={1.6} />
      </span>
      <h1 className="mb-2 text-2xl font-bold text-grey-1">Page not found</h1>
      <p className="mb-8 max-w-md text-sm leading-6 text-grey-2">This page doesn&apos;t exist in the admin console. Check the address or go back to the overview.</p>
      <Link href="/" className="inline-flex h-10 items-center rounded-[12px] bg-primary-hover px-6 text-sm font-medium text-white transition-colors hover:bg-[#A84A00]">
        Go to overview
      </Link>
    </main>
  );
}
