import InquiryModalProvider from "@/components/inquiry/InquiryModalProvider";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SmoothScroll from "@/components/SmoothScroll";

// Public site chrome: header, smooth scrolling, footer and the shared inquiry dialog.
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <InquiryModalProvider>
      <SmoothScroll />
      <SiteHeader />
      {children}
      <SiteFooter />
    </InquiryModalProvider>
  );
}
