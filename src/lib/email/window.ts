export const EMAIL_WINDOW_DAYS = 3;
export function emailWindowStart(now = new Date()): string {
  return new Date(now.getTime() - EMAIL_WINDOW_DAYS * 86400000).toISOString();
}
/** Use epoch seconds so Gmail and the database share the same rolling window. */
export function recentMailQuery(now = new Date()): string {
  return `after:${Math.floor(new Date(emailWindowStart(now)).getTime() / 1000)} -in:spam -in:trash`;
}
