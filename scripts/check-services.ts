import "./env";
import { v2 as cloudinary } from "cloudinary";
import { Redis } from "@upstash/redis";

/**
 * Verifies Cloudinary and Upstash are actually reachable with the keys in
 * .env, rather than merely present as strings.
 *
 *   npm run check:services
 *
 * Both fail quietly in this app by design: uploads degrade to "describe it
 * instead" and rate limiting degrades to an in-memory map. That is correct
 * behaviour for a site that must keep taking orders, and it is also why a
 * misconfiguration here can sit unnoticed for weeks.
 */

type Check = { label: string; ok: boolean; detail: string };
const checks: Check[] = [];
const add = (label: string, ok: boolean, detail = "") => checks.push({ label, ok, detail });

async function checkCloudinary() {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;

  if (!name || !key || !secret) {
    add(
      "Cloudinary configured",
      false,
      "uploads return 503, so she cannot add a piece with photographs",
    );
    return;
  }

  cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret, secure: true });

  try {
    const res = await cloudinary.api.ping();
    add("Cloudinary reachable", res.status === "ok", `cloud "${name}"`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    add("Cloudinary reachable", false, msg.split("\n")[0]);
    if (/401|Invalid|signature/i.test(msg)) {
      console.error("\nHint: API key or secret is wrong. Both come from the same page.\n");
    }
    return;
  }

  try {
    const usage = await cloudinary.api.usage();
    add(
      "Cloudinary quota",
      true,
      `${usage.credits?.usage ?? "?"} of ${usage.credits?.limit ?? "?"} credits used`,
    );
  } catch {
    // Restricted keys cannot read usage. Not a failure worth reporting.
  }
}

async function checkUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    add(
      "Upstash configured",
      false,
      "rate limiting falls back to an in-memory map, which on Vercel is per-instance and near useless",
    );
    return;
  }

  try {
    const redis = new Redis({ url, token });
    const started = Date.now();
    const pong = await redis.ping();
    add("Upstash reachable", pong === "PONG", `${Date.now() - started}ms`);

    // Round-trips a real value, because ping alone does not prove writes work
    // on a database that has hit its free-tier command limit.
    const probe = "tcr:healthcheck";
    await redis.set(probe, "ok", { ex: 60 });
    const back = await redis.get(probe);
    add("Upstash read/write", back === "ok", back === "ok" ? "" : `got ${JSON.stringify(back)}`);
    await redis.del(probe);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    add("Upstash reachable", false, msg.split("\n")[0]);
    if (/401|unauthor/i.test(msg)) {
      console.error("\nHint: use the REST URL and REST TOKEN, not the redis:// URL.\n");
    }
  }
}

async function main() {
  await Promise.all([checkCloudinary(), checkUpstash()]);

  console.log("");
  for (const c of checks) {
    console.log(`  ${c.ok ? "ok  " : "FAIL"}  ${c.label}${c.detail ? `  ${c.detail}` : ""}`);
  }
  console.log("");

  process.exit(checks.every((c) => c.ok) ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
