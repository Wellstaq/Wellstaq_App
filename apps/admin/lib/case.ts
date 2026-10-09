function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && Object.getPrototypeOf(value) === Object.prototype;
}

export function toSnakeCase(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(toSnakeCase);
  if (!isPlainObject(input)) return input;
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), toSnakeCase(value)]),
  );
}

export function toCamelCase(input: unknown): unknown {
  if (Array.isArray(input)) return input.map(toCamelCase);
  if (!isPlainObject(input)) return input;
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key.replace(/_([a-z0-9])/g, (_, char: string) => char.toUpperCase()), toCamelCase(value)]),
  );
}

/** Builds a query string from defined, non-empty values (keys become snake_case). */
export function toQueryString(params: Record<string, string | number | boolean | null | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`), String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}
