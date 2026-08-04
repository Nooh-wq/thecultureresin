import { Suspense } from "react";
import { Ambience } from "@/components/Ambience";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SmoothScroll } from "@/components/SmoothScroll";
import { BusinessSchema } from "@/components/StructuredData";
import { OrderOverlay } from "@/components/order/OrderOverlay";

/**
 * Everything a customer sees. The admin sits outside this group, so it gets
 * none of it.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Behind everything, and only on the public site. The admin is a tool,
          not a shop window. */}
      <Ambience />
      <SmoothScroll />
      <BusinessSchema />
      <Header />
      <main>{children}</main>
      <Footer />
      {/* The order form has no route. It is mounted here and opened from the
          nav, the end of Home, and every gallery popup. */}
      <Suspense fallback={null}>
        <OrderOverlay />
      </Suspense>
    </>
  );
}
