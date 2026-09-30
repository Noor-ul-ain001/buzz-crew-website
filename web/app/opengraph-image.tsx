import { ImageResponse } from "next/og";
import { logoMarkDataUrl } from "@/lib/og";
import { BRAND_COLORS, SITE_NAME, SITE_TAGLINE } from "@/lib/site";

export const alt = `${SITE_NAME}: ${SITE_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const mark = await logoMarkDataUrl();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: BRAND_COLORS.ink,
          color: BRAND_COLORS.paper,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* next/image isn't available inside ImageResponse. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={106} height={96} alt="" />
          <div style={{ fontSize: 48, fontWeight: 700, letterSpacing: -1 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 104, fontWeight: 800, letterSpacing: -3, lineHeight: 1 }}>
            {SITE_TAGLINE}
          </div>
          <div style={{ display: "flex", width: 240, height: 12, borderRadius: 6, backgroundImage: `linear-gradient(90deg, ${BRAND_COLORS.yellow}, ${BRAND_COLORS.teal}, ${BRAND_COLORS.purple})` }} />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 30, color: "#d4d4d8" }}>
          <span>Social · SEO · Web · Meta Ads</span>
          <span>Karachi · UAE · UK</span>
        </div>
      </div>
    ),
    size,
  );
}
