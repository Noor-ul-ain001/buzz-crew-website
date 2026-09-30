import { api, type Schemas } from "@/lib/api/client";
import { errorMessage } from "@/lib/auth/errors";

export type ImageUsage = "photo" | "logo";
export type UploadedImage = Schemas["MediaOut"];

export const ACCEPTED_IMAGE_TYPES = { "image/jpeg": "JPEG", "image/png": "PNG", "image/webp": "WebP" } as const;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export const MIN_SIZE_HINT: Record<ImageUsage, string> = {
  photo: "This image is smaller than 400 × 400 pixels, so it may look blurry on the site.",
  logo: "This logo is narrower than 200 pixels, so it may look blurry on the site.",
};

function formatSize(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Checks the browser can do before anything is sent; the API re-checks the real content. */
export function validateImageFile(file: File): string | null {
  if (!(file.type in ACCEPTED_IMAGE_TYPES)) {
    const extension = file.name.includes(".") ? file.name.split(".").pop()?.toUpperCase() : null;
    return `${extension ? `That file is a ${extension}.` : "That file type isn't supported."} Please choose a JPEG, PNG or WebP image.`;
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return `That image is ${formatSize(file.size)}. The limit is 5 MB, so try a smaller or compressed version.`;
  }
  return null;
}

export class UploadError extends Error {}

type Signature = Record<string, string | number> & { upload_url: string };

function postToCloudinary(file: File, signature: Signature, onProgress: (percent: number) => void) {
  return new Promise<{ public_id: string }>((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    for (const key of ["api_key", "timestamp", "signature", "folder", "public_id", "allowed_formats"]) {
      if (signature[key] !== undefined) form.append(key, String(signature[key]));
    }
    const request = new XMLHttpRequest();
    request.open("POST", signature.upload_url);
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) resolve(JSON.parse(request.responseText));
      else reject(new UploadError("The upload didn't finish. Please try again."));
    };
    request.onerror = () => reject(new UploadError("The upload didn't finish. Check your connection and try again."));
    request.send(form);
  });
}

/**
 * Signed direct upload (DEPLOYMENT D6): ask the API for a signature, send the file straight
 * to Cloudinary with progress, then let the API check and store a clean copy.
 */
export async function uploadImageFile(
  file: File,
  usage: ImageUsage,
  onProgress: (percent: number) => void,
): Promise<UploadedImage> {
  const signed = await api.POST("/api/v1/uploads/signature", { body: { usage } });
  if (!signed.data) throw new UploadError(errorMessage(signed.error, "Uploads aren't available right now."));

  const uploaded = await postToCloudinary(file, signed.data as Signature, onProgress);

  const finalized = await api.POST("/api/v1/uploads/finalize", {
    body: { public_id: uploaded.public_id, usage, original_filename: file.name },
  });
  if (!finalized.data) throw new UploadError(errorMessage(finalized.error, "That image couldn't be used."));
  return finalized.data;
}
