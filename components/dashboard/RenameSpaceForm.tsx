"use client";

import { useState } from "react";
import { renameSpace } from "@/lib/actions/spaces";

export function RenameSpaceForm({
  spaceId,
  initialName,
}: {
  spaceId: string;
  initialName: string;
}) {
  const [name, setName] = useState(initialName);
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSaving(true);
    const result = await renameSpace({ spaceId, name });
    setIsSaving(false);

    if (result?.error) {
      setError(result.error);
    } else {
      setSavedAt(Date.now());
    }
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <label htmlFor="space-name" className="text-sm font-medium">
        Space name
      </label>
      <div className="flex gap-2">
        <input
          id="space-name"
          type="text"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSavedAt(null);
          }}
          className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={isSaving || name === initialName}
          className="rounded border border-neutral-300 px-3 py-2 text-sm font-medium disabled:opacity-50"
        >
          {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {savedAt && <p className="text-xs text-green-700">Saved.</p>}
    </form>
  );
}
