import ReactMarkdown, { type Components } from "react-markdown";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

// Renders post Markdown (GitHub-flavoured: tables, strikethrough, task lists). Raw HTML
// in the Markdown is not rendered, so authors can't inject scripts. Headings get ids from
// rehype-slug, matching extractHeadings() for the table of contents.
// Works in server components (blog posts) and client components (the admin preview).

const components: Components = {
  // An image on its own line becomes a <figure>; unwrap its paragraph, since a <figure>
  // inside a <p> is invalid HTML.
  p({ node, children, ...props }) {
    const only = node?.children.length === 1 ? node.children[0] : null;
    if (only && only.type === "element" && only.tagName === "img") return <>{children}</>;
    return <p {...props}>{children}</p>;
  },
  img({ src, alt, title }) {
    if (typeof src !== "string" || !src) return null;
    return (
      <figure>
        {/* Post images can be any size or host; next/image would need both known up front. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt ?? ""} loading="lazy" decoding="async" className="w-full rounded-2xl" />
        {title && <figcaption>{title}</figcaption>}
      </figure>
    );
  },
  a({ href, children, node: _node, ...props }) {
    void _node;
    const external = href?.startsWith("http");
    return (
      <a href={href} {...props} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
        {external && <span className="sr-only"> (opens in a new tab)</span>}
      </a>
    );
  },
  // Wide tables scroll sideways on phones instead of stretching the page.
  table({ node: _node, ...props }) {
    void _node;
    return (
      <div className="overflow-x-auto">
        <table {...props} />
      </div>
    );
  },
};

export default function Markdown({ markdown, className = "" }: { markdown: string; className?: string }) {
  return (
    <div
      className={`prose max-w-none prose-headings:scroll-mt-24 prose-headings:tracking-tight prose-a:underline-offset-4 prose-blockquote:font-normal prose-blockquote:not-italic prose-code:rounded prose-code:bg-surface prose-code:px-1 prose-code:font-medium prose-code:before:content-none prose-code:after:content-none prose-pre:border prose-pre:border-border ${className}`}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
