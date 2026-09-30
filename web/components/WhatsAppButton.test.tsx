import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import WhatsAppButton from "@/components/WhatsAppButton";
import { WHATSAPP_MESSAGE, WHATSAPP_NUMBER } from "@/lib/site";

const track = vi.fn();
vi.mock("@/lib/analytics", () => ({
  track: (...args: unknown[]) => track(...args),
  currentSourcePage: () => "/services/seo",
}));

describe("WhatsAppButton", () => {
  it("opens a pre-filled chat in a new tab", () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole("link", { name: /Chat with us on WhatsApp/ });
    expect(link).toHaveAttribute(
      "href",
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`,
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAccessibleName("Chat with us on WhatsApp (opens in a new tab)");
  });

  it("records a click with the page it came from", async () => {
    const user = userEvent.setup();
    render(<WhatsAppButton />);
    const link = screen.getByRole("link", { name: /WhatsApp/ });
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);
    expect(track).toHaveBeenCalledWith("whatsapp_clicked", { source_page: "/services/seo" });
  });
});
