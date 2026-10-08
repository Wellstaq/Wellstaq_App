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

export function SplitLayout({ children, lockContentScroll = false }: { children: React.ReactNode; lockContentScroll?: boolean }) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-white">
      {/* Left Pane - Static hero (same photo as the employee app's welcome screen) */}
      <div className="hidden xl:flex xl:w-[60%] relative overflow-hidden items-center justify-center">
        <Image
          src="/assets/welcome-hero.jpg"
          alt="Wellness and Community"
          fill
          className="hero-scale-in object-cover object-[center_22%]"
          priority
          sizes="60vw"
        />
        <div className="absolute inset-0 bg-black/10 z-10" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[45%]">
          {BLUR_LAYERS.map(({ blur, from, to }) => {
            const mask = `linear-gradient(to bottom, transparent ${from}%, #000 ${to}%)`;
            return <div key={blur} className="absolute inset-0" style={{ backdropFilter: `blur(${blur}px)`, WebkitBackdropFilter: `blur(${blur}px)`, maskImage: mask, WebkitMaskImage: mask }} />;
          })}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/25" />
        </div>
      </div>
      {/* Right Pane - Content */}
      <div className={`relative z-20 flex min-h-0 w-full flex-col overflow-y-auto overscroll-contain xl:w-[40%] ${lockContentScroll ? "md:overflow-y-hidden [@media(max-height:640px)]:overflow-y-auto" : ""}`}>
        {children}
      </div>
    </div>
  );
}
