'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Plus, Image as ImageIcon, Pencil, Trash2, Eye, EyeOff, ArrowUp, ArrowDown, X, Upload, Link2,
  ExternalLink, Loader2, AlertCircle,
} from 'lucide-react';
import type { HomeBanner } from '@/types';
import { Toast, useToast } from '@/components/ui/Toast';
import { BANNER_PLACEHOLDER_IMAGE } from '@/lib/supabase';

/* ------------------------------------------------------------------ */
/* Admin → Advertising → Home Page Banners ("We recommend")            */
/* All calls go to /api/admin/home-banners/** which re-check the       */
/* admin session server-side.                                          */
/* ------------------------------------------------------------------ */

const RECOMMENDED = '600 × 240 px (5:2)';

interface FormState {
  title: string;
  imageUrl: string;
  linkUrl: string;
  openInNewTab: boolean;
  isActive: boolean;
}

const EMPTY_FORM: FormState = { title: '', imageUrl: '', linkUrl: '', openInNewTab: true, isActive: true };

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

/* ------------------------------ editor ------------------------------ */

function BannerEditor({
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
    if (file.size > 2 * 1024 * 1024) {
      setError('Banner must be 2 MB or smaller.');
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const { url } = await api<{ url: string }>('/api/admin/home-banners/upload', { method: 'POST', body });
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
    if (!form.title.trim()) return setError('Add the advertiser name.');
    if (!form.linkUrl.trim()) return setError('Add the click-through link for this banner.');
    setSaving(true);
    try {
      await api(editingId ? `/api/admin/home-banners/${editingId}` : '/api/admin/home-banners', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      onSaved(editingId ? 'Banner updated' : 'Banner added');
    } catch (e) {
      setError((e as Error).message);
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8" role="dialog" aria-modal="true" aria-labelledby="banner-editor-title">
      <div className="w-full max-w-2xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 id="banner-editor-title" className="text-lg font-semibold text-gray-900">{editingId ? 'Edit Banner' : 'Add Banner'}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          {/* Preview at the size it appears on the home page */}
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
            <div className="aspect-[5/2] w-full max-w-[260px] overflow-hidden rounded-md border border-gray-200 bg-[#F7F9FB]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.imageUrl || BANNER_PLACEHOLDER_IMAGE} alt="" onError={(ev) => { if (!ev.currentTarget.src.endsWith(BANNER_PLACEHOLDER_IMAGE)) ev.currentTarget.src = BANNER_PLACEHOLDER_IMAGE; }} className="h-full w-full object-contain" />
            </div>
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const f = e.dataTransfer.files?.[0];
                if (f) upload(f);
              }}
              className="flex-1 w-full rounded-lg border-2 border-dashed border-gray-200 p-4 text-center"
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
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
                {uploading ? 'Uploading…' : form.imageUrl ? 'Replace image' : 'Upload banner'}
              </button>
              <p className="mt-2 text-xs text-gray-500">or drag an image here · {RECOMMENDED} · JPG, PNG, WebP, GIF · max 2 MB</p>
              <p className="mt-1 text-xs text-gray-500">Optional — without an image, the “Advertise with us!” placeholder is shown.</p>
              {form.imageUrl && (
                <button type="button" onClick={() => set('imageUrl', '')} className="mt-2 text-xs font-medium text-red-600 hover:underline">
                  Remove image (use placeholder)
                </button>
              )}
            </div>
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Advertiser name <span className="text-red-500">*</span></span>
              <input
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                maxLength={120}
                placeholder="e.g. Eco Fishing Shop"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="mt-1 block text-xs text-gray-500">Also used as the image description for screen readers.</span>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Click-through link <span className="text-red-500">*</span></span>
              <input
                value={form.linkUrl}
                onChange={(e) => set('linkUrl', e.target.value)}
                placeholder="https://advertiser.com"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="mt-1 block text-xs text-gray-500">Opens in a new browser tab.</span>
            </label>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} className="h-4 w-4 rounded border-gray-300" />
              Show on the home page
            </label>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
          <button
            onClick={save}
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {editingId ? 'Save changes' : 'Add banner'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ manager ----------------------------- */

export default function HomeBannersManager() {
  const [banners, setBanners] = useState<HomeBanner[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [editor, setEditor] = useState<{ id: string | null; form: FormState } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { toasts, remove, success, error } = useToast();

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const { banners } = await api<{ banners: HomeBanner[] }>('/api/admin/home-banners');
      setBanners(banners);
    } catch (e) {
      const msg = (e as Error).message;
      setLoadError(
        /home_banners|relation|schema cache/i.test(msg)
          ? 'The banners table hasn’t been created yet. Run supabase/migration_2026_10_home_banners.sql in the Supabase SQL Editor, then reload.'
          : msg,
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const patch = (id: string, body: Record<string, unknown>) =>
    api(`/api/admin/home-banners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  const toggleActive = async (b: HomeBanner) => {
    setBusy(true);
    try {
      await patch(b.id, { isActive: !b.isActive });
      success(b.isActive ? 'Banner hidden from the home page' : 'Banner is now live on the home page');
      await load();
    } catch (e) {
      error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const move = async (from: number, to: number) => {
    if (to < 0 || to >= banners.length) return;
    const next = [...banners];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setBanners(next);
    setBusy(true);
    try {
      await Promise.all(next.map((b, i) => (b.sortOrder !== i ? patch(b.id, { sortOrder: i }) : null)));
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
      await api(`/api/admin/home-banners/${id}`, { method: 'DELETE' });
      success('Banner deleted');
      setConfirmDelete(null);
      await load();
    } catch (e) {
      error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const activeCount = banners.filter((b) => b.isActive).length;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="font-semibold text-gray-900">Home Page Banners — “We recommend”</h3>
          <p className="text-gray-500 text-sm">
            Sponsor banners shown in a single row above Upcoming Tournaments (up to 6; the first 6 live banners in this order are used). Recommended size {RECOMMENDED}. The section is hidden when no banners are showing.
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
            <Plus className="w-3.5 h-3.5" /> Add Banner
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400 text-sm"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />Loading banners…</div>
      ) : loadError ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {loadError}
        </div>
      ) : banners.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-xl py-12 text-center text-gray-400">
          <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No banners yet. Add one to show the “We recommend” section on the home page.</p>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-gray-500">
            {activeCount} of {banners.length} banner{banners.length === 1 ? '' : 's'} showing on the home page
            {activeCount > 6 && ` · only the first 6 live banners are shown — hide or reorder to choose which`}
            {activeCount > 0 && activeCount < 6 && ` · add ${6 - activeCount} more to fill the row`}
          </p>
          <ol className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {banners.map((b, i) => (
              <li key={b.id} className={`flex flex-col gap-3 p-3 sm:flex-row sm:items-center ${b.isActive ? '' : 'bg-gray-50'}`}>
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="w-5 text-center text-xs font-semibold text-gray-400">{i + 1}</span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={b.imageUrl || BANNER_PLACEHOLDER_IMAGE} alt="" onError={(ev) => { if (!ev.currentTarget.src.endsWith(BANNER_PLACEHOLDER_IMAGE)) ev.currentTarget.src = BANNER_PLACEHOLDER_IMAGE; }} className={`h-[48px] w-[120px] flex-shrink-0 rounded-md object-contain bg-[#F7F9FB] border border-gray-200 ${b.isActive ? '' : 'opacity-50'}`} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900 truncate">{b.title}</span>
                      {b.isActive
                        ? <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Live</span>
                        : <span className="px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Hidden</span>}
                    </div>
                    {b.linkUrl ? (
                      <div className="mt-0.5 text-xs text-gray-500 truncate">
                        Links to{' '}
                        <a href={b.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{b.linkUrl}</a>
                        <span className="text-gray-400"> · new tab</span>
                      </div>
                    ) : (
                      <div className="mt-0.5 text-xs text-amber-600">No link yet — edit to add one</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 pl-8 sm:pl-0">
                  <button onClick={() => move(i, i - 1)} disabled={busy || i === 0} aria-label="Move up" className="p-1.5 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => move(i, i + 1)} disabled={busy || i === banners.length - 1} aria-label="Move down" className="p-1.5 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button
                    onClick={() => setEditor({
                      id: b.id,
                      form: { title: b.title, imageUrl: b.imageUrl || '', linkUrl: b.linkUrl || '', openInNewTab: true, isActive: b.isActive },
                    })}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-gray-600 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  <button
                    onClick={() => toggleActive(b)}
                    disabled={busy}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-xs border rounded-lg transition disabled:opacity-50 ${b.isActive ? 'text-gray-600 border-gray-200 hover:bg-gray-50' : 'text-green-700 border-green-200 hover:bg-green-50'}`}
                  >
                    {b.isActive ? <><EyeOff className="w-3 h-3" /> Hide</> : <><Eye className="w-3 h-3" /> Show</>}
                  </button>
                  {confirmDelete === b.id ? (
                    <span className="flex items-center gap-1">
                      <button onClick={() => doDelete(b.id)} disabled={busy} className="px-2.5 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-700 disabled:opacity-50">Delete</button>
                      <button onClick={() => setConfirmDelete(null)} className="px-2 py-1.5 text-gray-500 text-xs rounded-lg hover:bg-gray-100">Cancel</button>
                    </span>
                  ) : (
                    <button onClick={() => setConfirmDelete(b.id)} aria-label={`Delete ${b.title}`} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </>
      )}

      {editor && (
        <BannerEditor
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
