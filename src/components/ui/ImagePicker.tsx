'use client';

import { useRef } from 'react';
import { ImageIcon, Upload, X } from 'lucide-react';

/* Shared image picker with preview, used by the public submission forms
   (/events/submit, /clubs/submit). Validation lives in the parent. */

const labelClass = 'mb-1.5 block text-[14px] font-medium text-[#0D1B4C]';
const hintClass = 'mt-1.5 text-[13px] leading-[18px] text-[#6B7D93]';

export type Picked = { file: File; preview: string; width: number; height: number } | null;

export function loadImage(file: File): Promise<{ preview: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const preview = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ preview, width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => { URL.revokeObjectURL(preview); reject(new Error('unreadable')); };
    img.src = preview;
  });
}

export default function ImagePicker({
  id, label, hint, picked, error, aspect, onPick, onClear,
}: {
  id: string;
  label: string;
  hint: string;
  picked: Picked;
  error: string;
  aspect: string;
  onPick: (f: File | undefined) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className={labelClass}>{label}<span className="font-normal text-[#7A8BA3]"> (optional)</span></span>
      <div className={`relative ${aspect} w-full overflow-hidden rounded-md border-2 border-dashed ${error ? 'border-[#F04438]' : 'border-[#C9D6E2]'} bg-[#F7FAFC]`}>
        {picked ? (
          <>
            <img src={picked.preview} alt="" className="h-full w-full object-contain" />
            <button
              type="button"
              onClick={() => { onClear(); if (inputRef.current) inputRef.current.value = ''; }}
              aria-label={`Remove ${label.toLowerCase()}`}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-[#0D1B4C] shadow hover:bg-white"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <label htmlFor={id} className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 p-4 text-center text-[#5F6F86] hover:bg-[#EEF4F8]">
            {aspect === 'aspect-video' ? <ImageIcon className="h-7 w-7" strokeWidth={1.75} /> : <Upload className="h-6 w-6" strokeWidth={1.75} />}
            <span className="text-[14px] font-medium text-[#0E7C7B]">Choose file</span>
          </label>
        )}
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
      </div>
      {picked && <p className={hintClass}>{picked.file.name} · {picked.width} × {picked.height}</p>}
      {error ? <p role="alert" className="mt-1.5 text-[13px] text-[#B42318]">{error}</p> : <p className={hintClass}>{hint}</p>}
    </div>
  );
}
