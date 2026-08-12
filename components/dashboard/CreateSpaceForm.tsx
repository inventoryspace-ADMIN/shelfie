"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createSpaceSchema, type CreateSpaceInput } from "@/lib/validations/space";
import { createSpace, checkSlugAvailable } from "@/lib/actions/spaces";
import { slugify } from "@/lib/slug";
import { templateKeys, templates } from "@/lib/templates";

type SlugStatus = "idle" | "checking" | "available" | "taken";

export function CreateSpaceForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");
  const [slugEditedByHand, setSlugEditedByHand] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateSpaceInput>({
    resolver: zodResolver(createSpaceSchema),
    defaultValues: { template: templateKeys[0] },
  });

  const name = watch("name");
  const slug = watch("slug");

  // Auto-fill the slug from the name until the owner edits it directly.
  useEffect(() => {
    if (!slugEditedByHand) {
      setValue("slug", slugify(name || ""));
    }
  }, [name, slugEditedByHand, setValue]);

  useEffect(() => {
    if (!slug || errors.slug) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");
    const timeout = setTimeout(async () => {
      const available = await checkSlugAvailable(slug);
      setSlugStatus(available ? "available" : "taken");
    }, 400);

    return () => clearTimeout(timeout);
  }, [slug, errors.slug]);

  const onSubmit = async (data: CreateSpaceInput) => {
    setServerError(null);
    if (slugStatus === "taken") {
      setServerError("You already have a space with that URL.");
      return;
    }

    setIsSubmitting(true);
    const result = await createSpace(data);
    setIsSubmitting(false);

    if (result?.error) {
      setServerError(result.error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="name" className="text-sm font-medium">
          Space name
        </label>
        <input
          id="name"
          type="text"
          placeholder="My Wardrobe"
          {...register("name")}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        {errors.name && (
          <p className="text-xs text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="slug" className="text-sm font-medium">
          URL
        </label>
        <input
          id="slug"
          type="text"
          {...register("slug", {
            onChange: () => setSlugEditedByHand(true),
          })}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-neutral-500">
          shelfie.app/yourname/<span className="font-medium">{slug || "your-space"}</span>
        </p>
        {errors.slug && (
          <p className="text-xs text-red-600">{errors.slug.message}</p>
        )}
        {!errors.slug && slugStatus === "checking" && (
          <p className="text-xs text-neutral-500">Checking availability…</p>
        )}
        {!errors.slug && slugStatus === "taken" && (
          <p className="text-xs text-red-600">
            You already have a space with that URL.
          </p>
        )}
        {!errors.slug && slugStatus === "available" && (
          <p className="text-xs text-green-700">Available.</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Template</span>
        <div className="flex flex-col gap-2">
          {templateKeys.map((key) => (
            <label
              key={key}
              className="flex items-start gap-3 rounded border border-neutral-300 p-3 text-sm has-[:checked]:border-neutral-900"
            >
              <input
                type="radio"
                value={key}
                {...register("template")}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">
                  {templates[key].label}
                </span>
                <span className="block text-xs text-neutral-500">
                  {templates[key].description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Creating…" : "Create space"}
      </button>
    </form>
  );
}
