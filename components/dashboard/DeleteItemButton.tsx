"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteItem } from "@/lib/actions/items";

export function DeleteItemButton({
  itemId,
  spaceId,
  itemTitle,
}: {
  itemId: string;
  spaceId: string;
  itemTitle: string;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete "${itemTitle}"? This can't be undone.`)) return;

    setIsDeleting(true);
    const result = await deleteItem(itemId, spaceId);
    setIsDeleting(false);

    if (result?.error) {
      alert(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isDeleting}
      className="text-xs text-red-600 underline disabled:opacity-50"
    >
      {isDeleting ? "Deleting…" : "Delete"}
    </button>
  );
}
