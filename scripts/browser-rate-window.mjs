// The real signed-session journey keeps the server's rate limits enabled.
// Its first half performs many roles/reloads faster than a human session.
export async function waitForBrowserRateWindow(apiReadyAt, { now = Date.now, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  const deadline = apiReadyAt + 61_000;
  let remaining;
  while ((remaining = deadline - now()) > 0) await pause(Math.min(1000, remaining));
}

/** Test-runner pacing only. Keep well below the unchanged 300/IP/min API limit.
 * Count completed local HTTP requests in a rolling 61s window, including background
 * refreshes. The remaining 200 requests leave room for an in-flight navigation burst.
 * No payload, address, identity, or response is retained or printed.
 */
export function createBrowserRatePacer({ now = Date.now, pause = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  let observations = []; let pausedMs = 0;
  const prune = () => { const cutoff = now() - 61_000; observations = observations.filter(at => at > cutoff); };
  return {
    start() { observations = []; },
    // Interface deadlines exclude deliberate rate-budget waits, but retain real UI timeouts.
    activeNow() { return now() - pausedMs; },
    observeHttpLine(line) {
      let entry; try { entry = JSON.parse(line); } catch { return; }
      if (entry?.event !== 'http') return;
      prune(); observations.push(now());
    },
    async beforeAction() {
      prune();
      while (observations.length >= 100) {
        const deadline = observations[observations.length - 100] + 61_000;
        const started = now();
        try { await pause(Math.min(1000, Math.max(1, deadline - now()))); }
        finally { pausedMs += Math.max(0, now() - started); }
        prune();
      }
    },
  };
}
