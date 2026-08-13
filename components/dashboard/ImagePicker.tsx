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
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = (file: File) => {
    setError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please use a PNG, JPG, or WebP image.");
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const imageItem = Array.from(e.clipboardData.items).find((item) =>
      item.type.startsWith("image/")
    );
    const file = imageItem?.getAsFile();
    if (!file) return;
    e.preventDefault();
    loadFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) loadFile(file);
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
      <p className="text-xs text-neutral-400">
        Click the preview, then paste an image (⌘V / Ctrl+V) — or drag one
        in.
      </p>

      <div className="flex items-start gap-3">
        <div
          tabIndex={0}
          onPaste={handlePaste}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          aria-label="Image preview — click, then paste or drop an image here"
          className={`flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded border bg-[repeating-conic-gradient(#e5e5e5_0%_25%,white_0%_50%)] bg-[length:16px_16px] focus:outline-none focus:ring-2 focus:ring-neutral-400 ${
            isDragOver ? "border-2 border-neutral-900" : "border-neutral-300"
          }`}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- local data: URL preview, not an optimizable remote image
            <img
              src={value}
              alt="Preview"
              className="h-full w-full object-contain"
            />
          ) : (
            <span className="px-1 text-center text-[10px] text-neutral-400">
              No image
            </span>
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
