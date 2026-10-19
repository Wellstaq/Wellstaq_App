"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type Ref } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { Compass, X } from "@wellstaq/ui/icons";
import { useDashboardData } from "@/components/providers/dashboard-data-provider";
import { DASHBOARD_TOUR, OPEN_TOUR_EVENT, getPageTour, placeTourCard, tourStorageKey, type TourKind, type TourRect, type TourStep } from "@/lib/product-tour";
import styles from "./product-tour.module.css";

export function openProductTour(kind: TourKind = "page") {
  window.dispatchEvent(new CustomEvent(OPEN_TOUR_EVENT, { detail: kind }));
}

export function TourLauncher() {
  return (
    <button type="button" data-tour="guide" aria-label="Guide to this page" title="Guide to this page" onClick={() => openProductTour("page")} className="flex h-8 items-center justify-center gap-2 rounded-[12px] border border-grey-4 px-2 text-xs font-medium text-grey-2 hover:bg-grey-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-1 lg:h-10 lg:px-3 lg:text-sm">
      <Compass className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="hidden xl:inline">Guide</span>
    </button>
  );
}

interface TourCardProps {
  steps: readonly TourStep[];
  index: number;
  kind: TourKind;
  titleId: string;
  descriptionId: string;
  onBack: () => void;
  onNext: () => void;
  onClose: () => void;
  cardRef?: Ref<HTMLDivElement>;
  headingRef?: Ref<HTMLHeadingElement>;
  style?: CSSProperties;
}

export function TourCard({ steps, index, kind, titleId, descriptionId, onBack, onNext, onClose, cardRef, headingRef, style }: TourCardProps) {
  const step = steps[index];
  const last = index === steps.length - 1;
  return (
    <div ref={cardRef} className={styles.card} style={style}>
      <button type="button" onClick={onClose} aria-label="Close tour" className={styles.close}><X size={18} aria-hidden="true" /></button>
      <div className={styles.content}>
        <h2 id={titleId} ref={headingRef} tabIndex={-1} className={styles.title}>{step.title}</h2>
        <div id={descriptionId} className={styles.description}>
          <p>{step.description}</p>
          {step.tips && <ul>{step.tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>}
        </div>
      </div>
      <div className={styles.footer}>
        <div className={styles.progress} role="progressbar" aria-label="Tour progress" aria-valuemin={1} aria-valuemax={steps.length} aria-valuenow={index + 1} aria-valuetext={`Step ${index + 1} of ${steps.length}`}>
          {steps.map((item, dot) => <span key={item.id} className={dot === index ? styles.dotActive : styles.dot} />)}
        </div>
        <div className={styles.actions}>
          {!last && <button type="button" onClick={onClose} className={styles.skip}>Skip</button>}
          <button type="button" onClick={onBack} className={styles.back} disabled={index === 0}>Back</button>
          <button type="button" onClick={onNext} className={styles.next}>{last ? "Got it" : index === 0 && kind === "dashboard" ? "Show me around" : "Next"}</button>
        </div>
      </div>
      <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">Step {index + 1} of {steps.length}: {step.title}</p>
    </div>
  );
}

/** Rendered controls, not a separate role table, are the source of availability. */
export function findTourTarget(selector: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>(selector)).find((element) => {
    const style = window.getComputedStyle(element);
    return element.getClientRects().length > 0 && style.visibility !== "hidden" && style.display !== "none" && !element.matches(':disabled, [aria-disabled="true"]') && !element.closest('[hidden], [aria-hidden="true"]');
  }) ?? null;
}

interface TourSession { kind: TourKind; steps: TourStep[]; index: number; pathname: string; storageKey: string; }

