// "Oct 15", or "Oct 15, 2025" when it is not from this year, in the reader's language
export function formatPostDate(iso: string, locale: string): string {
  const date = new Date(iso);
  const sameYear = date.getUTCFullYear() === new Date().getUTCFullYear();

  return new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
    // Fixed zone so the server and browser render the same text
    timeZone: "UTC",
  }).format(date);
}
