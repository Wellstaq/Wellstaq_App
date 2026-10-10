import Image from "next/image";
import type { ReactNode } from "react";

const LOGO = "/assets/logo.webp";

/** Split sign-in layout shared with the organization app: brand photo on the left, form on the right. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh bg-white lg:h-dvh lg:gap-2 lg:p-2">
      <div className="relative hidden w-[50%] overflow-hidden rounded-xl lg:block">
        <Image src="/assets/admin-login-portrait.webp" alt="" fill priority sizes="50vw" className="object-cover object-top" />
      </div>

      <div className="flex min-h-dvh flex-1 flex-col px-6 py-8 sm:px-12 lg:min-h-0">
        <div className="flex items-center justify-center">
          <Image src={LOGO} alt="Wellstaq" width={501} height={120} className="h-[34px] w-auto" priority />
        </div>

        <div className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-12">
          <h1 className="font-sans text-[30px] font-semibold leading-9 tracking-[-0.02em] text-grey-1">{title}</h1>
          {description && <p className="mt-2 text-[15px] leading-6 text-grey-2">{description}</p>}
          <div className="mt-8">{children}</div>
        </div>

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
