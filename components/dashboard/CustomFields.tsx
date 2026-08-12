"use client";

import { useFieldArray, useFormContext } from "react-hook-form";

export function CustomFields() {
  const { register, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "attributes.fields",
  });

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-medium">Custom fields</span>
      {fields.map((field, index) => (
        <div key={field.id} className="flex gap-2">
          <input
            type="text"
            placeholder="Label (e.g. Mileage)"
            {...register(`attributes.fields.${index}.label`)}
            className="w-1/3 rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Value (e.g. 42,000)"
            {...register(`attributes.fields.${index}.value`)}
            className="flex-1 rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => remove(index)}
            className="rounded border border-neutral-300 px-2 text-sm"
            aria-label="Remove field"
          >
            ×
          </button>
        </div>
      ))}
      {fields.length < 10 && (
        <button
          type="button"
          onClick={() => append({ label: "", value: "" })}
          className="self-start rounded border border-neutral-300 px-3 py-1.5 text-xs font-medium"
        >
          + Add field
        </button>
      )}
    </div>
  );
}
