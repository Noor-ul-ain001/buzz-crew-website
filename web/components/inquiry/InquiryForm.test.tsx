import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import InquiryForm from "@/components/inquiry/InquiryForm";
import type { SubmitResult } from "@/lib/leads/submit";

const submitInquiry = vi.fn<(...args: unknown[]) => Promise<SubmitResult>>();
vi.mock("@/lib/leads/submit", () => ({ submitInquiry: (...args: unknown[]) => submitInquiry(...args) }));

const track = vi.fn();
vi.mock("@/lib/analytics", () => ({ track: (...args: unknown[]) => track(...args), currentSourcePage: () => "/contact" }));

async function fillValidForm(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText(/^Name/), "Ayesha Khan");
  await user.type(screen.getByLabelText(/^Email/), "ayesha@example.com");
  await user.selectOptions(screen.getByLabelText(/^Country/), "Pakistan");
  await user.selectOptions(screen.getByLabelText(/^Monthly budget/), "Not sure yet");
  await user.click(screen.getByLabelText("SEO"));
  await user.type(screen.getByLabelText(/^Tell us about your project/), "We need more patients from Google.");
}

describe("InquiryForm", () => {
  beforeEach(() => {
    submitInquiry.mockReset();
    track.mockReset();
  });

  it("shows inline errors on submit and focuses the first invalid field", async () => {
    const user = userEvent.setup();
    render(<InquiryForm />);
    await user.click(screen.getByRole("button", { name: "Send inquiry" }));

    expect(await screen.findByText("Please enter your name.")).toBeInTheDocument();
    expect(screen.getByText("Please choose at least one service.")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toHaveFocus();
    expect(screen.getByLabelText(/^Name/)).toHaveAttribute("aria-invalid", "true");
    expect(submitInquiry).not.toHaveBeenCalled();
  });

  it("shows an error for a too-short message when the field loses focus", async () => {
    const user = userEvent.setup();
    render(<InquiryForm />);
    await user.type(screen.getByLabelText(/^Tell us about your project/), "short");
    await user.tab();
    expect(await screen.findByText(/at least 10 characters/)).toBeInTheDocument();
  });

  it("keeps the values after a server error and offers a retry", async () => {
    submitInquiry.mockResolvedValue({ kind: "error" });
    const user = userEvent.setup();
    render(<InquiryForm />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send inquiry" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("couldn't send your message");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toHaveValue("Ayesha Khan");
    expect(track).not.toHaveBeenCalled();
  });

  it("sends the mapped payload and focuses the confirmation on success", async () => {
    submitInquiry.mockResolvedValue({ kind: "created", id: "id-1", postProcessToken: "t" });
    const user = userEvent.setup();
    render(<InquiryForm />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send inquiry" }));

    const heading = await screen.findByRole("heading", { name: /get back to you within 24 hours/ });
    await waitFor(() => expect(heading).toHaveFocus());
    expect(track).toHaveBeenCalledWith("inquiry_submitted", { source_page: "/contact" });
    const [data, context] = submitInquiry.mock.calls[0] as [Record<string, unknown>, Record<string, unknown>];
    expect(data).toMatchObject({ name: "Ayesha Khan", services: ["SEO"], country: "Pakistan" });
    expect(context).toMatchObject({ sourcePage: "/contact" });
    expect(typeof context.idempotencyKey).toBe("string");
  });

  it("shows the rate-limit message with contact alternatives", async () => {
    submitInquiry.mockResolvedValue({ kind: "rate_limited", message: "Too many attempts, please try again later." });
    const user = userEvent.setup();
    render(<InquiryForm />);
    await fillValidForm(user);
    await user.click(screen.getByRole("button", { name: "Send inquiry" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Too many attempts, please try again later.");
    expect(alert).toHaveTextContent("WhatsApp");
  });
});
