import { Body, Button, Container, Head, Html, Preview, Text } from "@react-email/components";
import { body, c, display, eyebrow } from "./theme";

export function PasswordReset({ url, minutes }: { url: string; minutes: number }) {
  return (
    <Html>
      <Head />
      <Preview>Set a new password for The Culture Resin</Preview>
      <Body style={{ backgroundColor: c.canvas, margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: "520px", margin: "0 auto", padding: "0 24px" }}>
          <Text style={eyebrow}>The Culture Resin</Text>

          <Text style={{ ...display, fontSize: "28px", lineHeight: "1.2", marginTop: "24px" }}>
            Set a new password
          </Text>

          <Text style={{ ...body, marginTop: "20px" }}>
            Use the link below. It works once and expires in {minutes} minutes.
          </Text>

          <Button
            href={url}
            style={{
              ...eyebrow,
              color: c.canvas,
              backgroundColor: c.ink,
              padding: "12px 24px",
              borderRadius: "2px",
              display: "inline-block",
              marginTop: "24px",
            }}
          >
            Set a new password
          </Button>

          <Text style={{ ...body, fontSize: "14px", marginTop: "32px" }}>
            If you didn&rsquo;t ask for this, nothing has changed and you can ignore it.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export default PasswordReset;
