// A closed list of common ISO 4217 codes, not a free-text field — same
// "bounded, never raw input" principle docs/DESIGN-SYSTEM.md applies to
// the six theme axes, applied here to spaces.value_currency.
export const CURRENCIES = {
  USD: "US Dollar",
  GBP: "British Pound",
  EUR: "Euro",
  CAD: "Canadian Dollar",
  AUD: "Australian Dollar",
  JPY: "Japanese Yen",
  CHF: "Swiss Franc",
  CNY: "Chinese Yuan",
  INR: "Indian Rupee",
  NZD: "New Zealand Dollar",
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;

export function isCurrencyCode(value: string): value is CurrencyCode {
  return value in CURRENCIES;
}
