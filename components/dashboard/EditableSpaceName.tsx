"use client";

import { useRef, useState, useTransition } from "react";
import { renameSpace } from "@/lib/actions/spaces";

// Space name doubles as the page's <h1>, so the edit affordance has to be
// discoverable without a label sitting next to it (see docs/DESIGN-SYSTEM.md's
// restraint principle) — hence the hover-revealed pencil rather than a
// permanently-visible "rename" button.
export function EditableSpaceName({
  spaceId,
  initialName,
}: {
  spaceId: string;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [draft, setDraft] = useState(initialName);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setDraft(name);
    setError(null);
    setIsEditing(true);
    requestAnimationFrame(() => inputRef.current?.select());
  };

  const cancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed === name) {
      setIsEditing(false);
      setError(null);
      return;
    }
    startTransition(async () => {
      const result = await renameSpace({ spaceId, name: trimmed });
      if (result?.error) {
        setError(result.error);
      } else {
        setName(trimmed);
        setIsEditing(false);
        setError(null);
      }
    });
  };

  if (isEditing) {
    return (
      <div className="flex flex-col items-center gap-1">
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              save();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancel();
            }
          }}
          disabled={isPending}
          maxLength={100}
          aria-label="Space name"
          aria-invalid={error ? true : undefined}
          className="rounded border border-neutral-300 bg-transparent px-2 py-0.5 text-center text-2xl font-medium tracking-wide focus:outline-none focus:ring-2 focus:ring-neutral-400 disabled:opacity-50"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="group relative inline-flex items-center">
      <h1
        onDoubleClick={startEditing}
        onClick={() => {
          if (window.matchMedia("(pointer: coarse)").matches) {
            startEditing();
          }
        }}
        title="Double-click to rename"
        className="cursor-pointer text-2xl font-medium tracking-wide transition-opacity group-hover:opacity-70"
      >
        {name}
      </h1>
      {/* Absolutely positioned so the icon hangs off the title instead of
          widening the centered box — otherwise the title+icon group gets
          centered as a unit and the title text sits off true center. */}
      <button
        type="button"
        onClick={startEditing}
        aria-label="Edit space name"
        className="absolute left-full ml-1.5 rounded p-1 text-neutral-400 opacity-0 transition-opacity hover:text-neutral-700 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 group-hover:opacity-100"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </button>
    </div>
  );
}
