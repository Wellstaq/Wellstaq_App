import Image from "next/image";

// Progressive blur: each layer blurs a bit more than the last and is masked to
// a band that starts higher up, so the photo softens gradually toward the
// bottom edge instead of hitting a hard blur line.
const BLUR_LAYERS = [
  { blur: 1, from: 55, to: 70 },
  { blur: 2, from: 62, to: 80 },
  { blur: 4, from: 70, to: 90 },
  { blur: 8, from: 78, to: 100 },
  { blur: 16, from: 86, to: 100 },
];

export function SplitLayout({ children, lockContentScroll = false, fixedViewport = false, heroTagline }: { children: React.ReactNode; lockContentScroll?: boolean; fixedViewport?: boolean; heroTagline?: string }) {
  return (
    <div className={`flex h-dvh w-full overflow-hidden bg-white xl:gap-2 xl:p-2 ${fixedViewport ? "fixed inset-x-0 top-0" : ""}`}>
      {/* Left Pane - alternating brand portraits */}
      <div className="relative hidden overflow-hidden rounded-xl xl:flex xl:w-[50%]">
        <Image
          src="/assets/welcome-hero-wide.webp"
          alt=""
          fill
          className="auth-photo-first object-cover object-center"
          priority
          sizes="50vw"
        />
        <Image
          src="/assets/auth-man-green-lowered.webp"
          alt=""
          fill
          className="auth-photo-second object-cover object-top"
          priority
          sizes="50vw"
        />
        <div className="absolute inset-0 bg-black/10 z-10" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[45%]">
          {BLUR_LAYERS.map(({ blur, from, to }) => {
            const mask = `linear-gradient(to bottom, transparent ${from}%, #000 ${to}%)`;
            return <div key={blur} className="absolute inset-0" style={{ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`, maskImage: mask, WebkitMaskImage: mask }} />;
          })}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25" />
        </div>
        {heroTagline && (
          <h2 className="auth-hero-heading absolute inset-x-5 top-8 z-30 text-center text-[clamp(2.5rem,4.2vw,4.5rem)] font-bold leading-[1.05] text-white drop-shadow-md 2xl:top-12">
            <span className="block">Beyond</span>
            <span className="block text-white/70">the everyday.</span>
          </h2>
        )}
      </div>
      {/* Right Pane - Content */}
      <div className={`relative z-20 flex min-h-0 w-full flex-col overflow-y-auto overscroll-contain xl:w-[50%] ${lockContentScroll ? "md:overflow-y-hidden [@media(max-height:640px)]:overflow-y-auto" : ""}`}>
        {children}
      </div>
    </div>
  );
}
