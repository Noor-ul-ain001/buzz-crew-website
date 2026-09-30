import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ImageField from "@/components/admin/content/ImageField";
import type { ImageAsset } from "@/lib/content/types";

const uploadImageFile = vi.fn();

vi.mock("@/lib/content/uploads", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/content/uploads")>();
  return { ...actual, uploadImageFile: (...args: unknown[]) => uploadImageFile(...args) };
});

function Harness({ initial = null }: { initial?: ImageAsset | null }) {
  const [value, setValue] = useState<ImageAsset | null>(initial);
  const [name, setName] = useState("Kept value");
  return (
    <>
      <label>
        Name <input value={name} onChange={(event) => setName(event.target.value)} />
      </label>
      <ImageField label="Photo" value={value} onChange={setValue} />
      <output data-testid="media-id">{value?.mediaId ?? ""}</output>
    </>
  );
}

function fileInput(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement;
}

const jpeg = (size = 1000, name = "photo.jpg") => new File([new Uint8Array(size)], name, { type: "image/jpeg" });

describe("ImageField", () => {
  beforeEach(() => {
    uploadImageFile.mockReset();
    URL.createObjectURL = vi.fn(() => "blob:preview");
  });

  it("refuses the wrong type before uploading", async () => {
    const { container } = render(<Harness />);
    const pdf = new File(["%PDF"], "cv.pdf", { type: "application/pdf" });
    await userEvent.upload(fileInput(container), pdf, { applyAccept: false });
    expect(screen.getByRole("alert")).toHaveTextContent("That file is a PDF. Please choose a JPEG, PNG or WebP image.");
    expect(uploadImageFile).not.toHaveBeenCalled();
  });

  it("refuses files over 5 MB before uploading", async () => {
    const { container } = render(<Harness />);
    await userEvent.upload(fileInput(container), jpeg(6 * 1024 * 1024));
    expect(screen.getByRole("alert")).toHaveTextContent("The limit is 5 MB");
    expect(uploadImageFile).not.toHaveBeenCalled();
  });

  it("previews at once, then stores the uploaded image and shows size warnings", async () => {
    uploadImageFile.mockResolvedValue({
      id: "media-1",
      url: "https://res.cloudinary.com/demo/image/upload/v1/x.jpg",
      alt_text: null,
      width: 100,
      height: 100,
      warnings: ["below_min_size"],
    });
    const { container } = render(<Harness />);
    await userEvent.upload(fileInput(container), jpeg());
    await waitFor(() => expect(screen.getByTestId("media-id")).toHaveTextContent("media-1"));
    expect(screen.getByText(/smaller than 400 × 400 pixels/)).toHaveAttribute("role", "status");
    expect(container.querySelector("img")).toHaveAttribute("src", "https://res.cloudinary.com/demo/image/upload/v1/x.jpg");
  });

  it("counts alt text characters and explains why it's needed", async () => {
    render(<Harness initial={{ url: "/a.webp", alt: "", mediaId: "m1" }} />);
    expect(screen.getByText("Alt text is required before this can be published.")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText(/^Alt text/), "Ayesha");
    expect(screen.getByText(/6\/150 characters/)).toBeInTheDocument();
  });

  it("offers a retry after a failed upload and keeps the rest of the form", async () => {
    uploadImageFile.mockRejectedValueOnce(new Error("The upload didn't finish. Please try again."));
    uploadImageFile.mockResolvedValueOnce({ id: "media-2", url: "/b.jpg", alt_text: null, width: 800, height: 800, warnings: [] });
    const { container } = render(<Harness />);
    await userEvent.upload(fileInput(container), jpeg());
    const retry = await screen.findByRole("button", { name: "Retry upload" });
    expect(screen.getByRole("alert")).toHaveTextContent("The upload didn't finish.");

    await userEvent.click(retry);
    await waitFor(() => expect(screen.getByTestId("media-id")).toHaveTextContent("media-2"));
    expect(screen.getByLabelText("Name")).toHaveValue("Kept value");
    expect(uploadImageFile).toHaveBeenCalledTimes(2);
  });
});
