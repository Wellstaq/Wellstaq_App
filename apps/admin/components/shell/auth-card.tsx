import Image from "next/image";
import type { ReactNode } from "react";

const LOGO = "/assets/logo.webp";

const BLUR_LAYERS = [
  { blur: 1, from: 55, to: 70 },
  { blur: 2, from: 62, to: 80 },
  { blur: 4, from: 70, to: 90 },
  { blur: 8, from: 78, to: 100 },
  { blur: 16, from: 86, to: 100 },
];

/** Split sign-in layout shared with the organization app: brand photo on the left, form on the right. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh bg-white lg:h-dvh lg:gap-2 lg:p-2">
      <div className="relative hidden w-[50%] overflow-hidden rounded-xl lg:block">
        <Image src="/assets/admin-login-portrait-green.webp" alt="" fill priority sizes="50vw" className="auth-photo-first object-cover object-top" />
        <Image src="/assets/auth-woman.webp" alt="" fill priority sizes="50vw" className="auth-photo-second object-cover object-center" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[45%]">
          {BLUR_LAYERS.map(({ blur, from, to }) => {
            const mask = `linear-gradient(to bottom, transparent ${from}%, #000 ${to}%)`;
            return <div key={blur} className="absolute inset-0" style={{ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`, maskImage: mask, WebkitMaskImage: mask }} />;
          })}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/20" />
        </div>
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
