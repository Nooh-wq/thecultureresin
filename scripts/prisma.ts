import "./env";
import { spawnSync } from "node:child_process";

/**
 * Runs the Prisma CLI with the same environment the site sees.
 *
 * This exists to close a trap that is very easy to fall into and very hard to
 * notice. Next.js reads .env.local and then .env, with .env.local winning.
 * The Prisma CLI reads ONLY .env. So the moment the Supabase URLs live in
 * .env.local while an older DATABASE_URL is still sitting in .env, the site
 * talks to Supabase and every migration lands on the other database instead.
 * Both commands succeed. Nothing warns you. You find out when production has
 * no tables.
 *
 * Loading ./env first and inheriting it into the child means prisma migrate
 * and the app can never disagree about which database they mean. Prisma's own
 * .env loading still happens inside the child, but dotenv does not overwrite
 * variables that are already set, so what we put there wins.
 */
const result = spawnSync("npx", ["prisma", ...process.argv.slice(2)], {
  stdio: "inherit",
  // Needed for npx to resolve on Windows.
  shell: true,
});

process.exit(result.status ?? 1);