function TourDialog({ session, onMove, onClose, onNavigationChange }: { session: TourSession; onMove: (delta: number) => void; onClose: () => void; onNavigationChange: (open: boolean) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [geometry, setGeometry] = useState<{ target: TourRect | null; left: number; top: number; width: number } | null>(null);
  const id = useId();
  const step = session.steps[session.index];
  const positioned = geometry !== null;

  useEffect(() => {
    if (positioned) headingRef.current?.focus({ preventScroll: true });
  }, [positioned, session.index]);

  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      onNavigationChange(false);
      const focus = previousFocus?.isConnected ? previousFocus : findTourTarget('[data-tour="guide"]');
      focus?.focus({ preventScroll: true });
    };
  }, [onNavigationChange]);

  useEffect(() => {
    onNavigationChange(Boolean(step.navigation));
    let frame = 0;
    let initializationFrame = 0;
    let disposed = false;
    let target: HTMLElement | null = null;
    const measure = () => {
      if (disposed) return;
      target = step.target ? findTourTarget(step.target) : null;
      const bounds = target?.getBoundingClientRect();
      const rect = bounds ? { left: bounds.left - 5, top: bounds.top - 5, width: bounds.width + 10, height: bounds.height + 10 } : null;
      const card = cardRef.current;
      const placement = placeTourCard(rect, { width: window.innerWidth, height: window.innerHeight }, { width: 408, height: card?.offsetHeight ?? 450 });
      const next = { target: rect, ...placement };
      setGeometry((previous) => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    // Let the sidebar expand before locating a navigation target.
    initializationFrame = requestAnimationFrame(() => {
      initializationFrame = requestAnimationFrame(() => {
        target = step.target ? findTourTarget(step.target) : null;
        target?.scrollIntoView({ behavior: "auto", block: "nearest", inline: "nearest" });
        measure();
        headingRef.current?.focus({ preventScroll: true });
        if (target) observer.observe(target);
      });
    });
    const observer = new ResizeObserver(schedule);
    if (cardRef.current) observer.observe(cardRef.current);
    window.addEventListener("resize", schedule);
    window.addEventListener("scroll", schedule, true);
    window.visualViewport?.addEventListener("resize", schedule);
    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      cancelAnimationFrame(initializationFrame);
      observer.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("scroll", schedule, true);
      window.visualViewport?.removeEventListener("resize", schedule);
    };
  }, [step, onNavigationChange]);

  return createPortal(
    <dialog ref={dialogRef} className={styles.dialog} aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`} onCancel={(event) => { event.preventDefault(); onClose(); }} onKeyDown={(event) => {
      if (event.key !== "Tab") return;
      const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)"));
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === headingRef.current)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }}>
      <svg className={styles.spotlight} width="100%" height="100%" aria-hidden="true">
        <defs><mask id={`${id}-mask`}><rect width="100%" height="100%" fill="white" />{geometry?.target && <rect x={geometry.target.left} y={geometry.target.top} width={geometry.target.width} height={geometry.target.height} rx="12" fill="black" />}</mask></defs>
        <rect width="100%" height="100%" fill="#20252c" fillOpacity="0.28" mask={`url(#${id}-mask)`} />
        {geometry?.target && <rect x={geometry.target.left} y={geometry.target.top} width={geometry.target.width} height={geometry.target.height} rx="12" fill="none" stroke="#e96b09" strokeWidth="2" />}
      </svg>
      <TourCard steps={session.steps} index={session.index} kind={session.kind} titleId={`${id}-title`} descriptionId={`${id}-description`} onBack={() => onMove(-1)} onNext={() => onMove(1)} onClose={onClose} cardRef={cardRef} headingRef={headingRef} style={geometry ? { left: geometry.left, top: geometry.top, width: geometry.width } : { visibility: "hidden" }} />
    </dialog>, document.body,
  );
}

export function ProductTour({ onNavigationChange }: { onNavigationChange: (open: boolean) => void }) {
  const pathname = usePathname();
  const { currentUser, organizationId, isLoading, error } = useDashboardData();
  const [session, setSession] = useState<TourSession | null>(null);
  const attempted = useRef(new Set<string>());
  const pendingFrame = useRef(0);
  const storageKey = currentUser && organizationId ? tourStorageKey(currentUser.userId, organizationId) : null;
  const ready = !isLoading && !error && Boolean(storageKey);

  const finish = useCallback(() => {
    if (session?.kind === "dashboard") {
      try { localStorage.setItem(session.storageKey, "done"); } catch { /* Tours still work when browser storage is blocked. */ }
    }
    setSession(null);
    onNavigationChange(false);
  }, [session, onNavigationChange]);

  const begin = useCallback((kind: TourKind) => {
    if (!ready || !storageKey) return;
    attempted.current.add(storageKey);
    cancelAnimationFrame(pendingFrame.current);
    onNavigationChange(kind === "dashboard");
    pendingFrame.current = requestAnimationFrame(() => {
      pendingFrame.current = requestAnimationFrame(() => {
        const candidates = kind === "dashboard" ? DASHBOARD_TOUR : getPageTour(pathname);
        const steps = candidates.filter((step) => !step.target || findTourTarget(step.target));
        if (steps.length) setSession({ kind, steps: [...steps], index: 0, pathname, storageKey });
        else onNavigationChange(false);
      });
    });
  }, [ready, storageKey, pathname, onNavigationChange]);

  useEffect(() => {
    const open = (event: Event) => begin((event as CustomEvent).detail === "dashboard" ? "dashboard" : "page");
    window.addEventListener(OPEN_TOUR_EVENT, open);
    return () => { window.removeEventListener(OPEN_TOUR_EVENT, open); cancelAnimationFrame(pendingFrame.current); };
  }, [begin]);

  useEffect(() => {
    if (!ready || !storageKey || session || attempted.current.has(storageKey)) return;
    try { if (localStorage.getItem(storageKey) === "done") { attempted.current.add(storageKey); return; } } catch { /* Fall back to once per mounted account. */ }
    let timer = 0;
    const welcome = () => {
      // Don’t interrupt another dialog or a form the user has already opened.
      if (document.querySelector('dialog[open], [data-modal-layer]') || document.activeElement?.matches('input, textarea, select, [contenteditable="true"]')) {
        timer = window.setTimeout(welcome, 1000);
        return;
      }
      begin("dashboard");
    };
    timer = window.setTimeout(welcome, 1000);
    return () => clearTimeout(timer);
  }, [ready, storageKey, session, begin]);

  // A route/account change closes the tour without writing a completion for it.
  const visible = ready && session && session.pathname === pathname && session.storageKey === storageKey;
  useEffect(() => {
    if (session && !visible) { setSession(null); onNavigationChange(false); }
  }, [session, visible, onNavigationChange]);

  const move = (delta: number) => {
    if (!session) return;
    const nextIndex = session.index + delta;
    if (nextIndex >= session.steps.length) finish();
    else setSession({ ...session, index: Math.max(0, nextIndex) });
  };

  return visible ? <TourDialog session={session} onMove={move} onClose={finish} onNavigationChange={onNavigationChange} /> : null;
}
