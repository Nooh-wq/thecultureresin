import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash when it is configured, an in-memory window when it isn't.
 *
 * The in-memory fallback is per-instance and resets on redeploy, so it is a
 * development convenience, not production protection. Set the Upstash env vars
 * before launch.
 */

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const upstash = hasUpstash
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(5, "10 m"),
      prefix: "tcr:order",
    })
  : null;

const memory = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 5;

export async function checkRateLimit(key: string): Promise<{ ok: boolean }> {
  if (upstash) {
    const { success } = await upstash.limit(key);
    return { ok: success };
  }

  const now = Date.now();
  const hits = (memory.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  memory.set(key, hits);
  return { ok: hits.length <= LIMIT };
}

export const usingDurableRateLimit = hasUpstash;
