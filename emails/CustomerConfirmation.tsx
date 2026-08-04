import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { body, c, display, eyebrow } from "./theme";

export type SummaryRow = { label: string; value: string };

export function CustomerConfirmation({
  reference,
  rows,
}: {
  reference: string;
  rows: SummaryRow[];
}) {
  return (
    <Html>
      <Head />
      <Preview>Thanks for this. I&rsquo;ve got everything you sent.</Preview>
      <Body style={{ backgroundColor: c.canvas, margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", padding: "0 24px" }}>
          <Text style={eyebrow}>The Culture Resin</Text>

          <Text style={{ ...display, fontSize: "30px", lineHeight: "1.2", marginTop: "24px" }}>
            {reference}
          </Text>

          <Text style={{ ...body, marginTop: "24px" }}>
            Thanks for this. I&rsquo;ve got everything you sent.
          </Text>

          <Hr style={{ borderColor: c.line, margin: "32px 0" }} />

          <Section>
            {rows.map((r) => (
              <table
                key={r.label}
                width="100%"
                cellPadding={0}
                cellSpacing={0}
                style={{ marginBottom: "12px" }}
              >
                <tbody>
                  <tr>
                    <td style={{ ...eyebrow, width: "40%", verticalAlign: "top" }}>{r.label}</td>
                    <td style={{ ...body, fontSize: "15px", color: c.ink }}>{r.value}</td>
                  </tr>
                </tbody>
              </table>
            ))}
          </Section>

          <Hr style={{ borderColor: c.line, margin: "32px 0" }} />

          {/* No WhatsApp. She contacts them, so the only thing they need is a
              way to add something, and replying to this lands in her inbox. */}
          <Text style={body}>
            I&rsquo;ll come back to you in a day or two with what it would cost and how long it
            would take. If you think of anything else in the meantime, reply to this and quote{" "}
            {reference}.
          </Text>

          <Text style={{ ...eyebrow, marginTop: "40px" }}>Handmade in Islamabad, Pakistan</Text>
        </Container>
      </Body>
    </Html>
  );
}

export default CustomerConfirmation;
