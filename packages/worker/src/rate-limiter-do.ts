/**
 * Durable Object for atomic rate limiting.
 * One instance per public key — all requests for a key route to the same DO,
 * ensuring atomic counter increments with no race conditions.
 */

const DAILY_LIMIT = 100;

interface RateLimitState {
  count: number;
  date: string; // YYYY-MM-DD
}

export class RateLimiterDO implements DurableObject {
  private state: DurableObjectState;

  constructor(state: DurableObjectState) {
    this.state = state;
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/check" && request.method === "POST") {
      return this.handleCheck();
    }

    if (url.pathname === "/check-and-increment" && request.method === "POST") {
      return this.handleCheckAndIncrement();
    }

    return Response.json({ error: "unknown action" }, { status: 400 });
  }

  private async handleCheck(): Promise<Response> {
    const today = new Date().toISOString().split("T")[0];
    const stored = await this.state.storage.get<RateLimitState>("limit");

    // Reset if it's a new day
    const count = stored && stored.date === today ? stored.count : 0;

    if (count >= DAILY_LIMIT) {
      return Response.json({ allowed: false, remaining: 0 });
    }

    return Response.json({ allowed: true, remaining: DAILY_LIMIT - count });
  }

  /**
   * Atomically check the limit and increment in one call.
   * Returns { allowed, remaining } — if allowed is true, the counter was already incremented.
   */
  private async handleCheckAndIncrement(): Promise<Response> {
    const today = new Date().toISOString().split("T")[0];
    const stored = await this.state.storage.get<RateLimitState>("limit");

    const currentCount = stored && stored.date === today ? stored.count : 0;

    if (currentCount >= DAILY_LIMIT) {
      return Response.json({ allowed: false, remaining: 0 });
    }

    const newCount = currentCount + 1;
    await this.state.storage.put<RateLimitState>("limit", { count: newCount, date: today });

    return Response.json({
      allowed: true,
      remaining: Math.max(0, DAILY_LIMIT - newCount),
    });
  }
}
