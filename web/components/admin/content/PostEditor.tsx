"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import ContentNotFound from "@/components/admin/content/ContentNotFound";
import { useContent } from "@/components/admin/content/ContentProvider";
import ImageField from "@/components/admin/content/ImageField";
import MarkdownEditor from "@/components/admin/content/MarkdownEditor";
import PublishActions, { type PublishAction } from "@/components/admin/content/PublishActions";
import PublishBadge from "@/components/admin/content/PublishBadge";
import TagPicker from "@/components/admin/content/TagPicker";
import { usePublishFlow } from "@/components/admin/content/usePublishFlow";
import FormField, { applyIssues, ariaFor, inputClass } from "@/components/ui/FormField";
import { countImagesMissingAlt, estimateReadingMinutes } from "@/lib/blog/markdown";
import { tagSlug } from "@/lib/blog/utils";
import { BLOG_CATEGORIES, type BlogCategorySlug, type BlogPost } from "@/lib/content/types";
import { altTextBlocker, postDraftSchema, postPublishSchema, type PostFormValues } from "@/lib/content/validation";
import { CURRENT_ADMIN } from "@/lib/data/mock-leads";
import { SITE_URL } from "@/lib/site";

const LIST_HREF = "/admin/content/posts";
const META_TITLE_LIMIT = 60;
const META_DESCRIPTION_LIMIT = 160;

export default function PostEditor({ id }: { id?: string }) {
  const { items } = useContent("posts");
  const existing = id ? items.find((item) => item.id === id) : undefined;

  if (id && !existing) return <ContentNotFound noun="post" listHref={LIST_HREF} />;
  return <Editor key={id ?? "new"} existing={existing} />;
}

function Counter({ length, limit }: { length: number; limit: number }) {
  return (
    <span className={length > limit ? "font-semibold text-danger" : ""}>
      {length}/{limit} characters{length > limit && ", may be cut off in search results"}
    </span>
  );
}

