"use client";

import { useRef, useState } from "react";
import {
  isBackgroundRemovalSupported,
  removeBackground,
} from "@/lib/images/removeBackground";

const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export function ImagePicker({
  label,
  helperText,
  value,
  onChange,
}: {
  label: string;
  helperText?: string;
  value: string | null;
  onChange: (dataUrl: string | null) => void;
}) {
  const [original, setOriginal] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [backgroundRemoved, setBackgroundRemoved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload a PNG, JPG, or WebP image.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("File size must be less than 10MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setOriginal(result);
      setBackgroundRemoved(false);
      onChange(result);
    };
    reader.onerror = () => setError("Error reading file. Please try again.");
    reader.readAsDataURL(file);
  };

  const handleRemoveBackground = async () => {
    if (!original || isProcessing) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await removeBackground(original);
      onChange(result);
      setBackgroundRemoved(true);
    } catch {
      setError("Background removal failed — using the original image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreOriginal = () => {
    if (!original) return;
    onChange(original);
    setBackgroundRemoved(false);
  };

  const handleClear = () => {
    setOriginal(null);
    setBackgroundRemoved(false);
    setError(null);
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium">{label}</span>
      {helperText && <p className="text-xs text-neutral-500">{helperText}</p>}

      <div className="flex items-start gap-3">
        <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-neutral-300 bg-[repeating-conic-gradient(#e5e5e5_0%_25%,white_0%_50%)] bg-[length:16px_16px]">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data: URL preview, not an optimizable remote image
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="text-xs text-neutral-400">No image</span>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleFileChange}
            className="text-xs"
          />

          {value && isBackgroundRemovalSupported() && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleRemoveBackground}
                disabled={isProcessing || !original}
                className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium disabled:opacity-50"
              >
                {isProcessing ? "Removing…" : "Remove background"}
              </button>
              {backgroundRemoved && (
                <button
                  type="button"
                  onClick={handleRestoreOriginal}
                  className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium"
                >
                  Restore original
                </button>
              )}
              <button
                type="button"
                onClick={handleClear}
                className="rounded border border-neutral-300 px-2 py-1 text-xs font-medium"
              >
                Clear
              </button>
            </div>
          )}

          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
