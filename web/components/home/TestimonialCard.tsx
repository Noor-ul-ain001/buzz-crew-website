import type { Testimonial } from "@/lib/content/types";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

type CardContent = Pick<Testimonial, "name" | "role" | "company" | "country" | "quote" | "photo" | "videoUrl">;

// Used by the homepage carousel and the admin preview, so the preview matches the site.
export default function TestimonialCard({ testimonial }: { testimonial: CardContent }) {
  const { name, role, company, country, quote, photo, videoUrl } = testimonial;
  const byline = [role, company].filter(Boolean).join(", ");
  // "Other" isn't worth showing on the card.
  const place = country === "Other" ? "" : country;

  return (
    <figure className="flex h-full flex-col justify-between gap-8 rounded-3xl border border-border bg-background p-6 sm:p-8">
      <blockquote className="font-display text-2xl leading-snug sm:text-3xl">
        <span aria-hidden="true" className="mb-2 block text-5xl leading-none font-bold text-accent">
          &ldquo;
        </span>
        <p>{quote || <span className="text-muted">The quote will appear here.</span>}</p>
      </blockquote>
      <figcaption className="flex items-center gap-4">
        {photo ? (
          // Small avatars (SVG or a local preview URL): next/image would add nothing here.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo.url} alt={photo.alt} width={56} height={56} className="size-14 shrink-0 rounded-full bg-white object-contain p-1" />
        ) : (
          <span aria-hidden="true" className="flex size-14 shrink-0 items-center justify-center rounded-full bg-accent font-bold text-accent-foreground">
            {initials(name) || "?"}
          </span>
        )}
        <div className="min-w-0">
          <p className="font-semibold">{name || "Name"}</p>
          <p className="text-sm text-muted">
            {byline}
            {byline && place && " · "}
            {place}
          </p>
          {videoUrl && (
            <a href={videoUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-sm font-semibold underline underline-offset-4">
              {name ? `Watch ${name.split(" ")[0]}’s video` : "Watch the video"}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          )}
        </div>
      </figcaption>
    </figure>
  );
}
