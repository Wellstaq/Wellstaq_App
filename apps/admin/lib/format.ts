export function fullName(person: { firstName?: string | null; lastName?: string | null; email?: string | null }): string {
  const name = `${person.firstName ?? ""} ${person.lastName ?? ""}`.trim();
  return name || person.email || "Unnamed user";
}

export function initials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts[parts.length - 1][0]}`).toUpperCase();
}

export function humanize(value: string | null | undefined, fallback = "Not set"): string {
  if (!value) return fallback;
  return value
    .replace(/[._-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^\w/, (letter) => letter.toUpperCase());
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
const numberFormatter = new Intl.NumberFormat("en-GB");

function parse(value: string): Date | null {
  // Plain YYYY-MM-DD dates are calendar days; parse them at local midnight.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDate(value: string | null | undefined, fallback = "Not set"): string {
  if (!value) return fallback;
  const date = parse(value);
  return date ? dateFormatter.format(date) : fallback;
}

export function formatDateTime(value: string | null | undefined, fallback = "Never"): string {
  if (!value) return fallback;
  const date = parse(value);
  return date ? dateTimeFormatter.format(date) : fallback;
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return "";
  const [hours, minutes] = value.split(":");
  if (hours === undefined || minutes === undefined) return value;
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function formatNumber(value: number | null | undefined): string {
  return numberFormatter.format(value ?? 0);
}

const moneyFormatterCache = new Map<string, Intl.NumberFormat>();

/** amount is in the smallest currency unit (kobo, cents, etc.) — same convention as the backend's PaymentTransaction model. */
export function formatMoney(amount: number, currency: string): string {
  let formatter = moneyFormatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-GB", { style: "currency", currency, currencyDisplay: "narrowSymbol" });
    moneyFormatterCache.set(currency, formatter);
  }
  try {
    return formatter.format(amount / 100);
  } catch {
    return `${(amount / 100).toFixed(2)} ${currency}`;
  }
}

export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : pluralForm}`;
}
