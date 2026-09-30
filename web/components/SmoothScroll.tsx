"use client";

import { ReactLenis } from "lenis/react";

// Inertia smooth scrolling for the public site (Lenis wraps native scroll, so sticky
// elements, the CSS scroll-driven reveals and keyboard scrolling keep working). Visitors
// who prefer reduced motion get native scrolling (Lenis's default). Dialogs and the chat
// panel scroll natively, so wheel events there never move the page behind them.
// Rendered once in the site layout; with `root` it drives the page scroll itself.
export default function SmoothScroll() {
  return (
    <ReactLenis
      root
      options={{
        autoRaf: true,
        lerp: 0.1,
        anchors: { offset: -80 },
        prevent: (node) => node.closest("dialog, [role='dialog'], [data-lenis-prevent]") !== null,
      }}
    />
  );
}
