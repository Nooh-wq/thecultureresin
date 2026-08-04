import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { body, c, display, eyebrow } from "./theme";
import type { SummaryRow } from "./CustomerConfirmation";

/**
 * Functional rather than pretty. Every field, the reference piece thumbnail,
 * a button to the order in the admin, and a second button that opens WhatsApp
 * with their number already filled in.
 */
export function OwnerNotification({
  reference,
  name,
  productType,
  rows,
  adminUrl,
  whatsappUrl,
  referenceImageUrl,
}: {
  reference: string;
  name: string;
  productType: string;
  rows: SummaryRow[];
  adminUrl: string;
  whatsappUrl: string;
  referenceImageUrl?: string | null;
}) {
  return (
    <Html>
      <Head />
      <Preview>
        {productType} · {name} · {reference}
      </Preview>
      <Body style={{ backgroundColor: c.canvas, margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: "600px", margin: "0 auto", padding: "0 24px" }}>
          <Text style={eyebrow}>New order</Text>
          <Text style={{ ...display, fontSize: "28px", lineHeight: "1.2", marginTop: "16px" }}>
            {productType} · {name}
          </Text>
          <Text style={{ ...eyebrow, color: c.gold, marginTop: "8px" }}>{reference}</Text>

          {referenceImageUrl && (
            <Img
              src={referenceImageUrl}
              alt="Reference image supplied with the order"
              width="240"
              style={{ marginTop: "24px", display: "block" }}
            />
          )}

          <Hr style={{ borderColor: c.line, margin: "28px 0" }} />

          <Section>
            {rows.map((r) => (
              <table
                key={r.label}
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                style={{ marginBottom: "10px" }}
              >
                <tbody>
                  <tr>
                    <td style={{ ...eyebrow, width: "35%", verticalAlign: "top" }}>{r.label}</td>
                    <td style={{ ...body, fontSize: "15px", color: c.ink }}>{r.value}</td>
                  </tr>
                </tbody>
              </table>
            ))}
          </Section>

          <Hr style={{ borderColor: c.line, margin: "28px 0" }} />

          <Button
            href={adminUrl}
            style={{
              ...eyebrow,
              color: c.canvas,
              backgroundColor: c.ink,
              padding: "12px 24px",
              borderRadius: "2px",
              display: "inline-block",
              marginRight: "12px",
            }}
          >
            Open in admin
          </Button>

          <Button
            href={whatsappUrl}
            style={{
              ...eyebrow,
              color: c.ink,
              border: `1px solid ${c.line}`,
              padding: "12px 24px",
              borderRadius: "2px",
              display: "inline-block",
            }}
          >
            Reply on WhatsApp
          </Button>
        </Container>
      </Body>
    </Html>
  );
}

export default OwnerNotification;
