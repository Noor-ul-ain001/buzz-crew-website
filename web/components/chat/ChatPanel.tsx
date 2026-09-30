"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import InquiryForm from "@/components/inquiry/InquiryForm";
import Modal from "@/components/ui/Modal";
import {
  DAILY_LIMIT,
  DailyLimitError,
  sendMessage,
  summariseConversation,
  type ChatLink,
  type ChatReplyKind,
} from "@/lib/chat/mock";
import { CONTACT_EMAIL, WHATSAPP_URL } from "@/lib/site";

type Message =
  | { id: number; role: "user"; text: string }
  | { id: number; role: "assistant"; text: string; kind?: ChatReplyKind; links: ChatLink[]; streaming: boolean };

type Status = "ready" | "thinking" | "streaming" | "unavailable" | "limit";

const SUGGESTIONS = [
  "What services do you offer?",
  "Which industries do you work with?",
  "How much does it cost?",
  "How do we get started?",
];

const FOCUSABLE = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Full-screen sheet on phones (focus stays inside it), a 380px floating panel on larger
// screens (the page stays usable). Escape closes it; the launcher gets focus back.
export default function ChatPanel({ id, open, onClose }: { id: string; open: boolean; onClose: () => void }) {
  const titleId = useId();
  const inputId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const teamButtonRef = useRef<HTMLElement | null>(null);
  const nextId = useRef(1);

  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<Status>("ready");
  const [draft, setDraft] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const busy = status === "thinking" || status === "streaming";
  const blocked = status === "unavailable" || status === "limit";
  const userMessages = messages.filter((message) => message.role === "user").map((message) => message.text);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    // On phones the sheet covers the page, so stop the page behind it scrolling.
    const phone = window.matchMedia("(max-width: 639px)").matches;
    if (phone) document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  // Keep the newest message in view while a reply streams in.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollTo({ top: list.scrollHeight, behavior: reduceMotion ? "auto" : "smooth" });
  }, [messages, status]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy || blocked) return;
    setDraft("");
    setMessages((current) => [...current, { id: nextId.current++, role: "user", text }]);
    setStatus("thinking");
    setAnnouncement("The assistant is typing.");

    const replyId = nextId.current++;
    let replyText = "";
    try {
      for await (const event of sendMessage(text)) {
        if (event.type === "token") {
          replyText += event.text;
          setStatus("streaming");
          setMessages((current) =>
            current.some((message) => message.id === replyId)
              ? current.map((message) => (message.id === replyId ? { ...message, text: message.text + event.text } : message))
              : [...current, { id: replyId, role: "assistant", text: event.text, links: [], streaming: true }],
          );
        } else {
          setMessages((current) =>
            current.map((message) =>
              message.id === replyId && message.role === "assistant"
                ? { ...message, kind: event.kind, links: event.links, streaming: false }
                : message,
            ),
          );
          // Announce the whole reply once, rather than word by word as it streams.
          setAnnouncement(`Assistant: ${replyText}`);
          setStatus("ready");
        }
      }
    } catch (error) {
      setMessages((current) => current.filter((message) => message.id !== replyId));
      if (error instanceof DailyLimitError) {
        setStatus("limit");
        setAnnouncement(`You've reached today's limit of ${DAILY_LIMIT} messages.`);
      } else {
        // ProviderUnavailableError, or anything unexpected: offer other ways to get in touch.
        setStatus("unavailable");
        setAnnouncement("The assistant isn't available right now.");
      }
    } finally {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends; Shift+Enter adds a line; don't send while an IME is composing.
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      send(draft);
    }
  }

  function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.stopPropagation();
      onClose();
      return;
    }
    // Keep Tab inside the full-screen sheet on phones.
    if (event.key === "Tab" && window.matchMedia("(max-width: 639px)").matches) {
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (element) => element.offsetParent !== null,
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
  }

  function openInquiry(opener: HTMLElement) {
    teamButtonRef.current = opener;
    setInquiryOpen(true);
  }

  const contactActions = (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        type="button"
        onClick={(event) => openInquiry(event.currentTarget)}
        className="rounded-full bg-foreground px-3.5 py-2 text-sm font-semibold text-background hover:opacity-90"
      >
        Talk to the team
      </button>
      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-full border border-border bg-background px-3.5 py-2 text-sm font-semibold hover:bg-surface"
      >
        WhatsApp us<span className="sr-only"> (opens in a new tab)</span>
      </a>
    </div>
  );

  return (
    <div
      ref={panelRef}
      id={id}
      role="dialog"
      aria-labelledby={titleId}
      hidden={!open}
      onKeyDown={handlePanelKeyDown}
      className="fixed inset-0 z-[60] flex flex-col bg-background sm:inset-auto sm:right-6 sm:bottom-6 sm:h-[min(640px,calc(100dvh-3rem))] sm:w-[380px] sm:overflow-hidden sm:rounded-2xl sm:border sm:border-border sm:shadow-2xl"
    >
      <header className="border-b border-border">
        <div className="flex items-center justify-between gap-3 px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3 sm:pt-3">
          <h2 id={titleId} className="flex items-center gap-2 font-semibold">
            Buzz Crew AI assistant
            <span className="rounded-md bg-accent px-1.5 py-0.5 text-xs font-bold text-accent-foreground">AI</span>
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-full hover:bg-surface"
          >
            <span className="sr-only">Close the assistant</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <p className="bg-surface px-4 py-2 text-xs text-muted">Please don&apos;t share sensitive personal information.</p>
      </header>

      <div ref={listRef} className="flex flex-1 flex-col gap-4 overflow-y-auto overscroll-contain px-4 py-5">
        <Bubble role="assistant">
          <p>
            Hi! I&apos;m the Buzz Crew&apos;s AI assistant. I can answer questions about our services, the industries we
            work with and how to get started. I can make mistakes, so for quotes please talk to the team.
          </p>
        </Bubble>

        {userMessages.length === 0 && !blocked && (
          <div>
            <p id={`${id}-suggestions`} className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              Try asking
            </p>
            <ul aria-labelledby={`${id}-suggestions`} className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => send(suggestion)}
                    disabled={busy}
                    className="rounded-full border border-border px-3 py-1.5 text-left text-sm hover:bg-surface"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <Bubble key={message.id} role="user">
              <p className="whitespace-pre-wrap">{message.text}</p>
            </Bubble>
          ) : (
            <Bubble key={message.id} role="assistant">
              <p>
                {message.text}
                {message.streaming && <span aria-hidden="true" className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-current align-text-bottom" />}
              </p>
              {message.links.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {message.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        onClick={() => {
                          // The sheet covers the whole page on phones, so get out of the way.
                          if (window.matchMedia("(max-width: 639px)").matches) onClose();
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm font-medium hover:bg-surface"
                      >
                        {link.label} <span aria-hidden="true">→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              {message.kind === "decline" && contactActions}
            </Bubble>
          ),
        )}

        {status === "thinking" && (
          <Bubble role="assistant">
            <span className="flex gap-1 py-1.5" aria-hidden="true">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="size-2 rounded-full bg-muted motion-safe:animate-bounce"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
            <span className="sr-only">The assistant is typing</span>
          </Bubble>
        )}

        {status === "unavailable" && (
          <Notice title="The assistant isn't available right now">
            <p>Sorry about that. You can still reach the crew directly, or email us at {CONTACT_EMAIL}.</p>
            {contactActions}
          </Notice>
        )}
        {status === "limit" && (
          <Notice title="You've reached today's message limit">
            <p>
              The assistant answers up to {DAILY_LIMIT} messages a day. Come back tomorrow, or talk to a person now.
            </p>
            {contactActions}
          </Notice>
        )}
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          send(draft);
        }}
        className="border-t border-border p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:pb-3"
      >
        <label htmlFor={inputId} className="sr-only">
          Message the assistant
        </label>
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            id={inputId}
            rows={1}
            value={draft}
            maxLength={1000}
            disabled={blocked}
            onChange={(event) => {
              setDraft(event.target.value);
              // Grow with the text, up to about five lines.
              event.target.style.height = "auto";
              event.target.style.height = `${Math.min(event.target.scrollHeight, 128)}px`;
            }}
            onKeyDown={handleInputKeyDown}
            placeholder={blocked ? "Messaging is paused" : "Ask a question…"}
            aria-describedby={`${inputId}-hint`}
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-background px-3.5 py-2.5 text-sm disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={busy || blocked || !draft.trim()}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-foreground text-background hover:opacity-90 disabled:opacity-40"
          >
            <span className="sr-only">Send</span>
            <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
        <p id={`${inputId}-hint`} className="mt-2 text-xs text-muted">
          Enter to send, Shift+Enter for a new line. AI answers can be wrong.{" "}
          <button type="button" onClick={(event) => openInquiry(event.currentTarget)} className="font-medium text-foreground underline underline-offset-2">
            Talk to the team
          </button>
        </p>
      </form>

      <p role="status" className="sr-only">
        {announcement}
      </p>

      <Modal
        open={inquiryOpen}
        onClose={() => setInquiryOpen(false)}
        title="Talk to the team"
        description="We've added a summary of your chat to the message. Change anything you like before sending."
        returnFocusRef={teamButtonRef}
      >
        <InquiryForm
          initialValues={{
            message: userMessages.length > 0 ? summariseConversation(userMessages) : "",
          }}
        />
      </Modal>
    </div>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: ReactNode }) {
  return role === "user" ? (
    <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-foreground px-4 py-2.5 text-sm text-background">
      <span className="sr-only">You: </span>
      {children}
    </div>
  ) : (
    <div className="max-w-[92%] self-start rounded-2xl rounded-bl-md bg-surface px-4 py-2.5 text-sm leading-relaxed">
      <span className="sr-only">Assistant: </span>
      {children}
    </div>
  );
}

function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    // Announced through the panel's status region, so no alert role here.
    <div className="rounded-2xl border border-border p-4 text-sm">
      <p className="font-semibold">{title}</p>
      <div className="mt-1 text-muted">{children}</div>
    </div>
  );
}
