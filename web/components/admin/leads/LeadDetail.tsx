"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useLeads } from "@/components/admin/LeadsProvider";
import ActivityTimeline from "@/components/admin/leads/ActivityTimeline";
import DeleteLeadButton from "@/components/admin/leads/DeleteLeadButton";
import NotesThread from "@/components/admin/leads/NotesThread";
import ProposalDraft from "@/components/admin/leads/ProposalDraft";
import StatusControl from "@/components/admin/leads/StatusControl";
import PriorityBadge from "@/components/admin/PriorityBadge";
import ServiceChips from "@/components/admin/ServiceChips";
import StatusBadge from "@/components/admin/StatusBadge";
import CopyButton from "@/components/ui/CopyButton";
import { formatDateTime } from "@/lib/format";
import { scoreLead } from "@/lib/leads/scoring";

const cardClass = "rounded-2xl border border-border p-5 sm:p-6";
const cardHeadingClass = "text-lg font-semibold tracking-tight";

export default function LeadDetail({ id }: { id: string }) {
  const { leads } = useLeads();
  const lead = leads.find((item) => item.id === id);
  // Set while this lead is being deleted, so the page doesn't flash "not found" before
  // the redirect to the list.
  const [deleting, setDeleting] = useState(false);

  if (!lead) {
    if (deleting) return null;
    return (
      <main className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">This lead no longer exists</h1>
        <p className="mt-2 text-muted">It may have been deleted.</p>
        <Link href="/admin/leads" className="mt-6 inline-block rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background">
          Back to leads
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
      <Link href="/admin/leads" className="text-sm font-medium text-muted hover:text-foreground">
        ← All leads
      </Link>

      <header className="mt-4 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{lead.name}</h1>
            <StatusBadge status={lead.status} />
            <PriorityBadge score={scoreLead(lead)} />
          </div>
          <p className="mt-1 text-muted">
            {lead.business || "No business name"} · Received{" "}
            <time dateTime={lead.createdAt}>{formatDateTime(lead.createdAt)}</time>
          </p>
        </div>
        <StatusControl lead={lead} />
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-6">
          <section aria-labelledby="message-heading" className={cardClass}>
            <h2 id="message-heading" className={cardHeadingClass}>
              Message
            </h2>
            <p className="mt-3 leading-relaxed whitespace-pre-wrap">{lead.message}</p>
          </section>

          <section aria-labelledby="proposal-heading" className={cardClass}>
            <h2 id="proposal-heading" className={cardHeadingClass}>
              Proposal
            </h2>
            <ProposalDraft lead={lead} />
          </section>

          <section aria-labelledby="notes-heading" className={cardClass}>
            <h2 id="notes-heading" className={cardHeadingClass}>
              Notes <span className="font-normal text-muted">({lead.notes.length})</span>
            </h2>
            <NotesThread lead={lead} />
          </section>

          <section aria-labelledby="activity-heading" className={cardClass}>
            <h2 id="activity-heading" className={cardHeadingClass}>
              Activity
            </h2>
            <ActivityTimeline events={lead.events} />
          </section>
        </div>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="contact-heading" className={cardClass}>
            <h2 id="contact-heading" className={cardHeadingClass}>
              Contact details
            </h2>
            <dl className="mt-4 flex flex-col gap-4 text-sm">
              <Detail label="Email">
                <a href={`mailto:${lead.email}`} className="font-medium break-all underline-offset-4 hover:underline">
                  {lead.email}
                </a>
                <div className="mt-1.5">
                  <CopyButton value={lead.email} label="email address" />
                </div>
              </Detail>
              <Detail label="Phone">
                {lead.phone ? (
                  <>
                    <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className="font-medium underline-offset-4 hover:underline">
                      {lead.phone}
                    </a>
                    <div className="mt-1.5">
                      <CopyButton value={lead.phone} label="phone number" />
                    </div>
                  </>
                ) : (
                  <span className="text-muted">Not provided</span>
                )}
              </Detail>
              <Detail label="Business">{lead.business || <span className="text-muted">Not provided</span>}</Detail>
              <Detail label="Country">{lead.country}</Detail>
              <Detail label="Budget">{lead.budget}</Detail>
              <Detail label="Services">
                <ServiceChips services={lead.services} />
              </Detail>
            </dl>
          </section>

          <section aria-labelledby="danger-heading" className="rounded-2xl border border-danger/40 p-5 sm:p-6">
            <h2 id="danger-heading" className={cardHeadingClass}>
              Delete lead
            </h2>
            <p className="mt-2 text-sm text-muted">
              Removes this lead, its notes and activity. This can&apos;t be undone.
            </p>
            <DeleteLeadButton lead={lead} onDeleting={setDeleting} />
          </section>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-1">{children}</dd>
    </div>
  );
}
