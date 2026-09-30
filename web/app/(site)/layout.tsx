import ChatLauncher from "@/components/chat/ChatLauncher";
import CookieBanner from "@/components/consent/CookieBanner";
import InquiryModalProvider from "@/components/inquiry/InquiryModalProvider";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SmoothScroll from "@/components/SmoothScroll";
import WhatsAppButton from "@/components/WhatsAppButton";

// Public site chrome. The Meta Pixel, once added, belongs here and must be gated on
// `useMarketingConsent()` from lib/consent.ts.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <InquiryModalProvider>
      <SmoothScroll />
      <SiteHeader />
      {children}
      <SiteFooter />
      <WhatsAppButton />
      <ChatLauncher />
      <CookieBanner />
    </InquiryModalProvider>
  );
}
