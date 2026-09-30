import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import SimilarProjectCta from "@/components/work/SimilarProjectCta";

const openInquiry = vi.fn();

vi.mock("@/components/inquiry/InquiryModalProvider", () => ({ useInquiry: () => ({ openInquiry }) }));
vi.mock("@/lib/analytics", () => ({ track: vi.fn() }));

function setScroll(position: number, pageHeight = 3000, viewport = 1000) {
  Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: pageHeight });
  Object.defineProperty(window, "innerHeight", { configurable: true, value: viewport });
  Object.defineProperty(window, "scrollY", { configurable: true, value: position });
}

describe("SimilarProjectCta", () => {
  beforeEach(() => openInquiry.mockReset());

  it("opens the inquiry with the case study's services ticked", () => {
    render(<SimilarProjectCta services={["seo", "meta_ads"]} slug="sample" />);
    fireEvent.click(screen.getByRole("button", { name: "Start a similar project" }));
    expect(openInquiry).toHaveBeenCalledWith({ services: ["SEO", "Meta Ads"] });
  });

  it("shows the sticky bar only after 40% of the page", () => {
    setScroll(0);
    render(<SimilarProjectCta services={["seo"]} slug="sample" variant="sticky" />);
    expect(screen.queryByTestId("sticky-cta")).toBeNull();

    act(() => {
      setScroll(900); // 900 / (3000 - 1000) = 45%
      window.dispatchEvent(new Event("scroll"));
    });
    expect(screen.getByTestId("sticky-cta")).toBeInTheDocument();
  });
});
