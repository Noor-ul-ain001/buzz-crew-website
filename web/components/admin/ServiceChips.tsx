import type { LeadService } from "@/lib/leads/types";

export default function ServiceChips({ services }: { services: LeadService[] }) {
  if (services.length === 0) return <span className="text-sm text-muted">None selected</span>;

  return (
    <ul className="flex flex-wrap gap-1.5">
      {services.map((service) => (
        <li
          key={service}
          className="rounded-md border border-border px-2 py-0.5 text-xs font-medium whitespace-nowrap"
        >
          {service}
        </li>
      ))}
    </ul>
  );
}
