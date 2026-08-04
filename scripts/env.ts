import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Loads .env.local then .env into process.env.
 *
 * Next.js does this itself, but the scripts in package.json run under plain
 * tsx, which does not. Without it check:db and check:email would report that
 * nothing is configured on a machine where everything is.
 *
 * Precedence matches Next: a real environment variable wins over a file, and
 * .env.local wins over .env. Nothing here overwrites a value that is already
 * set, which is what makes it safe to run in CI.
 *
 * Deliberately not the dotenv package. This is fifteen lines, it is only ever
 * used by scripts, and it handles the one thing that bit us: the .env files on
 * this machine start with a UTF-8 BOM, which turns the first key into
 * "﻿DATABASE_URL" if you split naively.
 */
function load(file: string): void {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) return;

  const text = readFileSync(path, "utf8").replace(/^﻿/, "");

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    if (!key || key in process.env) continue;

    let value = line.slice(eq + 1).trim();
    // Strip one matching pair of surrounding quotes, and only a matching pair,
    // so a password that genuinely ends in a quote survives.
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

load(".env.local");
load(".env");

/**
 * Locally there is no pooler, so the direct connection is just the connection.
 *
 * The schema declares directUrl and the Prisma CLI refuses to load a schema
 * whose env() references are unset, even for a command that would never use
 * the value. Without this, adding Supabase support would have broken every
 * migration against a plain local Postgres.
 *
 * Only a default. A real DIRECT_URL always wins, so this is invisible the
 * moment the Supabase pair is configured.
 */
if (!process.env.DIRECT_URL && process.env.DATABASE_URL) {
  process.env.DIRECT_URL = process.env.DATABASE_URL;
}
