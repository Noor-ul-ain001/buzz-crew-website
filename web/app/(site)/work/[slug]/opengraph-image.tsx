import { ImageResponse } from "next/og";
import { getCaseStudy } from "@/lib/content/case-studies";
import { logoMarkDataUrl } from "@/lib/og";
import { BRAND_COLORS, SITE_NAME } from "@/lib/site";

// Share image per case study: title, client and the first headline result (005 T014).
export const alt = "Case study from The Buzz Crew";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Cloudinary covers as a cropped PNG (the OG renderer can't read WebP); others are skipped. */
function ogCover(url: string): string | null {
  const marker = "/image/upload/";
  if (!url.startsWith("https://res.cloudinary.com/") || !url.includes(marker)) return null;
  return url.replace(marker, `${marker}f_png,c_fill,w_440,h_630/`);
}

export default async function CaseStudyOpenGraphImage({ params }: { params: Promise<{ slug: string }> }) {
  const found = await getCaseStudy((await params).slug);
  const caseStudy = found.kind === "found" ? found.caseStudy : null;
  const mark = await logoMarkDataUrl();
  const metric = caseStudy?.headline_metrics[0];
  const title = caseStudy?.title ?? SITE_NAME;
  const cover = caseStudy ? ogCover(caseStudy.cover.url) : null;

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: BRAND_COLORS.ink, color: BRAND_COLORS.paper }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 64, width: cover ? 760 : 1200 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* next/image isn't available inside ImageResponse. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mark} width={62} height={56} alt="" />
            <div style={{ fontSize: 30, fontWeight: 700 }}>{`${SITE_NAME} · Case study`}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {caseStudy && <div style={{ fontSize: 28, fontWeight: 700, color: BRAND_COLORS.yellow }}>{caseStudy.client_name}</div>}
            <div style={{ fontSize: title.length > 50 ? 52 : 62, fontWeight: 800, lineHeight: 1.05, letterSpacing: -1.5 }}>{title}</div>
          </div>
          {metric ? (
            <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
              <div style={{ fontSize: 72, fontWeight: 800, color: BRAND_COLORS.yellow }}>{metric.value}</div>
              <div style={{ fontSize: 28, color: "#d4d4d8" }}>{`${metric.label} ${metric.period}`}</div>
            </div>
          ) : (
            <div style={{ display: "flex" }} />
          )}
        </div>
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} width={440} height={630} alt="" style={{ objectFit: "cover" }} />
        )}
      </div>
    ),
    size,
  );
}
