import Link from "next/link";
import { getAdminPrisma } from "@/lib/admin-guard";
import { productLabel } from "@/lib/order-config";
import { formatReference } from "@/lib/order-schema";

const STATUSES = ["NEW", "QUOTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "DECLINED"] as const;

export default async function Dashboard() {
  const prisma = await getAdminPrisma();
  if (!prisma) return null;

  const [counts, recent, pieceCount] = await Promise.all([
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      // Explicit select. internalNotes and quotedAmount are never pulled into
      // a list view that does not need them.
      select: {
        id: true,
        reference: true,
        name: true,
        productType: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.piece.count(),
  ]);

  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all]));

  return (
    <>
      <h1 className="font-display text-display-md text-ink">Dashboard</h1>

      <ul className="mt-10 grid grid-cols-2 gap-px border border-line bg-line md:grid-cols-4">
        {STATUSES.map((s) => (
          <li key={s} className="bg-canvas p-6">
            <p className="eyebrow text-ink-muted">{s.replace("_", " ")}</p>
            <p className="mt-3 font-display text-display-md text-ink">{byStatus[s] ?? 0}</p>
          </li>
        ))}
        <li className="bg-canvas p-6">
          <p className="eyebrow text-ink-muted">Pieces</p>
          <p className="mt-3 font-display text-display-md text-ink">{pieceCount}</p>
        </li>
      </ul>

      <h2 className="mt-16 font-display text-display-md text-ink">Latest</h2>
      {recent.length === 0 ? (
        <p className="mt-6 text-body text-ink-muted">Nothing has come in yet.</p>
      ) : (
        <ul className="mt-6 border-t border-line">
          {recent.map((o) => (
            <li key={o.id} className="border-b border-line">
              <Link
                href={`/admin/orders/${o.id}`}
                className="flex flex-wrap items-baseline justify-between gap-4 py-4 hover:text-ink"
              >
                <span className="eyebrow text-gold">{formatReference(o.reference)}</span>
                <span className="text-body text-ink">{o.name}</span>
                <span className="text-caption text-ink-muted">{productLabel(o.productType)}</span>
                <span className="eyebrow text-ink-muted">{o.status.replace("_", " ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
