"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { itemBaseSchema } from "@/lib/validations/item";
import { templates, type TemplateKey } from "@/lib/templates";
import { createItem, updateItem } from "@/lib/actions/items";
import { uploadItemImage } from "@/lib/images/uploadItemImage";
import { ImagePicker } from "./ImagePicker";
import { WardrobeFields } from "./WardrobeFields";
import { CustomFields } from "./CustomFields";

const formFieldsSchema = itemBaseSchema.omit({
  spaceId: true,
  primaryImagePath: true,
  hoverImagePath: true,
});

interface ExistingItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  value: number | null;
  outboundUrl: string | null;
  primaryImagePath: string;
  hoverImagePath: string | null;
  primaryImageUrl: string;
  hoverImageUrl: string | null;
  attributes: unknown;
}

async function resolveImagePath(
  currentValue: string | null,
  existingPath: string | null,
  params: {
    ownerId: string;
    spaceId: string;
    itemId: string;
    slot: "primary" | "hover";
  }
): Promise<string | null> {
  if (!currentValue) return null;
  if (currentValue.startsWith("data:")) {
    return uploadItemImage({ ...params, dataUrl: currentValue });
  }
  return existingPath;
}

export function ItemForm({
  spaceId,
  ownerId,
  template,
  existingItem,
}: {
  spaceId: string;
  ownerId: string;
  template: TemplateKey;
  existingItem?: ExistingItem;
}) {
  const router = useRouter();
  const itemId = useMemo(
    () => existingItem?.id ?? crypto.randomUUID(),
    [existingItem?.id]
  );

  const [primaryImage, setPrimaryImage] = useState<string | null>(
    existingItem?.primaryImageUrl ?? null
  );
  const [hoverImage, setHoverImage] = useState<string | null>(
    existingItem?.hoverImageUrl ?? null
  );
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Collapsed by default for a quick add — expanded automatically when
  // editing an item that already has any of this filled in, so nothing
  // already entered is hidden from the owner.
  const [showDetails, setShowDetails] = useState(
    Boolean(
      existingItem &&
        (existingItem.description ||
          existingItem.outboundUrl ||
          existingItem.hoverImageUrl ||
          (existingItem.attributes &&
            Object.values(existingItem.attributes as Record<string, unknown>).some(
              (v) => (Array.isArray(v) ? v.length > 0 : Boolean(v))
            )))
    )
  );

  const resolver = zodResolver(
    formFieldsSchema.extend({ attributes: templates[template].attributesSchema })
  );

  const methods = useForm({
    resolver,
    defaultValues: {
      title: existingItem?.title ?? "",
      description: existingItem?.description ?? "",
      category: existingItem?.category ?? "",
      value: existingItem?.value ?? undefined,
      outboundUrl: existingItem?.outboundUrl ?? "",
      attributes:
        (existingItem?.attributes as Record<string, unknown>) ??
        (template === "custom" ? { fields: [] } : {}),
    },
  });

  const onSubmit = methods.handleSubmit(async (data) => {
    setServerError(null);

    if (!primaryImage) {
      setServerError("Add a photo before saving.");
      return;
    }

    setIsSubmitting(true);
    try {
      const [primaryImagePath, hoverImagePath] = await Promise.all([
        resolveImagePath(
          primaryImage,
          existingItem?.primaryImagePath ?? null,
          { ownerId, spaceId, itemId, slot: "primary" }
        ),
        resolveImagePath(hoverImage, existingItem?.hoverImagePath ?? null, {
          ownerId,
          spaceId,
          itemId,
          slot: "hover",
        }),
      ]);

      const { attributes, ...base } = data;
      const basePayload = {
        spaceId,
        ...base,
        primaryImagePath: primaryImagePath!,
        hoverImagePath: hoverImagePath ?? "",
      };

      const result = existingItem
        ? await updateItem({ ...basePayload, itemId }, attributes)
        : await createItem(basePayload, itemId, attributes);

      if (result?.error) {
        setServerError(result.error);
        setIsSubmitting(false);
      }
      // On success the action redirects, so no need to reset isSubmitting.
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Something went wrong."
      );
      setIsSubmitting(false);
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={onSubmit} className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <label htmlFor="title" className="text-sm font-medium">
            Title
          </label>
          <input
            id="title"
            type="text"
            {...methods.register("title")}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          {methods.formState.errors.title && (
            <p className="text-xs text-red-600">
              {methods.formState.errors.title.message}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="category" className="text-sm font-medium">
            Category
          </label>
          <input
            id="category"
            type="text"
            placeholder="e.g. Tops, Footwear"
            {...methods.register("category")}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="value" className="text-sm font-medium">
            Price (optional)
          </label>
          <input
            id="value"
            type="number"
            step="0.01"
            min="0"
            {...methods.register("value", {
              setValueAs: (v) => (v === "" ? undefined : Number(v)),
            })}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          />
        </div>

        <ImagePicker
          label="Primary photo"
          value={primaryImage}
          onChange={setPrimaryImage}
        />

        <button
          type="button"
          onClick={() => setShowDetails((v) => !v)}
          className="self-start text-sm font-medium underline"
        >
          {showDetails ? "− Hide extra details" : "+ Add more details"}
        </button>

        {showDetails && (
          <div className="flex flex-col gap-6 rounded border border-neutral-200 p-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                {...methods.register("description")}
                className="rounded border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="outboundUrl" className="text-sm font-medium">
                Outbound link (optional)
              </label>
              <input
                id="outboundUrl"
                type="url"
                placeholder="https://..."
                {...methods.register("outboundUrl")}
                className="rounded border border-neutral-300 px-3 py-2 text-sm"
              />
              {methods.formState.errors.outboundUrl && (
                <p className="text-xs text-red-600">
                  {methods.formState.errors.outboundUrl.message}
                </p>
              )}
            </div>

            <ImagePicker
              label="Hover photo (optional)"
              helperText="Shown on ~500ms hover as a second angle."
              value={hoverImage}
              onChange={setHoverImage}
            />

            {template === "wardrobe" && <WardrobeFields />}
            {template === "custom" && <CustomFields />}
          </div>
        )}

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {isSubmitting ? "Saving…" : existingItem ? "Save changes" : "Add item"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="rounded border border-neutral-300 px-4 py-2 text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
