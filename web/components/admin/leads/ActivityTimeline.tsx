import { STATUS_STYLES } from "@/components/admin/StatusBadge";
import { formatDateTime } from "@/lib/format";
import type { LeadEvent } from "@/lib/leads/types";

// Newest first.
export default function ActivityTimeline({ events }: { events: LeadEvent[] }) {
  const ordered = [...events].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <ol className="mt-4 flex flex-col">
      {ordered.map((event, index) => (
        <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
          {index < ordered.length - 1 && (
            <span aria-hidden="true" className="absolute top-4 left-[5px] h-full w-px bg-border" />
          )}
          <span
            aria-hidden="true"
            className={`relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-background ${STATUS_STYLES[event.to].dot}`}
          />
          <div className="text-sm">
            <p>
              {event.from === null ? (
                <>
                  Lead received from the <strong>{event.actor.toLowerCase()}</strong>
                </>
              ) : (
                <>
                  <strong>{event.actor}</strong> changed the status from {event.from} to{" "}
                  <strong>{event.to}</strong>
                </>
              )}
            </p>
            <time dateTime={event.createdAt} className="text-muted">
              {formatDateTime(event.createdAt)}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
