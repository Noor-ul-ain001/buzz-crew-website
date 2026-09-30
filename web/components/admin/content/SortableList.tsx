"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useId, useState, type ReactNode } from "react";

type Item = { id: string };

export type DragHandle = ReactNode;

// Drag to reorder with a mouse, touch or the keyboard: focus a handle, press Space to pick
// the item up, move it with the arrow keys, Space to drop, Escape to cancel. Screen
// readers hear each step through dnd-kit's live region.
export default function SortableList<T extends Item>({
  items,
  getLabel,
  onReorder,
  layout = "list",
  className,
  renderItem,
}: {
  items: T[];
  getLabel: (item: T) => string;
  onReorder: (ids: string[]) => void;
  layout?: "list" | "grid";
  className?: string;
  renderItem: (item: T, handle: DragHandle) => ReactNode;
}) {
  // A stable id keeps dnd-kit's generated aria ids identical on server and client.
  const dndId = useId();
  const [announcement, setAnnouncement] = useState("");

  // Buttons are the simplest way to reorder with a keyboard or switch control.
  function move(id: string, delta: -1 | 1) {
    const from = items.findIndex((item) => item.id === id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= items.length) return;
    onReorder(arrayMove(items, from, to).map((item) => item.id));
    setAnnouncement(`${getLabel(items[from])} moved to position ${to + 1} of ${items.length}.`);
  }
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const label = (id: UniqueIdentifier) => {
    const item = items.find((candidate) => candidate.id === id);
    return item ? getLabel(item) : "item";
  };
  const position = (id: UniqueIdentifier) => items.findIndex((item) => item.id === id) + 1;

  const announcements: Announcements = {
    onDragStart: ({ active }) => `Picked up ${label(active.id)}, position ${position(active.id)} of ${items.length}.`,
    onDragOver: ({ active, over }) =>
      over ? `${label(active.id)} is now at position ${position(over.id)} of ${items.length}.` : undefined,
    onDragEnd: ({ active, over }) =>
      over ? `Dropped ${label(active.id)} at position ${position(over.id)} of ${items.length}.` : `Dropped ${label(active.id)}.`,
    onDragCancel: ({ active }) => `Cancelled. ${label(active.id)} is back at position ${position(active.id)}.`,
  };

  function handleDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((item) => item.id === active.id);
    const to = items.findIndex((item) => item.id === over.id);
    onReorder(arrayMove(items, from, to).map((item) => item.id));
  }

  return (
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: {
          draggable:
            "To reorder, press Space to pick up. Use the arrow keys to move, Space to drop, or Escape to cancel.",
        },
      }}
    >
      <SortableContext
        items={items.map((item) => item.id)}
        strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <ol className={className}>
          {items.map((item, index) => (
            <SortableItem
              key={item.id}
              id={item.id}
              label={getLabel(item)}
              onMoveUp={index > 0 ? () => move(item.id, -1) : undefined}
              onMoveDown={index < items.length - 1 ? () => move(item.id, 1) : undefined}
            >
              {(handle) => renderItem(item, handle)}
            </SortableItem>
          ))}
        </ol>
      </SortableContext>
      <p role="status" className="sr-only">
        {announcement}
      </p>
    </DndContext>
  );
}

const moveButtonClass =
  "inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-surface hover:text-foreground disabled:opacity-30";

function SortableItem({
  id,
  label,
  onMoveUp,
  onMoveDown,
  children,
}: {
  id: string;
  label: string;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  children: (handle: DragHandle) => ReactNode;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });

  const handle = (
    <span className="inline-flex shrink-0 items-center">
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${label}`}
        className="inline-flex size-9 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground active:cursor-grabbing"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="currentColor">
          <circle cx="9" cy="6" r="1.6" />
          <circle cx="15" cy="6" r="1.6" />
          <circle cx="9" cy="12" r="1.6" />
          <circle cx="15" cy="12" r="1.6" />
          <circle cx="9" cy="18" r="1.6" />
          <circle cx="15" cy="18" r="1.6" />
        </svg>
      </button>
      <span className="flex flex-col">
        <button type="button" onClick={onMoveUp} disabled={!onMoveUp} aria-label={`Move ${label} up`} className={moveButtonClass}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m6 15 6-6 6 6" />
          </svg>
        </button>
        <button type="button" onClick={onMoveDown} disabled={!onMoveDown} aria-label={`Move ${label} down`} className={moveButtonClass}>
          <svg aria-hidden="true" viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </span>
    </span>
  );

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "relative z-10 opacity-90 shadow-xl" : undefined}
    >
      {children(handle)}
    </li>
  );
}
