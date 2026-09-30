"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";
import type { ImageAsset } from "@/lib/content/types";
import {
  ACCEPTED_IMAGE_TYPES,
  MIN_SIZE_HINT,
  uploadImageFile,
  validateImageFile,
  type ImageUsage,
} from "@/lib/content/uploads";

type Status = { kind: "idle" } | { kind: "uploading"; percent: number } | { kind: "failed"; message: string };

/**
 * Image field (004 US2): drag-and-drop or browse, checks in the browser, an instant preview,
 * a signed upload straight to Cloudinary with progress, and alt text required to publish.
 * `value.mediaId` is set once the API has checked and stored the image.
 */
export default function ImageField({
  label,
  usage = "photo",
  value,
  onChange,
  error: serverError,
  altHint = "Describe the image for people who can't see it, e.g. “Bilal Ahmed smiling in his café”.",
  previewShape = "square",
}: {
  label: string;
  usage?: ImageUsage;
  value: ImageAsset | null;
  onChange: (value: ImageAsset | null) => void;
  /** An error from the API for this image, e.g. about its alt text. */
  error?: string;
  altHint?: string;
  previewShape?: "square" | "wide";
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [problem, setProblem] = useState("");
  const [warning, setWarning] = useState("");
  const [dragging, setDragging] = useState(false);
  const [failedFile, setFailedFile] = useState<File | null>(null);
  // The latest value, so alt text typed during an upload isn't lost when it finishes.
  const latest = useRef(value);
  useEffect(() => {
    latest.current = value;
  }, [value]);

  async function upload(file: File) {
    setStatus({ kind: "uploading", percent: 0 });
    try {
      const media = await uploadImageFile(file, usage, (percent) => setStatus({ kind: "uploading", percent }));
      setFailedFile(null);
      const alt = latest.current?.alt ?? "";
      onChange({ url: media.url, alt, savedAlt: media.alt_text ?? "", mediaId: media.id, width: media.width, height: media.height });
      setWarning(media.warnings?.includes("below_min_size") ? MIN_SIZE_HINT[usage] : "");
      setStatus({ kind: "idle" });
    } catch (uploadError) {
      setFailedFile(file);
      setStatus({ kind: "failed", message: uploadError instanceof Error ? uploadError.message : "The upload didn't finish." });
    }
  }

  function handleFile(file: File | undefined) {
    if (inputRef.current) inputRef.current.value = "";
    if (!file) return;
    const invalid = validateImageFile(file);
    if (invalid) {
      setProblem(invalid);
      return;
    }
    setProblem("");
    setWarning("");
    // Preview straight away; the stored copy replaces it when the upload finishes.
    onChange({ url: URL.createObjectURL(file), alt: latest.current?.alt ?? "" });
    void upload(file);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 1) {
      setProblem("Drop one image at a time.");
      return;
    }
    handleFile(event.dataTransfer.files[0]);
  }

  const uploading = status.kind === "uploading";
  const message = problem || (status.kind === "failed" ? status.message : "") || serverError || "";
  const missingAlt = value !== null && !value.alt.trim();
  const errorId = `${id}-error`;
  const altId = `${id}-alt`;
  const altHintId = `${id}-alt-hint`;
  const altWarningId = `${id}-alt-warning`;
  const frame = previewShape === "wide" ? "h-20 w-40" : "size-20";

  return (
    <fieldset className="flex flex-col gap-3" aria-busy={uploading || undefined}>
      <legend className="mb-1.5 text-sm font-medium">
        {label} <span className="font-normal text-muted">(JPEG, PNG or WebP, up to 5 MB)</span>
      </legend>

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center gap-4 rounded-xl border-2 border-dashed p-4 sm:flex-row ${
          dragging ? "border-foreground bg-surface" : message ? "border-danger" : "border-border"
        }`}
      >
        {value ? (
          // Local previews are object URLs, which next/image can't optimise.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value.url}
            alt=""
            className={`shrink-0 rounded-lg border border-border bg-surface ${frame} ${
              previewShape === "wide" ? "object-contain" : "object-cover"
            }`}
          />
        ) : (
          <span aria-hidden="true" className={`flex shrink-0 items-center justify-center rounded-lg bg-surface text-muted ${frame}`}>
            <svg viewBox="0 0 24 24" className="size-7" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="16" rx="2" />
              <circle cx="9" cy="10" r="2" />
              <path d="m21 16-5-5-9 9" />
            </svg>
          </span>
        )}

        <div className="flex flex-1 flex-col items-center gap-2 text-center sm:items-start sm:text-left">
          {uploading ? (
            <div className="flex w-full max-w-xs flex-col gap-1.5">
              <p className="text-sm text-muted">Uploading… {status.percent}%</p>
              <progress max={100} value={status.percent} aria-label={`Uploading ${label.toLowerCase()}`} className="h-2 w-full accent-foreground" />
            </div>
          ) : (
            <p className="text-sm text-muted">{value ? "Drop a new image here to replace it, or" : "Drag an image here, or"}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              aria-describedby={message ? errorId : undefined}
              className="rounded-full border border-foreground px-4 py-1.5 text-sm font-semibold hover:bg-surface disabled:opacity-60"
            >
              {value ? "Choose another image" : "Choose an image"}
              <span className="sr-only"> for {label.toLowerCase()}</span>
            </button>
            {status.kind === "failed" && failedFile && (
              <button
                type="button"
                onClick={() => void upload(failedFile)}
                className="rounded-full bg-foreground px-4 py-1.5 text-sm font-semibold text-background"
              >
                Retry upload
              </button>
            )}
            {value && !uploading && (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setProblem("");
                  setWarning("");
                  setStatus({ kind: "idle" });
                }}
                className="rounded-full px-4 py-1.5 text-sm font-medium text-danger hover:bg-surface"
              >
                Remove
                <span className="sr-only"> {label.toLowerCase()}</span>
              </button>
            )}
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={Object.keys(ACCEPTED_IMAGE_TYPES).join(",")}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
      </div>

      {/* Live regions stay mounted so each new message is announced. */}
      <p id={errorId} role="alert" className="text-sm text-danger empty:hidden">
        {message}
      </p>
      <p role="status" className="text-sm text-amber-700 empty:hidden dark:text-amber-300">
        {warning}
      </p>

      {value && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor={altId} className="text-sm font-medium">
            Alt text{" "}
            <span className="text-danger" aria-hidden="true">
              *
            </span>
            <span className="sr-only">(required to publish)</span>
          </label>
          <input
            id={altId}
            type="text"
            value={value.alt}
            onChange={(event) => onChange({ ...value, alt: event.target.value })}
            maxLength={150}
            aria-invalid={missingAlt ? true : undefined}
            aria-describedby={missingAlt ? `${altHintId} ${altWarningId}` : altHintId}
            className="block w-full rounded-lg border border-border bg-background px-3.5 py-2.5 text-sm aria-[invalid=true]:border-danger"
          />
          <p id={altHintId} className="text-xs text-muted">
            {altHint} {value.alt.length}/150 characters.
          </p>
          {missingAlt && (
            <p id={altWarningId} className="text-sm text-danger">
              Alt text is required before this can be published.
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}

/** True while an image has been chosen but isn't stored by the API yet. */
export function imagePending(image: ImageAsset | null) {
  return image !== null && !image.mediaId && image.url.startsWith("blob:");
}