function Editor({ existing }: { existing: BlogPost | undefined }) {
  const formId = useId();
  const fieldId = (name: string) => `${formId}-${name}`;
  const { items: posts } = useContent("posts");
  const { items: team } = useContent("team");
  const { pending, run } = usePublishFlow("posts", existing, LIST_HREF, () => {});
  // The slug follows the title until someone edits it by hand (always, for saved posts).
  const [slugEdited, setSlugEdited] = useState(Boolean(existing));

  const authors = team.filter((member) => member.status === "Published");
  const allTags = [...new Map(posts.flatMap((post) => post.tags).map((tag) => [tagSlug(tag), tag])).values()].sort();

  const {
    register,
    control,
    getValues,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<PostFormValues>({
    defaultValues: existing
      ? {
          title: existing.title,
          slug: existing.slug,
          excerpt: existing.excerpt,
          category: existing.category,
          tags: existing.tags,
          authorName: existing.author.name,
          cover: existing.cover,
          bodyMarkdown: existing.bodyMarkdown,
          metaTitle: existing.seo.metaTitle,
          metaDescription: existing.seo.metaDescription,
        }
      : {
          title: "",
          slug: "",
          excerpt: "",
          category: "",
          tags: [],
          authorName: CURRENT_ADMIN,
          cover: null,
          bodyMarkdown: "",
          metaTitle: "",
          metaDescription: "",
        },
  });

  const values = useWatch({ control }) as PostFormValues;
  const missingBodyAlt = countImagesMissingAlt(values.bodyMarkdown);
  const publishBlocker =
    [
      altTextBlocker([{ label: "cover image", image: values.cover }]),
      missingBodyAlt > 0 &&
        `Add alt text to ${missingBodyAlt === 1 ? "the image" : `${missingBodyAlt} images`} in the post body, e.g. ![Describe the image](…), before publishing.`,
    ]
      .filter(Boolean)
      .join(" ") || null;

  function handleAction(action: PublishAction) {
    clearErrors();
    const schema = action === "publish" ? postPublishSchema : postDraftSchema;
    const result = schema.safeParse(getValues());
    if (!result.success) {
      applyIssues(result, setError);
      return;
    }
    const data = result.data;
    const slug = data.slug || slugify(data.title);
    if (posts.some((post) => post.slug === slug && post.id !== existing?.id)) {
      setError("slug", { message: "Another post already uses this URL. Choose a different slug." }, { shouldFocus: true });
      return;
    }
    const author = authors.find((member) => member.name === data.authorName) ?? team.find((member) => member.name === data.authorName);
    run(action, {
      slug,
      title: data.title,
      excerpt: data.excerpt,
      bodyMarkdown: data.bodyMarkdown,
      cover: data.cover,
      author: author
        ? { name: author.name, role: author.role, photo: author.photo }
        : (existing?.author ?? { name: data.authorName || CURRENT_ADMIN, role: "", photo: null }),
      category: data.category as BlogCategorySlug,
      tags: data.tags,
      // Keep the original date when republishing an edited post.
      publishedAt: existing?.status === "Published" ? existing.publishedAt : new Date().toISOString(),
      readingMinutes: estimateReadingMinutes(data.bodyMarkdown),
      seo: { metaTitle: data.metaTitle, metaDescription: data.metaDescription },
    });
  }

  const slug = values.slug || slugify(values.title);
  const searchTitle = values.metaTitle || values.title || "Post title";
  const searchDescription = values.metaDescription || values.excerpt || "The excerpt is used when there's no meta description.";
  const host = new URL(SITE_URL).host;

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <Link href={LIST_HREF} className="text-sm font-medium text-muted hover:text-foreground">
        ← Blog posts
      </Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{existing ? "Edit post" : "New post"}</h1>
        {existing && <PublishBadge status={existing.status} />}
        {existing?.status === "Published" && (
          <Link href={`/blog/${existing.slug}`} className="text-sm font-medium underline underline-offset-4">
            View on site
          </Link>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">
        <span className="text-danger" aria-hidden="true">*</span> Required to publish. Drafts need a title and category.
      </p>

      <form noValidate onSubmit={(event) => event.preventDefault()} className="mt-8 flex flex-col gap-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="flex flex-col gap-5">
            <FormField id={fieldId("title")} label="Title" required requiredText="required to publish" error={errors.title}>
              <input
                id={fieldId("title")}
                type="text"
                className={`${inputClass} text-lg font-semibold`}
                {...ariaFor(fieldId("title"), errors.title)}
                {...register("title", {
                  onChange: (event) => {
                    if (!slugEdited) setValue("slug", slugify(event.target.value));
                  },
                })}
              />
            </FormField>
            <FormField
              id={fieldId("slug")}
              label="URL slug"
              required
              requiredText="required to publish"
              hint={`${host}/blog/${slug || "…"}`}
              error={errors.slug}
            >
              <input
                id={fieldId("slug")}
                type="text"
                autoCapitalize="none"
                spellCheck={false}
                className={`${inputClass} font-mono`}
                {...ariaFor(fieldId("slug"), errors.slug, true)}
                {...register("slug", { onChange: () => setSlugEdited(true) })}
              />
            </FormField>
            <FormField
              id={fieldId("excerpt")}
              label="Excerpt"
              required
              requiredText="required to publish"
              hint={`Shown on post cards and under the title. ${values.excerpt.length}/300 characters.`}
              error={errors.excerpt}
            >
              <textarea id={fieldId("excerpt")} rows={3} maxLength={300} className={inputClass} {...ariaFor(fieldId("excerpt"), errors.excerpt, true)} {...register("excerpt")} />
            </FormField>
          </div>

          <aside className="flex flex-col gap-5 lg:row-span-2">
            <section aria-labelledby={fieldId("publish")} className="rounded-2xl border border-border p-5">
              <h2 id={fieldId("publish")} className="font-semibold">
                Publish
              </h2>
              <p className="mt-1 mb-4 text-sm text-muted">
                About {estimateReadingMinutes(values.bodyMarkdown)} min read
              </p>
              <PublishActions status={existing?.status ?? null} pending={pending} publishBlocker={publishBlocker} onAction={handleAction} />
            </section>

            <section aria-labelledby={fieldId("details")} className="flex flex-col gap-5 rounded-2xl border border-border p-5">
              <h2 id={fieldId("details")} className="font-semibold">
                Details
              </h2>
              <FormField id={fieldId("category")} label="Category" required requiredText="required" error={errors.category}>
                <select id={fieldId("category")} className={inputClass} {...ariaFor(fieldId("category"), errors.category)} {...register("category")}>
                  <option value="">Choose a category</option>
                  {BLOG_CATEGORIES.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => (
                  <TagPicker value={field.value} onChange={field.onChange} suggestions={allTags} error={errors.tags?.message} />
                )}
              />
              <FormField id={fieldId("author")} label="Author" required requiredText="required to publish" error={errors.authorName}>
                <select id={fieldId("author")} className={inputClass} {...ariaFor(fieldId("author"), errors.authorName)} {...register("authorName")}>
                  <option value="">Choose an author</option>
                  {authors.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </FormField>
            </section>
          </aside>

          <div className="lg:col-start-1">
            <Controller
              control={control}
              name="bodyMarkdown"
              render={({ field }) => (
                <MarkdownEditor
                  label="Post body"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.bodyMarkdown?.message}
                  hint="Markdown: ## for headings, - for lists, > for quotes, ~~~ for code. Images need alt text: ![what the image shows](https://…)."
                />
              )}
            />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <section aria-labelledby={fieldId("cover-heading")} className="rounded-2xl border border-border p-5">
            <h2 id={fieldId("cover-heading")} className="mb-4 font-semibold">
              Cover image
            </h2>
            <Controller
              control={control}
              name="cover"
              render={({ field }) => (
                <ImageField
                  label="Cover (1200 × 630 works best)"
                  value={field.value}
                  onChange={field.onChange}
                  previewShape="wide"
                  altHint="Describe what the image shows. If it's purely decorative, say so briefly, e.g. “Abstract blue shapes”."
                />
              )}
            />
          </section>

          <section aria-labelledby={fieldId("seo-heading")} className="flex flex-col gap-5 rounded-2xl border border-border p-5">
            <h2 id={fieldId("seo-heading")} className="font-semibold">
              Search engines
            </h2>
            <FormField id={fieldId("metaTitle")} label="Meta title (optional)" error={errors.metaTitle}>
              <input
                id={fieldId("metaTitle")}
                type="text"
                placeholder={values.title || "Defaults to the post title"}
                className={inputClass}
                aria-describedby={`${fieldId("metaTitle")}-count`}
                {...register("metaTitle")}
              />
              <p id={`${fieldId("metaTitle")}-count`} className="text-xs text-muted">
                <Counter length={(values.metaTitle || values.title).length} limit={META_TITLE_LIMIT} />
              </p>
            </FormField>
            <FormField id={fieldId("metaDescription")} label="Meta description (optional)" error={errors.metaDescription}>
              <textarea
                id={fieldId("metaDescription")}
                rows={3}
                placeholder={values.excerpt || "Defaults to the excerpt"}
                className={inputClass}
                aria-describedby={`${fieldId("metaDescription")}-count`}
                {...register("metaDescription")}
              />
              <p id={`${fieldId("metaDescription")}-count`} className="text-xs text-muted">
                <Counter length={(values.metaDescription || values.excerpt).length} limit={META_DESCRIPTION_LIMIT} />
              </p>
            </FormField>
            <figure>
              <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Search result preview</figcaption>
              <div className="rounded-xl border border-border bg-white p-4 text-left font-[Arial,sans-serif] text-[#202124]">
                <p className="truncate text-xs text-[#4d5156]">
                  {host} › blog › {slug || "…"}
                </p>
                <p className="mt-1 truncate text-lg text-[#1a0dab]">{searchTitle} | The Buzz Crew</p>
                <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{searchDescription}</p>
              </div>
            </figure>
          </section>
        </div>
      </form>
    </main>
  );
}

function slugify(text: string) {
  return tagSlug(text).replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}
