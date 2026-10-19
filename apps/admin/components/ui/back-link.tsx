import Link from "next/link";
import { ChevronLeft } from "@wellstaq/ui/icons";

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="flex w-fit items-center justify-start gap-2 rounded-sm text-sm text-grey-2 transition-colors hover:text-grey-1">
      <ChevronLeft className="h-4 w-4" aria-hidden="true" />
      {children}
    </Link>
  );
}
