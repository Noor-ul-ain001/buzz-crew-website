import Link from "next/link";

// Numbered pagination with real links (?page=N), so every page can be crawled and shared.
export default function Pagination({ basePath, page, pageCount }: { basePath: string; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (target: number) => (target === 1 ? basePath : `${basePath}?page=${target}`);
  const itemClass = "inline-flex min-w-10 items-center justify-center rounded-full border px-3 py-2 text-sm font-medium";

  return (
    <nav aria-label="Pagination" className="mt-12 flex flex-wrap items-center justify-center gap-2">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${itemClass} border-border hover:bg-surface`}>
          ← Previous<span className="sr-only"> page</span>
        </Link>
      ) : null}
      <ul className="flex gap-2">
        {Array.from({ length: pageCount }, (_, index) => index + 1).map((target) => (
          <li key={target}>
            <Link
              href={href(target)}
              aria-current={target === page ? "page" : undefined}
              className={`${itemClass} border-border hover:bg-surface aria-[current=page]:border-foreground aria-[current=page]:bg-foreground aria-[current=page]:text-background`}
            >
              <span className="sr-only">Page </span>
              {target}
            </Link>
          </li>
        ))}
      </ul>
      {page < pageCount ? (
        <Link href={href(page + 1)} className={`${itemClass} border-border hover:bg-surface`}>
          Next<span className="sr-only"> page</span> →
        </Link>
      ) : null}
    </nav>
  );
}
