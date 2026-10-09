"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "@/services/http";

export interface Resource<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  reload: () => void;
  setData: (updater: (current: T | null) => T | null) => void;
}

/**
 * Loads data for a screen and exposes loading, error and retry state.
 * The loader is re-run whenever a value in `deps` changes; stale responses
 * are discarded so fast filtering can't show the wrong page.
 */
export function useResource<T>(loader: (signal: AbortSignal) => Promise<T>, deps: unknown[], enabled = true): Resource<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(enabled);
  const [attempt, setAttempt] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    loaderRef
      .current(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setDataState(result);
      })
      .catch((reason: unknown) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof ApiError ? reason : new ApiError("Something went wrong. Try again.", 0, "UNKNOWN"));
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt, enabled]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);
  const setData = useCallback((updater: (current: T | null) => T | null) => setDataState(updater), []);

  return { data, error, isLoading, reload, setData };
}

/** Debounces a fast-changing value such as a search box. */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}
