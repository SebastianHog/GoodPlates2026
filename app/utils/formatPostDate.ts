// "Oct 15", or "Oct 15, 2025" when it is not from this year
export function formatPostDate(iso: string): string {
  const date = new Date(iso);
  const sameYear = date.getUTCFullYear() === new Date().getUTCFullYear();

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: sameYear ? undefined : "numeric",
    timeZone: "UTC",
  }).format(date);
}
