import Image from "next/image";
import type { ReactNode } from "react";

const LOGO = "/assets/logo.webp";

/** Split sign-in layout shared with the organization app: brand photo on the left, form on the right. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh bg-white">
      <div className="relative hidden w-[52%] overflow-hidden lg:block">
        <Image src="/assets/welcome-hero.jpg" alt="" fill priority sizes="52vw" className="hero-scale-in object-cover object-[center_22%]" />
        <div className="absolute inset-0 bg-gradient-to-t from-grey-1/70 via-grey-1/10 to-transparent" aria-hidden="true" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white xl:p-14">
          <p className="max-w-[440px] font-sans text-[28px] font-semibold leading-9 tracking-[-0.02em]">Run Wellstaq for every organization and every member.</p>
          <p className="mt-3 max-w-[400px] text-[15px] leading-6 text-white/80">Organizations, people, platform events and support in one place.</p>
        </div>
      </div>

      <div className="flex min-h-dvh flex-1 flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center gap-2.5">
          <Image src={LOGO} alt="Wellstaq" width={501} height={120} className="h-[34px] w-auto" priority />
          <span className="rounded-[6px] bg-grey-1 px-1.5 py-0.5 text-[11px] font-semibold leading-4 text-white">Admin</span>
        </div>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <h1 className="font-sans text-[30px] font-semibold leading-9 tracking-[-0.02em] text-grey-1">{title}</h1>
          {description && <p className="mt-2 text-[15px] leading-6 text-grey-2">{description}</p>}
          <div className="mt-8">{children}</div>
        </div>

        <p className="text-center text-xs leading-5 text-grey-3">For authorized Wellstaq staff only. Sign-ins and changes are recorded.</p>
      </div>
    </main>
  );
}

export function FormAlert({ tone = "error", children }: { tone?: "error" | "info" | "success"; children: ReactNode }) {
  const styles = {
    error: "bg-[#FDECEA] text-error-1",
    info: "bg-grey-5 text-grey-2 ring-1 ring-inset ring-line",
    success: "bg-[#EAF7EC] text-[#1C7A2E]",
  }[tone];
  return (
    <p role={tone === "error" ? "alert" : "status"} className={`mb-5 rounded-[10px] px-3.5 py-2.5 text-sm ${styles}`}>
      {children}
    </p>
  );
}
