import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

// Called by the API after content is published, edited, reordered or removed (004 T007).
// The body is signed with HMAC-SHA256 using REVALIDATE_SECRET, shared with the API.
const MAX_TAGS = 20;

function validSignature(body: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = Buffer.from(createHmac("sha256", secret).update(body).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  const body = await request.text();
  if (!secret || !validSignature(body, request.headers.get("x-revalidate-signature"), secret)) {
    return Response.json({ detail: { code: "invalid_signature" } }, { status: 401 });
  }

  let tags: unknown;
  try {
    tags = (JSON.parse(body) as { tags?: unknown }).tags;
  } catch {
    return Response.json({ detail: { code: "invalid_body" } }, { status: 400 });
  }
  if (!Array.isArray(tags) || tags.length > MAX_TAGS || !tags.every((tag) => typeof tag === "string")) {
    return Response.json({ detail: { code: "invalid_body" } }, { status: 400 });
  }

  // expire: 0 so the next visitor sees the change, not a stale copy.
  for (const tag of tags as string[]) revalidateTag(tag, { expire: 0 });
  return Response.json({ revalidated: tags });
}
