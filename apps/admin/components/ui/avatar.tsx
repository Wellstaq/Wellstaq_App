import Image from "next/image";
import { cn } from "@wellstaq/ui/utils";
import { initials } from "@/lib/format";

export function Avatar({ name, src, size = 32, square = false, className }: { name: string; src?: string | null; size?: number; square?: boolean; className?: string }) {
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-primary-5 font-semibold text-primary-hover", square ? "rounded-[10px]" : "rounded-full", className)}
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      aria-hidden="true"
    >
      {src ? <Image src={src} alt="" fill sizes={`${size}px`} className="object-cover" referrerPolicy="no-referrer" /> : initials(name)}
    </span>
  );
}

export function PersonCell({ name, detail, src }: { name: string; detail?: string | null; src?: string | null }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} src={src} />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-grey-1">{name}</p>
        {detail && <p className="truncate text-xs text-grey-2">{detail}</p>}
      </div>
    </div>
  );
}
