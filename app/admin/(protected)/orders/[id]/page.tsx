import Image from "next/image";
import { notFound } from "next/navigation";
import { saveOrderPrivate, updateOrderStatus } from "@/app/admin/actions";
import { getAdminPrisma } from "@/lib/admin-guard";
import { whatsappUrl } from "@/lib/email";
import { prettyEnum } from "@/lib/format";
import { productLabel } from "@/lib/order-config";
import { formatReference } from "@/lib/order-schema";

const STATUSES = ["NEW", "QUOTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "DECLINED"] as const;

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="grid gap-1 border-b border-line py-4 md:grid-cols-[12rem_1fr] md:gap-6">
      <dt className="eyebrow text-ink-muted">{label}</dt>
      <dd className="text-body text-ink">{value}</dd>
    </div>
  );
}

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const prisma = await getAdminPrisma();
  if (!prisma) return null;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { referencePiece: { include: { images: { take: 1, orderBy: { sortOrder: "asc" } } } } },
  });
  if (!order) notFound();

  const ref = formatReference(order.reference);

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="eyebrow text-gold">{ref}</p>
          <h1 className="mt-3 font-display text-display-md text-ink">{order.name}</h1>
        </div>
        <a
          href={whatsappUrl(order.whatsapp, `Hi ${order.name}, about ${ref}`)}
          target="_blank"
          rel="noreferrer"
          className="eyebrow rounded-control bg-ink px-6 py-3 text-canvas transition-opacity duration-200 hover:opacity-85"
        >
          Reply on WhatsApp
        </a>
      </div>

      <form
        action={async (fd: FormData) => {
          "use server";
          await updateOrderStatus(id, String(fd.get("status")));
        }}
        className="mt-10 flex flex-wrap items-center gap-4"
      >
        <label htmlFor="status" className="eyebrow text-ink-muted">
          Status
        </label>
        {/* keyed on the saved status so React remounts the select after a
            save. Without this the uncontrolled defaultValue keeps showing the
            old status even though the write succeeded, which reads as a
            failed save. */}
        <select
          key={order.status}
          id="status"
          name="status"
          defaultValue={order.status}
          className="rounded-control border border-line bg-surface px-4 py-2.5 text-caption text-ink focus:border-ink-muted focus:outline-none"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="eyebrow rounded-control border border-line px-5 py-2.5 text-ink hover:border-ink"
        >
          Save status
        </button>
      </form>

      {order.referencePiece && (
        <div className="mt-12 flex items-center gap-6 border border-line p-5">
          {order.referencePiece.images[0] && (
            <Image
              src={order.referencePiece.images[0].url}
              alt={order.referencePiece.images[0].alt}
              width={96}
              height={96}
              className="h-24 w-24 object-cover"
            />
          )}
          <div>
            <p className="eyebrow text-ink-muted">Starting from</p>
            <p className="mt-2 text-body text-ink">{order.referencePiece.title}</p>
          </div>
        </div>
      )}

      {order.referenceImageUrl && (
        <div className="mt-12">
          <p className="eyebrow text-ink-muted">Picture they sent</p>
          {/* Customer upload on a third-party host, so a plain img rather than
              next/image, which would need the domain allowlisted. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={order.referenceImageUrl}
            alt="Reference picture supplied with the order"
            className="mt-4 max-w-sm"
          />
        </div>
      )}

      <dl className="mt-12">
        <Row label="What" value={productLabel(order.productType)} />
        <Row label="Details" value={order.productDetail} />
        <Row label="Occasion" value={order.occasion} />
        <Row label="Feel" value={order.vibes.map(prettyEnum).join(", ")} />
        <Row label="Lettering" value={order.lettering} />
        <Row label="Size" value={order.size} />
        <Row label="Needed by" value={order.neededBy?.toDateString()} />
        <Row label="Budget" value={order.budgetBand} />
        <Row label="Where" value={[order.city, order.country].filter(Boolean).join(", ")} />
        <Row label="WhatsApp" value={order.whatsapp} />
        <Row label="Email" value={order.email} />
        <Row label="Anything else" value={order.notes} />
        <Row label="Came in" value={order.createdAt.toDateString()} />
      </dl>

      {/* Private. Never rendered by anything public. */}
      <form
        action={async (fd: FormData) => {
          "use server";
          await saveOrderPrivate(id, fd);
        }}
        className="mt-16 flex flex-col gap-6 border border-line p-6"
      >
        <p className="eyebrow text-gold">Only you can see this</p>

        <label className="flex flex-col gap-2">
          <span className="eyebrow text-ink-muted">Quoted amount</span>
          <input
            name="quotedAmount"
            defaultValue={order.quotedAmount?.toString() ?? ""}
            inputMode="decimal"
            className="rounded-control border border-line bg-surface px-4 py-3 text-body text-ink focus:border-ink-muted focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-2">
          <span className="eyebrow text-ink-muted">Notes</span>
          <textarea
            name="internalNotes"
            rows={5}
            defaultValue={order.internalNotes ?? ""}
            className="rounded-control border border-line bg-surface px-4 py-3 text-body text-ink focus:border-ink-muted focus:outline-none"
          />
        </label>

        <button
          type="submit"
          className="eyebrow self-start rounded-control border border-line px-5 py-2.5 text-ink hover:border-ink"
        >
          Save
        </button>
      </form>
    </>
  );
}
