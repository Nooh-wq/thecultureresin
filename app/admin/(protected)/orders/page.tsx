import Link from "next/link";
import { getAdminPrisma } from "@/lib/admin-guard";
import { whatsappUrl } from "@/lib/email";
import { productLabel } from "@/lib/order-config";
import { formatReference } from "@/lib/order-schema";

const STATUSES = ["NEW", "QUOTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "DECLINED"] as const;

export default async function Orders({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const prisma = await getAdminPrisma();
  if (!prisma) return null;

  const orders = await prisma.order.findMany({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: status ? ({ status: status as any }) : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      reference: true,
      name: true,
      whatsapp: true,
      productType: true,
      status: true,
      city: true,
      country: true,
      createdAt: true,
    },
  });

  return (
    <>
      <h1 className="font-display text-display-md text-ink">Orders</h1>

      <nav className="mt-8 flex flex-wrap gap-6 border-b border-line pb-6">
        <Link
          href="/admin/orders"
          className={`eyebrow ${!status ? "text-rose" : "text-ink-muted hover:text-ink"}`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin/orders?status=${s}`}
            className={`eyebrow ${status === s ? "text-rose" : "text-ink-muted hover:text-ink"}`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="mt-10 text-body text-ink-muted">Nothing here.</p>
      ) : (
        <ul className="mt-4">
          {orders.map((o) => (
            <li
              key={o.id}
              className="flex flex-wrap items-baseline justify-between gap-4 border-b border-line py-5"
            >
              <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-baseline gap-4">
                <span className="eyebrow text-gold">{formatReference(o.reference)}</span>
                <span className="text-body text-ink">{o.name}</span>
                <span className="text-caption text-ink-muted">{productLabel(o.productType)}</span>
                <span className="text-caption text-ink-muted">
                  {[o.city, o.country].filter(Boolean).join(", ")}
                </span>
              </Link>
              <div className="flex items-baseline gap-6">
                <span className="eyebrow text-ink-muted">{o.status.replace("_", " ")}</span>
                <a
                  href={whatsappUrl(o.whatsapp, `Hi ${o.name}, about ${formatReference(o.reference)}`)}
                  target="_blank"
                  rel="noreferrer"
                  className="eyebrow text-ink-muted hover:text-ink"
                >
                  WhatsApp
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
