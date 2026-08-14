"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateSpaceSettingsSchema,
  type UpdateSpaceSettingsInput,
} from "@/lib/validations/space";
import { updateSpaceSettings, checkSlugAvailable } from "@/lib/actions/spaces";
import { CURRENCIES } from "@/lib/currencies";

type SlugStatus = "idle" | "checking" | "available" | "taken";

export function SpaceSettingsForm({
  spaceId,
  username,
  initialSlug,
  initialValueDisplayMode,
  initialValueCurrency,
}: {
  spaceId: string;
  username: string;
  initialSlug: string;
  initialValueDisplayMode: "hidden" | "currency" | "number";
  initialValueCurrency: string | null;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugStatus, setSlugStatus] = useState<SlugStatus>("idle");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UpdateSpaceSettingsInput>({
    resolver: zodResolver(updateSpaceSettingsSchema),
    defaultValues: {
      spaceId,
      slug: initialSlug,
      valueDisplayMode: initialValueDisplayMode,
      valueCurrency: initialValueCurrency,
    },
  });

  const slug = watch("slug");
  const valueDisplayMode = watch("valueDisplayMode");

  useEffect(() => {
    if (!slug || slug === initialSlug || errors.slug) {
      setSlugStatus("idle");
      return;
    }

    setSlugStatus("checking");
    const timeout = setTimeout(async () => {
      const available = await checkSlugAvailable(slug, spaceId);
      setSlugStatus(available ? "available" : "taken");
    }, 400);

    return () => clearTimeout(timeout);
  }, [slug, errors.slug, initialSlug, spaceId]);

  const onSubmit = async (data: UpdateSpaceSettingsInput) => {
    setServerError(null);
    setSavedMessage(null);
    if (slugStatus === "taken") {
      setServerError("You already have a space with that URL.");
      return;
    }

    setIsSubmitting(true);
    const result = await updateSpaceSettings(data);
    setIsSubmitting(false);

    if (result?.error) {
      setServerError(result.error);
      return;
    }

    setSavedMessage("Saved.");
    if (data.slug !== initialSlug) {
      router.push(`/dashboard/${spaceId}/settings`);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <label htmlFor="slug" className="text-sm font-medium">
          URL
        </label>
        <input
          id="slug"
          type="text"
          {...register("slug")}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-neutral-500">
          shelfie.app/{username}/<span className="font-medium">{slug || "your-space"}</span>
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
        {slug !== initialSlug && (
          <p className="text-xs text-neutral-500">
            Changing this breaks the old link — anyone using it will see a
            page not found.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Show item value as</span>
        <div className="flex flex-col gap-2">
          {(
            [
              { value: "hidden", label: "Nothing", hint: "Values stay private" },
              { value: "currency", label: "A price", hint: "e.g. $120" },
              { value: "number", label: "A plain number", hint: "e.g. Qty: 3" },
            ] as const
          ).map((option) => (
            <label
              key={option.value}
              className="flex items-start gap-3 rounded border border-neutral-300 p-3 text-sm has-[:checked]:border-neutral-900"
            >
              <input
                type="radio"
                value={option.value}
                {...register("valueDisplayMode")}
                className="mt-1"
              />
              <span>
                <span className="block font-medium">{option.label}</span>
                <span className="block text-xs text-neutral-500">
                  {option.hint}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {valueDisplayMode === "currency" && (
        <div className="flex flex-col gap-1">
          <label htmlFor="valueCurrency" className="text-sm font-medium">
            Currency
          </label>
          <select
            id="valueCurrency"
            {...register("valueCurrency")}
            defaultValue={initialValueCurrency ?? ""}
            className="rounded border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="" disabled>
              Choose a currency
            </option>
            {Object.entries(CURRENCIES).map(([code, label]) => (
              <option key={code} value={code}>
                {code} — {label}
              </option>
            ))}
          </select>
          {errors.valueCurrency && (
            <p className="text-xs text-red-600">
              {errors.valueCurrency.message}
            </p>
          )}
        </div>
      )}

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}
      {savedMessage && !serverError && (
        <p className="text-sm text-green-700">{savedMessage}</p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {isSubmitting ? "Saving…" : "Save settings"}
      </button>
    </form>
  );
}
