"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { publishSpace, unpublishSpace, checkSlugAvailable } from "@/lib/actions/spaces";

type SlugStatus = "idle" | "checking" | "available" | "taken";

// The URL matters most at the exact moment an owner is about to share it,
// so the very first publish opens a dialog showing the full URL with the
// slug editable right there — see docs/ROADMAP.md Phase 5. Every publish
// after that (an unpublish/republish cycle) skips the dialog entirely and
// just goes live, the same one click it always was: the URL is already
// established by then, so re-confirming it every time would be a nag, not
// a safeguard. The slug stays editable afterward too, in
// /dashboard/[spaceId]/settings — this dialog is an additional prominent
// moment to catch it, not the only place it lives.
export function PublishToggle({
  spaceId,
  status,
  slug,
  username,
  hasEverPublished,
  hasItems,
}: {
  spaceId: string;
  status: "draft" | "published";
  slug: string;
  username: string;
  hasEverPublished: boolean;
  hasItems: boolean;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [draftSlug, setDraftSlug] = useState(slug);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (!draftSlug || draftSlug === slug) {
      setSlugStatus("idle");
      return;
    }
    setSlugStatus("checking");
    const timeout = setTimeout(async () => {
      const available = await checkSlugAvailable(draftSlug, spaceId);
      setSlugStatus(available ? "available" : "taken");
    }, 400);
    return () => clearTimeout(timeout);
  }, [draftSlug, slug, spaceId]);

  const openDialog = () => {
    setDraftSlug(slug);
    setDialogError(null);
    setSlugStatus("idle");
    dialogRef.current?.showModal();
  };

  const handlePublishClick = async () => {
    setError(null);
    if (!hasItems) {
      setError("Add at least one item before publishing.");
      return;
    }
    if (!hasEverPublished) {
      openDialog();
      return;
    }
    setIsPending(true);
    const result = await publishSpace({ spaceId, slug });
    setIsPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const handleUnpublish = async () => {
    setIsPending(true);
    setError(null);
    const result = await unpublishSpace(spaceId);
    setIsPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    router.refresh();
  };

  const confirmPublish = async () => {
    if (slugStatus === "taken") {
      setDialogError("You already have a space with that URL.");
      return;
    }
    setIsPublishing(true);
    setDialogError(null);
    const result = await publishSpace({ spaceId, slug: draftSlug });
    setIsPublishing(false);
    if (result?.error) {
      setDialogError(result.error);
      return;
    }
    dialogRef.current?.close();
    router.refresh();
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={status === "published" ? handleUnpublish : handlePublishClick}
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
      {error && (
        <p className="max-w-[16rem] text-center text-xs text-red-600">
          {error}
        </p>
      )}

      <dialog
        ref={dialogRef}
        onCancel={(e) => {
          // The default cancel (Escape key) already closes the <dialog> —
          // this just stops that native close from also submitting.
          e.preventDefault();
          dialogRef.current?.close();
        }}
        className="w-[calc(100%-2rem)] max-w-sm rounded-lg border border-neutral-200 p-6 backdrop:bg-black/40"
      >
        <h2 className="text-lg font-medium">Publish this space</h2>
        <p className="mt-1 text-sm text-neutral-500">
          This is the link you&apos;ll share — worth getting right before it
          goes live.
        </p>

        <div className="mt-4 flex flex-col gap-1">
          <label htmlFor="publish-slug" className="text-sm font-medium">
            URL
          </label>
          <input
            id="publish-slug"
            type="text"
            value={draftSlug}
            onChange={(e) => setDraftSlug(e.target.value.toLowerCase())}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <p className="text-xs text-neutral-500">
            shelfie.app/{username}/
            <span className="font-medium">{draftSlug || "your-space"}</span>
          </p>
          {slugStatus === "checking" && (
            <p className="text-xs text-neutral-500">Checking availability…</p>
          )}
          {slugStatus === "taken" && (
            <p className="text-xs text-red-600">
              You already have a space with that URL.
            </p>
          )}
          {slugStatus === "available" && (
            <p className="text-xs text-green-700">Available.</p>
          )}
        </div>

        {dialogError && (
          <p className="mt-2 text-sm text-red-600">{dialogError}</p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            className="rounded border border-neutral-300 px-3 py-1.5 text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmPublish}
            disabled={isPublishing || slugStatus === "checking" || slugStatus === "taken"}
            className="rounded bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {isPublishing ? "Publishing…" : "Confirm & publish"}
          </button>
        </div>
      </dialog>
    </div>
  );
}
