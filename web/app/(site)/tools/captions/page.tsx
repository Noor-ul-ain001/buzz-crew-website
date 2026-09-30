import CaptionTool from "@/components/captions/CaptionTool";
import { pageMetadata } from "@/lib/metadata";

export const metadata = pageMetadata({
  title: "Free caption and post idea generator",
  description:
    "Get ready-to-edit post ideas, captions and hashtags for Instagram, Facebook, TikTok and LinkedIn, tailored to your business and goal.",
  path: "/tools/captions",
});

export default function CaptionsPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-muted">Free tool</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Stuck on what to post?</h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Tell us about your business and goal, pick a platform, and get four post ideas with captions and hashtags you can
        copy and adapt.
      </p>
      <div className="mt-10">
        <CaptionTool />
      </div>
    </main>
  );
}
