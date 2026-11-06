'use client';

/* Upload an image for the tournament form (with preview, size help, and an  */
/* optional "use a link instead" for images already hosted elsewhere).      */

import { useRef, useState } from 'react';
import { Loader2, Upload, X, Link2, AlertCircle } from 'lucide-react';
import { IMAGE_SPECS, mb, type TournamentImageKind } from '@/lib/tournamentImages';
import { INPUT, LABEL, BTN_GHOST } from '@/components/admin/sponsors/shared';

export default function ImageUpload({ kind, value, onChange, label, dark = false }: {
  kind: TournamentImageKind; value: string; onChange: (url: string) => void; label?: string; dark?: boolean;
}) {
  const spec = IMAGE_SPECS[kind];
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [linkMode, setLinkMode] = useState(false);
  const [drag, setDrag] = useState(false);
  const accept = Object.keys(spec.types).join(',');

  async function upload(file: File) {
    setErr('');
    if (!spec.types[file.type]) { setErr(`Use ${Object.values(spec.types).map((x) => x.toUpperCase()).join(' or ')}.`); return; }
    if (file.size > spec.maxBytes) { setErr(`That file is ${(file.size / 1024 / 1024).toFixed(1)} MB. The limit is ${mb(spec.maxBytes)}.`); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('kind', kind);
      fd.append('file', file);
      const r = await fetch('/api/tournaments/upload', { method: 'POST', body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.url) setErr(j.error || 'Upload failed. Please try again.');
      else { onChange(j.url); setLinkMode(false); }
    } catch { setErr('Upload failed. Check your connection.'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  }

  const isLogo = kind === 'sponsor-logo';
  return (
    <div>
      <span className={LABEL}>{label || spec.label}</span>
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f); }}
        className={`flex flex-wrap items-center gap-4 rounded-lg border border-dashed p-3 transition ${drag ? 'border-[#0E7C7B] bg-[#F2FAFA]' : 'border-[#C9D6E2] bg-[#FAFCFD]'}`}
      >
        <div className={`flex flex-shrink-0 items-center justify-center overflow-hidden rounded-md border border-[#E3EAF1] ${dark || isLogo ? 'bg-[#032430]' : 'bg-white'} ${kind === 'banner' ? 'h-[72px] w-[128px]' : isLogo ? 'h-[72px] w-[150px]' : 'h-[88px] w-[88px]'}`}>
          {value
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={value} alt={`${spec.label} preview`} className={`h-full w-full ${isLogo ? 'object-contain p-2' : 'object-cover'}`} />
            : <Upload className={`h-5 w-5 ${dark || isLogo ? 'text-white/50' : 'text-[#B9C6D4]'}`} aria-hidden />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => input.current?.click()} disabled={busy} className={BTN_GHOST}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}{value ? 'Replace' : 'Upload image'}
            </button>
            {value && <button type="button" onClick={() => { onChange(''); setErr(''); }} className={`${BTN_GHOST} text-red-600 hover:bg-red-50`}><X className="h-4 w-4" />Remove</button>}
            {!linkMode && <button type="button" onClick={() => setLinkMode(true)} className="inline-flex items-center gap-1 px-1 text-[13px] font-semibold text-[#0E7C7B] hover:underline"><Link2 className="h-3.5 w-3.5" />Use a link instead</button>}
          </div>
          <p className="mt-1.5 text-xs text-[#6B7D93]">{busy ? 'Uploading…' : 'Drag an image here, or choose one.'}</p>
          <input ref={input} type="file" accept={accept} className="hidden" aria-label={`Upload ${spec.label.toLowerCase()}`} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
        </div>
      </div>
      {linkMode && (
        <input aria-label={`${spec.label} link`} className={`${INPUT} mt-2`} value={value} onChange={(e) => onChange(e.target.value.trim())} placeholder="https://…" />
      )}
      <p className="mt-1.5 text-xs leading-[18px] text-[#6B7D93]">{spec.help}</p>
      {err && <p className="mt-1 flex items-start gap-1.5 text-sm text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />{err}</p>}
    </div>
  );
}
