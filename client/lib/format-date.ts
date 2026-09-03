// Fixed locale so server-rendered HTML and the browser always agree, regardless
// of the machine's runtime locale (avoids React hydration mismatches).
const DATE_LOCALE = "en-GB";

export function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString(DATE_LOCALE);
}

export function formatDateTime(value: Date | string | null) {
  return value ? new Date(value).toLocaleString(DATE_LOCALE) : "—";
}
