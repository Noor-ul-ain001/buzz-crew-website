import PostCard, { FeaturedPost } from "@/components/blog/PostCard";
import Pagination from "@/components/Pagination";
import { paginate } from "@/lib/data/blog";
import type { BlogPost } from "@/lib/content/types";

// Post grid with pagination. With `featureLatest`, the newest post is shown large at the
// top of the first page and the grid continues from the second post.
export default function PostListing({
  posts,
  page,
  basePath,
  featureLatest = false,
}: {
  posts: BlogPost[];
  page: number;
  basePath: string;
  featureLatest?: boolean;
}) {
  if (posts.length === 0) {
    return <p className="mt-12 rounded-2xl border border-dashed border-border px-6 py-16 text-center text-muted">No posts here yet.</p>;
  }

  const [latest, ...rest] = posts;
  const grid = paginate(featureLatest ? rest : posts, page);
  const showFeatured = featureLatest && grid.page === 1;

  return (
    <>
      {showFeatured && (
        <div className="mt-10">
          <FeaturedPost post={latest} />
        </div>
      )}
      {grid.items.length > 0 && (
        <section aria-label={showFeatured ? "More posts" : "Posts"} className="mt-14">
          <ul className="grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {grid.items.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        </section>
      )}
      <Pagination basePath={basePath} page={grid.page} pageCount={grid.pageCount} />
    </>
  );
}
