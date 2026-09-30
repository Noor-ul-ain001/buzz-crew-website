import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

// Case study sections allow a small, safe subset of Markdown: raw HTML is skipped and only
// these elements render (005 T011). Works in server and client components (admin preview).
const ALLOWED = ["p", "h2", "h3", "ul", "ol", "li", "strong", "em", "a", "blockquote"];

const components: Components = {
  a({ href, children }) {
    const external = href?.startsWith("http");
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  },
};

export default function MarkdownSection({ id, title, markdown }: { id: string; title: string; markdown: string }) {
  if (!markdown.trim()) return null;
  return (
    <section aria-labelledby={id} className="flex flex-col gap-4">
      <h2 id={id} className="text-3xl sm:text-4xl">
        {title}
      </h2>
      <div className="prose prose-neutral max-w-none dark:prose-invert prose-a:underline-offset-4">
        <ReactMarkdown remarkPlugins={[remarkGfm]} skipHtml allowedElements={ALLOWED} unwrapDisallowed components={components}>
          {markdown}
        </ReactMarkdown>
      </div>
    </section>
  );
}
