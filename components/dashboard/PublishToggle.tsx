"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { setSpaceStatus } from "@/lib/actions/spaces";

export function PublishToggle({
  spaceId,
  status,
}: {
  spaceId: string;
  status: "draft" | "published";
}) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleToggle = async () => {
    setIsPending(true);
    setError(null);
    const nextStatus = status === "published" ? "draft" : "published";
    const result = await setSpaceStatus(spaceId, nextStatus);
    setIsPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        className={`rounded px-3 py-1.5 text-sm font-medium disabled:opacity-50 ${
          status === "published"
            ? "border border-neutral-300"
            : "bg-neutral-900 text-white"
        }`}
      >
        {isPending
          ? "Saving…"
          : status === "published"
            ? "Unpublish"
            : "Publish"}
      </button>
      {error && <p className="max-w-[16rem] text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}
