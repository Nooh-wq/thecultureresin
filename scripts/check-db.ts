import "./env";
import { existsSync, readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

/**
 * Answers "is the database actually wired up", without touching any data.
 *
 *   npm run check:db
 *
 * Written because the failure modes here are quiet. A DATABASE_URL pointing at
 * the wrong Supabase pooler port works for reads and then fails only when you
 * run a migration; a missing pgbouncer=true works until two people order at
 * once. Both are much easier to catch here than in production.
 */

/** Hides the password so the output can be pasted into a chat or an issue. */
function redact(url: string): string {
  return url.replace(/:\/\/([^:]+):([^@]+)@/, "://$1:****@");
}

type Check = { label: string; ok: boolean; detail: string };
const checks: Check[] = [];
const add = (label: string, ok: boolean, detail: string) =>
  checks.push({ label, ok, detail });

/** Reads one key straight out of a file, ignoring what is already in the environment. */
function fromFile(file: string, key: string): string | undefined {
  if (!existsSync(file)) return undefined;
  const line = readFileSync(file, "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .find((l) => l.trim().startsWith(`${key}=`));
  return line?.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "");
}

/**
 * The two files disagreeing is the worst case, because both commands succeed
 * and they operate on different databases. npm run db:* goes through
 * scripts/prisma.ts and is safe, but a bare `npx prisma migrate` reads only
 * .env and would migrate the wrong one.
 */
function checkForSplitConfig() {
  const local = fromFile(".env.local", "DATABASE_URL");
  const base = fromFile(".env", "DATABASE_URL");
  if (!local || !base || local === base) return;

  add(
    "one database, not two",
    false,
    ".env and .env.local set different DATABASE_URLs. The site would use " +
      ".env.local and a bare `npx prisma` would use .env. Delete one",
  );
}

async function main() {
  const pooled = process.env.DATABASE_URL;
  const direct = process.env.DIRECT_URL;

  if (!pooled) {
    console.error(
      "\nDATABASE_URL is not set.\n\n" +
        "The site still runs: the gallery falls back to lib/pieces.ts and the\n" +
        "order form does a dry run. But nothing is saved. Copy .env.example to\n" +
        ".env.local and fill in the two Supabase URLs.\n",
    );
    process.exit(1);
  }

  add("DATABASE_URL set", true, redact(pooled));
  checkForSplitConfig();

  const isSupabase = pooled.includes("supabase.");
  const onPooler = pooled.includes(":6543");
  const hasPgBouncer = pooled.includes("pgbouncer=true");
  const hasLimit = /connection_limit=\d+/.test(pooled);

  if (isSupabase) {
    add(
      "app URL uses the transaction pooler (6543)",
      onPooler,
      onPooler
        ? "correct for serverless"
        : "port 6543 is expected here. Direct connections run out under load",
    );
    add(
      "pgbouncer=true",
      hasPgBouncer,
      hasPgBouncer
        ? "prepared statements disabled, as transaction pooling requires"
        : "without it Prisma uses prepared statements and errors intermittently",
    );
    add(
      "connection_limit set",
      hasLimit,
      hasLimit ? "" : "connection_limit=1 is right for serverless functions",
    );
  }

  // Only meaningful against Supabase. On a plain local Postgres there is no
  // pooler to bypass, so scripts/env.ts defaults DIRECT_URL to DATABASE_URL
  // and there is nothing here worth reporting.
  if (isSupabase) {
    if (!direct || direct === pooled) {
      add(
        "DIRECT_URL set",
        false,
        "migrations need the session pooler on port 5432, separate from the app's URL",
      );
    } else {
      add("DIRECT_URL set", true, redact(direct));
      const directOk = direct.includes(":5432");
      add(
        "migration URL uses port 5432",
        directOk,
        directOk ? "" : "migrations cannot run through the transaction pooler",
      );
      if (direct.includes("db.") && direct.includes(".supabase.co")) {
        add(
          "DIRECT_URL is IPv4 reachable",
          false,
          "db.<ref>.supabase.co is IPv6 only on new projects. Use the session pooler instead",
        );
      }
    }
  }

  // Connect last, so the configuration report still prints if this throws.
  const prisma = new PrismaClient();
  const started = Date.now();
  try {
    const [{ version }] = await prisma.$queryRaw<{ version: string }[]>`SELECT version()`;
    add("connected", true, `${Date.now() - started}ms · ${version.split(",")[0]}`);

    const [pieces, published, orders, users] = await Promise.all([
      prisma.piece.count(),
      prisma.piece.count({ where: { published: true } }),
      prisma.order.count(),
      prisma.user.count(),
    ]);
    add("schema present", true, `${pieces} pieces (${published} published), ${orders} orders`);

    if (pieces === 0) {
      add("pieces seeded", false, "run npm run db:seed to load the eight photographs");
    }
    if (users === 0) {
      add(
        "owner account exists",
        false,
        "run npm run set-password amnasaqib201@gmail.com",
      );
    } else {
      add("owner account exists", true, `${users} admin user(s)`);
    }
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    add("connected", false, message.split("\n")[0]);

    if (message.includes("prepared statement")) {
      console.error("\nHint: add ?pgbouncer=true to DATABASE_URL.\n");
    } else if (/does not exist|P2021|relation/i.test(message)) {
      console.error("\nHint: the schema is missing. Run npm run db:deploy.\n");
    } else if (/ENOTFOUND|ETIMEDOUT|ECONNREFUSED|network/i.test(message)) {
      console.error(
        "\nHint: host unreachable. Check the region prefix in the URL, and that\n" +
          "you are using pooler.supabase.com rather than db.<ref>.supabase.co.\n",
      );
    } else if (/password authentication|SASL|P1000/i.test(message)) {
      console.error(
        "\nHint: wrong password, or a special character in it that needs percent\n" +
          "encoding. The pooler username is postgres.<project-ref>.\n",
      );
    }
  } finally {
    await prisma.$disconnect();
  }

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
