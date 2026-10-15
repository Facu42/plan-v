// The real signed-session journey keeps the server's rate limits enabled.
// Its first half performs many roles/reloads faster than a human session.
export async function waitForBrowserRateWindow(apiReadyAt, { now = Date.now, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const deadline = apiReadyAt + 61_000;
  let remaining;
  while ((remaining = deadline - now()) > 0) await pause(Math.min(1000, remaining));
}
