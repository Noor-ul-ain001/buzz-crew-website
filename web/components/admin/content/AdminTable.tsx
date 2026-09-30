import Link from "next/link";
import type { ReactNode } from "react";

// Simple read-only admin list: a table on wide screens, stacked cards on phones. The
// first column is the row's title; `href` makes it a link.
export type Column<T> = { header: string; cell: (row: T) => ReactNode; className?: string };

export default function AdminTable<T extends { id: string }>({
  caption,
  rows,
  columns,
  titleHeader,
  title,
  href,
  empty = "Nothing here yet.",
}: {
  caption: string;
  rows: T[];
  columns: Column<T>[];
  titleHeader: string;
  title: (row: T) => ReactNode;
  href?: (row: T) => string;
  empty?: string;
}) {
  if (rows.length === 0) {
    return <p className="rounded-2xl border border-dashed border-border px-6 py-16 text-center text-muted">{empty}</p>;
  }

  const titleCell = (row: T) =>
    href ? (
      <Link href={href(row)} className="font-semibold hover:underline hover:underline-offset-4">
        {title(row)}
      </Link>
    ) : (
      <span className="font-semibold">{title(row)}</span>
    );

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-border md:block">
        <table className="w-full text-left text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">
                {titleHeader}
              </th>
              {columns.map((column) => (
                <th key={column.header} scope="col" className={`px-4 py-3 font-semibold ${column.className ?? ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id} className="align-top">
                <th scope="row" className="px-4 py-3 font-normal">
                  {titleCell(row)}
                </th>
                {columns.map((column) => (
                  <td key={column.header} className={`px-4 py-3 ${column.className ?? ""}`}>
                    {column.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="rounded-2xl border border-border p-4">
            <p>{titleCell(row)}</p>
            <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {columns.map((column) => (
                <div key={column.header} className="contents">
                  <dt className="text-muted">{column.header}</dt>
                  <dd>{column.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
