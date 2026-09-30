import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import BeforeAfterSlider from "@/components/work/BeforeAfterSlider";

const image = (name: string) => ({ url: `/${name}.webp`, alt: `${name} photo`, width: 800, height: 600 });

function setup() {
  render(<BeforeAfterSlider before={image("before")} after={image("after")} beforeLabel="Old site" afterLabel="New site" />);
  return screen.getByRole("slider", { name: "Before and after comparison" });
}

describe("BeforeAfterSlider", () => {
  it("starts in the middle and describes the split", () => {
    const slider = setup();
    expect(slider).toHaveValue("50");
    expect(slider).toHaveAttribute("aria-valuetext", "Showing 50% before, 50% after");
  });

  it("moves with the keyboard: arrows by 1, Page Up/Down by 10, Home and End to the ends", () => {
    const slider = setup();
    // Native range inputs step with arrow keys themselves; jsdom doesn't, so emulate the change.
    fireEvent.change(slider, { target: { value: "51" } });
    expect(slider).toHaveValue("51");
    fireEvent.keyDown(slider, { key: "PageUp" });
    expect(slider).toHaveValue("61");
    fireEvent.keyDown(slider, { key: "PageDown" });
    fireEvent.keyDown(slider, { key: "PageDown" });
    expect(slider).toHaveValue("41");
    fireEvent.keyDown(slider, { key: "Home" });
    expect(slider).toHaveValue("0");
    fireEvent.keyDown(slider, { key: "End" });
    expect(slider).toHaveValue("100");
    expect(slider).toHaveAttribute("aria-valuetext", "Showing 100% before, 0% after");
  });

  it("renders the labels as text", () => {
    setup();
    expect(screen.getByText("Old site")).toBeInTheDocument();
    expect(screen.getByText("New site")).toBeInTheDocument();
  });
});
