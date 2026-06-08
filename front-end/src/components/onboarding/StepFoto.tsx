"use client";

import { ChangeEvent, useRef } from "react";
import { IconCamera, IconImage } from "./icons";

type StepFotoProps = {
  initials: string;
  previewUrl: string | null;
  onFileSelected: (file: File | null) => void;
};

export function StepFoto({ initials, previewUrl, onFileSelected }: StepFotoProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    onFileSelected(file);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col items-center gap-5 pt-3">
      <div className="relative">
        <div
          className="bg-rose-gradient flex h-[180px] w-[180px] items-center justify-center overflow-hidden rounded-full shadow-[0_20px_40px_-12px_rgba(92,3,49,0.4)]"
          style={{
            border: "1px solid rgba(255, 255, 255, 0.4)",
          }}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Sua foto"
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              style={{
                fontFamily: "var(--font-cormorant)",
                fontWeight: 500,
                fontSize: "64px",
                color: "rgba(255, 255, 255, 0.92)",
                letterSpacing: "0.04em",
              }}
            >
              {initials || "?"}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          aria-label="Tirar foto"
          className="absolute right-1 bottom-1 flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
          style={{
            backgroundColor: "var(--wine-800)",
            color: "var(--cream-100)",
            border: "3px solid var(--cream-100)",
          }}
        >
          <IconCamera size={18} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 backdrop-blur transition-colors hover:bg-white/90"
          style={{
            border: "1px solid rgba(92, 3, 49, 0.08)",
            fontFamily: "var(--font-manrope)",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--wine-800)",
          }}
        >
          <IconCamera size={14} />
          Tirar foto
        </button>

        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 backdrop-blur transition-colors hover:bg-white/90"
          style={{
            border: "1px solid rgba(92, 3, 49, 0.08)",
            fontFamily: "var(--font-manrope)",
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--wine-800)",
          }}
        >
          <IconImage size={14} />
          Da galeria
        </button>
      </div>

      {previewUrl && (
        <button
          type="button"
          onClick={() => onFileSelected(null)}
          className="text-[11px] underline underline-offset-4 transition-opacity hover:opacity-70"
          style={{
            color: "var(--ink-500)",
            fontFamily: "var(--font-manrope)",
            fontWeight: 600,
          }}
        >
          Remover foto
        </button>
      )}

      <p
        className="mt-2 max-w-[280px] text-center"
        style={{
          fontFamily: "var(--font-manrope)",
          fontSize: "11px",
          color: "var(--ink-500)",
          lineHeight: 1.5,
        }}
      >
        Foto opcional — você pode pular agora e adicionar depois.
      </p>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
