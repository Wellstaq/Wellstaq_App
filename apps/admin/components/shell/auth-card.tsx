import Image from "next/image";
import type { ReactNode } from "react";

const LOGO = "https://res.cloudinary.com/dv7yvatu2/image/upload/f_auto,q_auto,w_320/v1772170704/wellstaq_logo_raxmmg.png";

export function AuthCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-grey-5 px-4 py-10">
      <div className="mb-8 flex flex-col items-center gap-2">
        <Image src={LOGO} alt="Wellstaq" width={140} height={36} className="object-contain" referrerPolicy="no-referrer" priority />
        <span className="rounded-[6px] border border-grey-4 bg-white px-2 py-0.5 text-xs font-semibold text-grey-2">Admin console</span>
      </div>
      <div className="w-full max-w-[420px] rounded-[12px] border border-grey-4 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-grey-1">{title}</h1>
        {description && <p className="mt-1 text-sm leading-6 text-grey-2">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      <p className="mt-6 max-w-[420px] text-center text-xs leading-5 text-grey-2">
        For authorized Wellstaq staff only. Activity in this console is recorded.
      </p>
    </main>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "info" | "success"; children: ReactNode }) {
  const styles = {
    error: "border-error-4 bg-error-5 text-error-1",
    info: "border-grey-4 bg-grey-5 text-grey-2",
    success: "border-secondary-3 bg-secondary-4 text-success-1",
  }[tone];
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mb-5 rounded-[8px] border px-3 py-2 text-sm ${styles}`}>
      {children}
    </p>
  );
}
