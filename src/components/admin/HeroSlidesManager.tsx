'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Plus, Image as ImageIcon, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, X, Upload, Link2,
  ExternalLink, ArrowRight, Loader2, AlertCircle,
} from 'lucide-react';
import type { HeroSlide, HeroButtonPosition } from '@/types';
import { Toast, useToast } from '@/components/ui/Toast';

/* ------------------------------------------------------------------ */
/* Admin → Advertising → Hero Carousel                                 */
/* Manages the slides shown in the home page hero carousel. All calls  */
/* go to /api/admin/hero-slides/** which re-check the admin session.   */
/* ------------------------------------------------------------------ */

const RECOMMENDED = '1920 × 1080 px (16:9)';

interface FormState {
  title: string;
  imageUrl: string;
  buttonLabel: string;
  buttonUrl: string;
  openInNewTab: boolean;
  buttonPosition: HeroButtonPosition;
  isActive: boolean;
}

const EMPTY_FORM: FormState = {
  title: '',
  imageUrl: '',
  buttonLabel: '',
  buttonUrl: '',
  openInNewTab: true,
  buttonPosition: 'bottom-left',
  isActive: true,
};

const POSITIONS: { value: HeroButtonPosition; label: string }[] = [
  { value: 'bottom-left', label: 'Left' },
  { value: 'bottom-center', label: 'Center' },
  { value: 'bottom-right', label: 'Right' },
];

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  let json: Record<string, unknown> = {};
  try {
    json = await res.json();
  } catch {
    /* ignore */
  }
  if (!res.ok || json.error) {
    const msg = typeof json.error === 'string' ? json.error : `Request failed (${res.status})`;
    throw new Error(res.status === 403 ? 'Your admin session has expired. Please log in again.' : msg);
  }
  return json as T;
}

/* --------------------------- preview tile --------------------------- */

