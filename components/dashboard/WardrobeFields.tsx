"use client";

import { useFormContext } from "react-hook-form";

const conditions = ["new", "like-new", "good", "worn"] as const;

export function WardrobeFields() {
  const { register } = useFormContext();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="attributes.brand" className="text-sm font-medium">
          Brand
        </label>
        <input
          id="attributes.brand"
          type="text"
          {...register("attributes.brand")}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="attributes.size" className="text-sm font-medium">
          Size
        </label>
        <input
          id="attributes.size"
          type="text"
          {...register("attributes.size")}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="attributes.whereBought"
          className="text-sm font-medium"
        >
          Where bought
        </label>
        <input
          id="attributes.whereBought"
          type="text"
          {...register("attributes.whereBought")}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="attributes.condition" className="text-sm font-medium">
          Condition
        </label>
        <select
          id="attributes.condition"
          {...register("attributes.condition")}
          className="rounded border border-neutral-300 px-3 py-2 text-sm"
          defaultValue=""
        >
          <option value="">—</option>
          {conditions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
