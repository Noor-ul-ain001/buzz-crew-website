"use client";

import { useEffect, useId, useRef, useState } from "react";
import TestimonialCard from "@/components/home/TestimonialCard";
import type { Testimonial } from "@/lib/content/types";

// A swipeable, scroll-snapping carousel with Previous/Next buttons. It never moves on
// its own, so there is nothing to pause, and it jumps instead of scrolling smoothly when
// the visitor prefers reduced motion.
export default function TestimonialsCarousel({ testimonials, labelledBy }: { testimonials: Testimonial[]; labelledBy: string }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(1);
  const statusId = useId();

  // Track which slide is first in view, and how many fit, from the scroll position.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const update = () => {
      const slide = track.firstElementChild as HTMLElement | null;
      if (!slide) return;
      const step = slide.offsetWidth + Number.parseFloat(getComputedStyle(track).columnGap || "0");
      setIndex(Math.round(track.scrollLeft / step));
      setVisible(Math.max(1, Math.round(track.clientWidth / step)));
    };
    update();
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  // The end buttons use aria-disabled rather than disabled, so keyboard focus stays on
  // them when the carousel reaches either end.
  function go(direction: -1 | 1) {
    if ((direction < 0 && atStart) || (direction > 0 && atEnd)) return;
    const track = trackRef.current;
    const target = track?.children[Math.min(testimonials.length - 1, Math.max(0, index + direction))] as HTMLElement | undefined;
    if (!track || !target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The track is the slides' offset parent, so offsetLeft is the slide's scroll position.
    const padding = Number.parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    track.scrollTo({ left: target.offsetLeft - padding, behavior: reduceMotion ? "auto" : "smooth" });
  }

  const count = testimonials.length;
  const last = Math.min(count, index + visible);
  const atStart = index <= 0;
  const atEnd = index + visible >= count;

  return (
    <div role="region" aria-roledescription="carousel" aria-labelledby={labelledBy}>
      <ul
        ref={trackRef}
        tabIndex={0}
        aria-label="Testimonials, scroll sideways for more"
        className="relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 [&::-webkit-scrollbar]:hidden"
      >
        {testimonials.map((testimonial, position) => (
          <li
            key={testimonial.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${position + 1} of ${count}`}
            className="w-[85%] shrink-0 snap-start sm:w-[calc(50%-0.5rem)] lg:w-[calc((100%-2rem)/3)]"
          >
            <TestimonialCard testimonial={testimonial} />
          </li>
        ))}
      </ul>

      {count > visible && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <p id={statusId} aria-live="polite" className="text-sm text-muted">
            {last > index + 1 ? `${index + 1}–${last}` : index + 1} of {count}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => go(-1)}
              aria-disabled={atStart || undefined}
              aria-describedby={statusId}
              className="inline-flex size-11 items-center justify-center rounded-full border border-foreground hover:bg-surface aria-disabled:border-border aria-disabled:opacity-40"
            >
              <span className="sr-only">Previous testimonial</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-disabled={atEnd || undefined}
              aria-describedby={statusId}
              className="inline-flex size-11 items-center justify-center rounded-full border border-foreground hover:bg-surface aria-disabled:border-border aria-disabled:opacity-40"
            >
              <span className="sr-only">Next testimonial</span>
              <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