function SlidePreview({ form }: { form: FormState }) {
  const pos =
    form.buttonPosition === 'bottom-center' ? 'left-1/2 -translate-x-1/2' :
    form.buttonPosition === 'bottom-right' ? 'right-4' : 'left-4';
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-[#00263B]">
      {form.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={form.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 text-sm">
          <ImageIcon className="mb-2 h-8 w-8" />
          Image preview
        </div>
      )}
      {form.buttonLabel && (
        <span
          className={`absolute bottom-5 ${pos} inline-flex items-center gap-2 rounded-md bg-gradient-to-b from-[#F7AE2C] to-[#EE9A1A] px-3 h-8 text-[13px] font-semibold text-[#11173A] shadow`}
        >
          {form.buttonLabel} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </div>
  );
}

/* ------------------------------ editor ------------------------------ */

function SlideEditor({
  initial,
  editingId,
  onClose,
  onSaved,
}: {
  initial: FormState;
  editingId: string | null;
  onClose: () => void;
  onSaved: (msg: string) => void;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const upload = async (file: File) => {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5 MB or smaller.');
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { url } = await api<{ url: string }>('/api/admin/hero-slides/upload', { method: 'POST', body });
      set('imageUrl', url);
      if (!form.title) set('title', file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setError(null);
    if (!form.title.trim()) return setError('Add a title.');
    if (!form.imageUrl.trim()) return setError('Upload an image or paste an image URL.');
    if (!!form.buttonLabel.trim() !== !!form.buttonUrl.trim()) {
      return setError('Add both a button label and a button link, or leave both empty.');
    }
    setSaving(true);
    try {
      await api(editingId ? `/api/admin/hero-slides/${editingId}` : '/api/admin/hero-slides', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onSaved(editingId ? 'Hero slide updated' : 'Hero slide added');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="hero-editor-title">
      <div className="w-full max-w-3xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 id="hero-editor-title" className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Hero Slide' : 'Add Hero Slide'}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-6 px-6 py-5 md:grid-cols-[1.1fr_1fr]">
          {/* Left: image + preview */}
          <div className="space-y-3">
            <SlidePreview form={form} />
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) upload(f);
              }}
              className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload(f);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-3.5 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-60"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? 'Uploading…' : form.imageUrl ? 'Replace image' : 'Upload image'}
              </button>
              <p className="mt-2 text-xs text-gray-500">or drag an image here · {RECOMMENDED} · JPG, PNG, WebP · max 5 MB</p>
            </div>
            <label className="block">
              <span className="mb-1 flex items-center gap-1.5 text-xs font-medium text-gray-600"><Link2 className="h-3.5 w-3.5" /> Or paste an image URL</span>
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => set('imageUrl', e.target.value)}
                placeholder="https://…"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </label>
          </div>

          {/* Right: fields */}
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Title <span className="text-red-500">*</span></span>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={120}
                placeholder="e.g. TidalGear — Spring Campaign"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="mt-1 block text-xs text-gray-500">Used in the admin list and as the image description for screen readers.</span>
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1.4fr]">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Button label</span>
                <input
                  value={form.buttonLabel}
                  onChange={(e) => set('buttonLabel', e.target.value)}
                  maxLength={40}
                  placeholder="Visit sponsor"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-gray-700">Button link</span>
                <input
                  value={form.buttonUrl}
                  onChange={(e) => set('buttonUrl', e.target.value)}
                  placeholder="https://sponsor.com or /tournaments"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </label>
            </div>
            <p className="-mt-2 text-xs text-gray-500">Leave both empty for an image-only slide.</p>

            <div>
              <span className="mb-1 block text-sm font-medium text-gray-700">Button position</span>
              <div className="inline-flex overflow-hidden rounded-lg border border-gray-300" role="radiogroup" aria-label="Button position">
                {POSITIONS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    role="radio"
                    aria-checked={form.buttonPosition === p.value}
                    onClick={() => set('buttonPosition', p.value)}
                    className={`px-4 py-1.5 text-sm transition ${form.buttonPosition === p.value ? 'bg-gray-900 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.openInNewTab} onChange={(e) => set('openInNewTab', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              Open link in a new tab
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              Show on the home page
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={save}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingId ? 'Save changes' : 'Add slide'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ manager ----------------------------- */

export default function HeroSlidesManager() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ id: string | null; form: FormState } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { toasts, remove, success, error } = useToast();

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { slides } = await api<{ slides: HeroSlide[] }>('/api/admin/hero-slides');
      setSlides(slides);
    } catch (e) {
      const msg = (e as Error).message;
      setLoadError(
        /hero_slides|relation|schema cache/i.test(msg)
          ? 'The hero carousel table hasn’t been created yet. Run supabase/migration_2026_10_hero_slides.sql in the Supabase SQL Editor, then reload.'
          : msg,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = async (id: string, body: Record<string, unknown>) =>
    api(`/api/admin/hero-slides/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const toggleActive = async (s: HeroSlide) => {
    setBusy(true);
    try {
      await patch(s.id, { isActive: !s.isActive });
      success(s.isActive ? 'Slide hidden from the home page' : 'Slide is now live on the home page');
      await load();
    } catch (e) {
      error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const move = async (from: number, to: number) => {
    if (to < 0 || to >= slides.length) return;
    const next = [...slides];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setSlides(next);
    setBusy(true);
    try {
      await Promise.all(next.map((s, i) => (s.sortOrder !== i ? patch(s.id, { sortOrder: i }) : null)));
      await load();
    } catch (e) {
      error((e as Error).message);
      await load();
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async (id: string) => {
    setBusy(true);
    try {
      await api(`/api/admin/hero-slides/${id}`, { method: 'DELETE' });
      success('Hero slide deleted');
      setConfirmDelete(null);
      await load();
    } catch (e) {
      error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const activeCount = slides.filter((s) => s.isActive).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-gray-900">Hero Carousel</h3>
          <p className="text-gray-500 text-sm">
            Slides rotate in the large hero on the home page. Recommended image size {RECOMMENDED}; keep important artwork away from the bottom edge where the button sits.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href="/" target="_blank" rel="noopener" className="flex items-center gap-1.5 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
            <ExternalLink className="w-3.5 h-3.5" /> View home page
          </a>
          <button
            onClick={() => setEditor({ id: null, form: EMPTY_FORM })}
            disabled={!!loadError}
            className="flex items-center gap-2 px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> Add Hero Slide
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-sm"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading slides…</div>
      ) : loadError ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {loadError}
        </div>
      ) : slides.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 text-center text-gray-400">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No hero slides yet. The home page shows the built-in TidalGear sponsor hero until you add one.</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-gray-500">
            {activeCount} of {slides.length} slide{slides.length === 1 ? '' : 's'} showing on the home page
            {activeCount === 0 && ' — the built-in TidalGear hero is shown instead'}
          </p>
          <ol className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {slides.map((s, i) => (
              <li key={s.id} className={`flex flex-col gap-3 p-3 sm:flex-row sm:items-center ${s.isActive ? '' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-5 text-center text-xs font-semibold text-gray-400">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={s.imageUrl} alt="" className={`h-[61px] w-[120px] flex-shrink-0 rounded-md object-cover border border-gray-200 ${s.isActive ? '' : 'opacity-50'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 truncate">{s.title}</span>
                      {s.isActive
                        ? <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Live</span>
                        : <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Hidden</span>}
                    </div>
                    {s.buttonLabel && s.buttonUrl ? (
                      <div className="mt-0.5 text-xs text-gray-500 truncate">
                        Button: <span className="text-gray-700">“{s.buttonLabel}”</span> →{' '}
                        <a href={s.buttonUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{s.buttonUrl}</a>
                        <span className="text-gray-400"> · {s.buttonPosition.replace('bottom-', '')}{s.openInNewTab ? ' · new tab' : ''}</span>
                      </div>
                    ) : (
                      <div className="mt-0.5 text-xs text-gray-400">Image only (no button)</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 pl-8 sm:pl-0">
                  <button onClick={() => move(i, i - 1)} disabled={busy || i === 0} aria-label="Move up" className="p-1.5 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => move(i, i + 1)} disabled={busy || i === slides.length - 1} aria-label="Move down" className="p-1.5 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button
                    onClick={() => setEditor({
                      id: s.id,
                      form: {
                        title: s.title, imageUrl: s.imageUrl, buttonLabel: s.buttonLabel || '', buttonUrl: s.buttonUrl || '',
                        openInNewTab: s.openInNewTab, buttonPosition: s.buttonPosition, isActive: s.isActive,
                      },
                    })}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-gray-600 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => toggleActive(s)}
                    disabled={busy}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs border rounded-lg transition disabled:opacity-50 ${s.isActive ? 'text-gray-600 border-gray-200 hover:bg-gray-50' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
                  >
                    {s.isActive ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Show</>}
                  </button>
                  {confirmDelete === s.id ? (
                    <span className="flex items-center gap-1">
                      <button onClick={() => doDelete(s.id)} disabled={busy} className="px-2.5 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50">Delete</button>
                      <button onClick={() => setConfirmDelete(null)} className="px-2 py-1.5 text-gray-500 text-xs rounded-lg hover:bg-gray-100">Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDelete(s.id)} aria-label={`Delete ${s.title}`} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {editor && (
        <SlideEditor
          initial={editor.form}
          editingId={editor.id}
          onClose={() => setEditor(null)}
          onSaved={async (msg) => {
            setEditor(null);
            success(msg);
            await load();
          }}
        />
      )}

      <Toast toasts={toasts} onRemove={remove} />
    </div>
  );
}
