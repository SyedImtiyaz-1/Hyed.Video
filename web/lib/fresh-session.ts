/**
 * Before a signed-in request from a page that's been open a while: Clerk's session cookie lasts a minute and is renewed
 * by a timer that browsers slow down in background tabs, so a request after a long wait can go out signed out (the
 * middleware answers 404). Renewing it first avoids that. Nothing to do without Clerk (demo mode).
 */
export async function freshSession() {
  const clerk = (window as unknown as { Clerk?: { session?: { getToken(): Promise<string | null> } | null } }).Clerk;
  await clerk?.session?.getToken().catch(() => null);
}
