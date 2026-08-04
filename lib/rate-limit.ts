import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Per-action rate limiting. Upstash when configured, in-memory when not.
 *
 * Every action used to share one rule, 5 requests per 10 minutes, which was
 * right for placing an order and wrong for everything else. The add-a-piece
 * modal asks for one upload signature per selected file, so choosing six
 * photographs tripped the limit on the sixth and locked her out of her own
 * admin for ten minutes. It never surfaced because Cloudinary was unconfigured,
 * so uploads were already failing earlier for a different reason.
 *
 * The limits below are set by what each action costs us, not by one number
 * applied everywhere.
 */

type Action = "order" | "signin" | "reset" | "upload" | "adminUpload";

type Window = `${number} ${"s" | "m" | "h"}`;

const RULES: Record<Action, { limit: number; window: Window }> = {
  // Writes a row and sends two emails. Resend's free tier is 100 emails a day,
  // so this is the one that has to stay tight.
  order: { limit: 5, window: "10 m" },
  // Brute force is already covered by the per-account lockout in auth.ts at 8
  // attempts. This is the IP-level backstop against someone rotating
  // addresses, so it can be loose enough not to punish a genuine typo.
  signin: { limit: 10, window: "10 m" },
  // Sends an email, and one working link is enough.
  reset: { limit: 3, window: "15 m" },
  // A customer attaching a reference picture. Almost always exactly one.
  upload: { limit: 10, window: "10 m" },
  // Her own bulk uploads. A piece can carry a dozen photographs and she may
  // add several in a sitting. Already behind a session check.
  adminUpload: { limit: 60, window: "10 m" },
};

const hasUpstash = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN,
);

const redis = hasUpstash ? Redis.fromEnv() : null;
const limiters = new Map<Action, Ratelimit>();

function limiterFor(action: Action): Ratelimit | null {
  if (!redis) return null;
  let l = limiters.get(action);
  if (!l) {
    const { limit, window } = RULES[action];
    l = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `tcr:${action}`,
      // Blocks a burst from one IP without a network round trip per request.
      // Per-instance, so it can only ever refuse earlier than Redis would and
      // never later, which is the safe direction to be wrong in.
      ephemeralCache: new Map(),
    });
    limiters.set(action, l);
  }
  return l;
}

// ---------------------------------------------------------------------------
// In-memory fallback. Development only: it is per-instance and resets on every
// deploy, so on Vercel it is close to no protection at all.
// ---------------------------------------------------------------------------

const memory = new Map<string, number[]>();
let lastSweep = 0;

const WINDOW_MS: Record<Action, number> = {
  order: 10 * 60_000,
  signin: 10 * 60_000,
  reset: 15 * 60_000,
  upload: 10 * 60_000,
  adminUpload: 10 * 60_000,
};

const LONGEST_WINDOW_MS = Math.max(...Object.values(WINDOW_MS));

/** Without this the map keeps an entry for every IP ever seen, forever. */
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [k, hits] of memory) {
    if (hits.every((t) => now - t > LONGEST_WINDOW_MS)) memory.delete(k);
  }
}

/**
 * @param action which rule to apply
 * @param identifier usually the caller's IP
 *
 * Fails open. If Upstash is unreachable the site keeps taking orders rather
 * than refusing all of them, because for a business this size a dropped order
 * costs more than an unthrottled one.
 */
export async function checkRateLimit(
  action: Action,
  identifier: string,
): Promise<{ ok: boolean }> {
  const limiter = limiterFor(action);
  if (limiter) {
    try {
      const { success } = await limiter.limit(identifier);
      return { ok: success };
    } catch (e) {
      console.error(`[rate-limit] Upstash unreachable for ${action}, allowing through`, e);
      return { ok: true };
    }
  }

  const now = Date.now();
  sweep(now);

  const key = `${action}:${identifier}`;
  const hits = (memory.get(key) ?? []).filter((t) => now - t < WINDOW_MS[action]);
  hits.push(now);
  memory.set(key, hits);
  return { ok: hits.length <= RULES[action].limit };
}

export const usingDurableRateLimit = hasUpstash;
