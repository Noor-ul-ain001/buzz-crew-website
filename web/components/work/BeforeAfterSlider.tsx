"use client";

import Image from "next/image";
import { useId, useState, type KeyboardEvent } from "react";
import type { Schemas } from "@/lib/api/client";

type Props = {
  before: Schemas["PublicImage"];
  after: Schemas["PublicImage"];
  beforeLabel: string;
  afterLabel: string;
};

const clamp = (value: number) => Math.min(100, Math.max(0, value));

// A native range input over two stacked images (005 T031): mouse, touch and keyboard all
// work, screen readers hear the split, and vertical scrolling still works on touch.
export default function BeforeAfterSlider({ before, after, beforeLabel, afterLabel }: Props) {
  const [position, setPosition] = useState(50);
  const id = useId();

  // Arrow keys move by 1 and Page Up/Down by 10 natively; Home/End are set explicitly so
  // every browser behaves the same.
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const moves: Record<string, number> = { PageUp: position + 10, PageDown: position - 10, Home: 0, End: 100 };
    if (event.key in moves) {
      event.preventDefault();
      setPosition(clamp(moves[event.key]));
    }
  }

  return (
    <figure className="flex flex-col gap-3">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-surface">
        <Image src={before.url} alt={before.alt} fill sizes="(min-width: 1024px) 60rem, 100vw" className="object-cover" />
        <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${position}%)` }}>
          <Image src={after.url} alt={after.alt} fill sizes="(min-width: 1024px) 60rem, 100vw" className="object-cover" />
        </div>
        <div aria-hidden="true" className="absolute inset-y-0 w-0.5 bg-white shadow" style={{ left: `${position}%` }} />
        <span className="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">{beforeLabel}</span>
        <span className="absolute top-3 right-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">{afterLabel}</span>
        <input
          id={id}
          type="range"
          min={0}
          max={100}
          step={1}
          value={position}
          onChange={(event) => setPosition(clamp(Number(event.target.value)))}
          onKeyDown={onKeyDown}
          aria-label="Before and after comparison"
          aria-valuetext={`Showing ${position}% before, ${100 - position}% after`}
          className="absolute inset-0 size-full cursor-ew-resize opacity-0 focus-visible:opacity-100"
          style={{ touchAction: "pan-y" }}
        />
      </div>
      <figcaption className="text-sm text-muted">
        Drag the slider, or use the arrow keys, to compare {beforeLabel.toLowerCase()} and {afterLabel.toLowerCase()}.
      </figcaption>
    </figure>
  );
}
