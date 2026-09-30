import type { ReactNode } from "react";

export type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
};

// Long-form layout for legal pages: readable measure, sticky table of contents on desktop.
export default function LegalPage({
  title,
  lastUpdated,
  intro,
  sections,
}: {
  title: string;
  lastUpdated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
      <div
        role="note"
        className="mb-10 rounded-lg border-2 border-dashed border-accent bg-accent/10 px-4 py-3 text-sm font-semibold"
      >
        Placeholder: to be reviewed. This text is not legal advice and has not been approved
        for publication.
      </div>

      <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-16">
        <nav aria-labelledby="toc-heading" className="hidden lg:block">
          <div className="sticky top-8">
            <h2 id="toc-heading" className="text-sm font-semibold uppercase tracking-wide text-muted">
              On this page
            </h2>
            <ol className="mt-4 flex flex-col gap-2 border-l border-border text-sm">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px block border-l-2 border-transparent pl-4 text-muted hover:border-foreground hover:text-foreground"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        <article className="max-w-prose">
          <header>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{title}</h1>
            <p className="mt-3 text-sm text-muted">Last updated: {lastUpdated}</p>
            <div className="mt-6 text-lg leading-relaxed text-muted">{intro}</div>
          </header>

          {sections.map((section, index) => (
            <section key={section.id} aria-labelledby={section.id} className="mt-12">
              <h2 id={section.id} className="scroll-mt-8 text-2xl font-semibold tracking-tight">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-4 flex flex-col gap-4 leading-relaxed [&_a]:underline [&_li]:ml-5 [&_ul]:list-disc [&_ul]:space-y-2">
                {section.body}
              </div>
            </section>
          ))}
        </article>
      </div>
    </main>
  );
}
