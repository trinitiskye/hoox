'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Fish, Plus, Search, Pencil, Trash2, Eye, EyeOff, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Toast, useToast } from '@/components/ui/Toast';
import {
  CATEGORY_LABEL, SPECIES_CATEGORIES, SPECIES_NAME_MAX, sortSpecies,
  type DbFishSpecies, type SpeciesCategory,
} from '@/lib/species';

/* ------------------------------------------------------------------ */
/* Admin → Tournaments → Fish Species                                  */
/* Master list behind the Species filters on /tournaments and /search. */
/* All calls go to /api/admin/species/** (admin session required).     */
/* ------------------------------------------------------------------ */

const input = 'h-[38px] w-full rounded-lg border border-[#D3DEE8] bg-white px-3 text-sm text-[#1F2D3D] focus:outline-none focus:ring-2 focus:ring-[#22B3B5]';
const CAT_CHIP: Record<SpeciesCategory, string> = {
  freshwater: 'bg-[#E6F4F5] text-[#0B6564]',
  saltwater: 'bg-[#E6F0FB] text-[#1048A5]',
  both: 'bg-[#F1EAFA] text-[#59338A]',
};
type Filter = 'all' | SpeciesCategory | 'hidden';

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  let json: Record<string, unknown> = {};
  try { json = await res.json(); } catch { /* ignore */ }
  if (!res.ok || json.error) {
    const msg = typeof json.error === 'string' ? json.error : `Request failed (${res.status})`;
    throw new Error(res.status === 403 ? 'Your admin session has expired. Please log in again.' : msg);
  }
  return json as T;
}

/** `usage` maps species name → number of tournaments using it (from the dashboard's tournament list) */
export default function SpeciesManager({ usage = {} }: { usage?: Record<string, number> }) {
  const [items, setItems] = useState<DbFishSpecies[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [newName, setNewName] = useState('');
  const [newCat, setNewCat] = useState<SpeciesCategory>('freshwater');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<DbFishSpecies | null>(null);
  const { toasts, remove, success, error: toastError } = useToast();
  const editRef = useRef<HTMLInputElement>(null);
  // Renames made here: new name → name the dashboard's usage counts know it by
  const [aliases, setAliases] = useState<Record<string, string>>({});
  const usedBy = (name: string) => usage[name] || (aliases[name] ? usage[aliases[name]] || 0 : 0);

  const load = useCallback(async () => {
    setLoading(true); setLoadError(null);
    try {
      const { species } = await api<{ species: DbFishSpecies[] }>('/api/admin/species');
      setItems(species);
    } catch (e) {
      setLoadError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (editing) editRef.current?.focus(); }, [editing]);

  const counts = useMemo(() => ({
    all: items.length,
    freshwater: items.filter((s) => s.category === 'freshwater').length,
    saltwater: items.filter((s) => s.category === 'saltwater').length,
    both: items.filter((s) => s.category === 'both').length,
    hidden: items.filter((s) => !s.is_active).length,
  }), [items]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return sortSpecies(items).filter((s) =>
      (filter === 'all' || (filter === 'hidden' ? !s.is_active : s.category === filter)) &&
      (!term || s.name.toLowerCase().includes(term)));
  }, [items, q, filter]);

  const replace = (s: DbFishSpecies) => setItems((l) => l.map((x) => (x.id === s.id ? s : x)));

  const add = async () => {
    setAddError('');
    if (!newName.trim()) { setAddError('Enter a species name.'); return; }
    setAdding(true);
    try {
      const { species } = await api<{ species: DbFishSpecies }>('/api/admin/species', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName, category: newCat }),
      });
      setItems((l) => [...l, species]);
      setNewName('');
      success(`Added ${species.name}`);
    } catch (e) {
      setAddError((e as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const patch = async (s: DbFishSpecies, body: Record<string, unknown>, msg: (n: DbFishSpecies, renamed: number) => string) => {
    setBusy(s.id);
    try {
      const j = await api<{ species: DbFishSpecies; renamedTournaments: number }>(`/api/admin/species/${s.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      replace(j.species);
      success(msg(j.species, j.renamedTournaments || 0));
      return true;
    } catch (e) {
      toastError((e as Error).message);
      return false;
    } finally {
      setBusy(null);
    }
  };

  const saveRename = async (s: DbFishSpecies) => {
    if (editName.trim() === s.name) { setEditing(null); return; }
    const ok = await patch(s, { name: editName }, (n, r) => {
      setAliases((a) => ({ ...a, [n.name]: a[s.name] || s.name }));
      return `Renamed to ${n.name}${r ? ` and updated ${r} tournament${r === 1 ? '' : 's'}` : ''}`;
    });
    if (ok) setEditing(null);
  };

  const doDelete = async (s: DbFishSpecies) => {
    setBusy(s.id);
    try {
      await api(`/api/admin/species/${s.id}`, { method: 'DELETE' });
      setItems((l) => l.filter((x) => x.id !== s.id));
      success(`Deleted ${s.name}`);
    } catch (e) {
      toastError((e as Error).message);
    } finally {
      setBusy(null);
      setConfirmDelete(null);
    }
  };

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'freshwater', label: 'Freshwater' },
    { id: 'saltwater', label: 'Saltwater' },
    { id: 'both', label: 'Fresh & salt' },
    { id: 'hidden', label: 'Hidden' },
  ];

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-[#E8EEF4] bg-white shadow-[0_2px_10px_rgba(10,30,60,0.05)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEF3F8] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Fish className="h-4 w-4 text-[#0E7C7B]" />
          <span className="font-semibold text-[#0D1B4C]">Fish Species</span>
          <span className="text-xs text-[#5F6F86]">The list anglers pick from in the Species filter on Tournaments and Search</span>
        </div>
      </div>

      {loadError ? (
        <div className="flex items-start gap-2 px-5 py-6 text-sm text-red-600">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {loadError}
        </div>
      ) : (
        <div className="p-5">
          {/* Add */}
          <form noValidate onSubmit={(e) => { e.preventDefault(); add(); }} className="flex flex-col gap-2 rounded-lg bg-[#F5F8FB] p-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <label htmlFor="new-species" className="sr-only">New species name</label>
              <input id="new-species" value={newName} onChange={(e) => { setNewName(e.target.value); setAddError(''); }} maxLength={SPECIES_NAME_MAX}
                placeholder="Add a species, e.g. Peacock Bass" className={input} aria-invalid={!!addError} />
              {addError && <p role="alert" className="mt-1 text-xs text-red-600">{addError}</p>}
            </div>
            <label htmlFor="new-species-cat" className="sr-only">Water type</label>
            <select id="new-species-cat" value={newCat} onChange={(e) => setNewCat(e.target.value as SpeciesCategory)} className={`${input} sm:w-[150px]`}>
              {SPECIES_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
            </select>
            <button type="submit" disabled={adding} className="flex h-[38px] items-center justify-center gap-1.5 rounded-lg bg-[#0E7C7B] px-4 text-sm font-semibold text-white hover:bg-[#0B6564] disabled:opacity-60">
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add species
            </button>
          </form>

          {/* Filters */}
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {FILTERS.map((f) => (
                <button key={f.id} type="button" onClick={() => setFilter(f.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${filter === f.id ? 'bg-[#0E7C7B] text-white' : 'bg-[#F0F4F8] text-[#4A5B76] hover:bg-[#E3EAF1]'}`}>
                  {f.label} ({counts[f.id]})
                </button>
              ))}
            </div>
            <label className="relative block sm:w-[240px]">
              <span className="sr-only">Search species</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A9AB0]" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search species" className={`${input} pl-9`} />
            </label>
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#5F6F86]"><Loader2 className="h-4 w-4 animate-spin" /> Loading species…</div>
          ) : shown.length === 0 ? (
            <div className="py-10 text-center text-sm text-[#5F6F86]">{items.length === 0 ? 'No species yet. Add your first one above.' : 'No species match.'}</div>
          ) : (
            <ul className="mt-3 divide-y divide-[#EEF3F8] rounded-lg border border-[#EEF3F8]">
              {shown.map((s) => {
                const used = usedBy(s.name);
                const isEditing = editing === s.id;
                const working = busy === s.id;
                return (
                  <li key={s.id} className={`flex flex-wrap items-center gap-3 px-4 py-2.5 ${!s.is_active ? 'bg-[#FAFBFC]' : ''}`}>
                    {isEditing ? (
                      <form noValidate onSubmit={(e) => { e.preventDefault(); saveRename(s); }} className="flex min-w-0 flex-1 items-center gap-2">
                        <label htmlFor={`edit-${s.id}`} className="sr-only">Species name</label>
                        <input id={`edit-${s.id}`} ref={editRef} value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={SPECIES_NAME_MAX}
                          onKeyDown={(e) => { if (e.key === 'Escape') setEditing(null); }} className={`${input} max-w-[320px]`} />
                        <button type="submit" disabled={working} aria-label="Save name" className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0E7C7B] text-white hover:bg-[#0B6564] disabled:opacity-60">
                          {working ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                        </button>
                        <button type="button" onClick={() => setEditing(null)} aria-label="Cancel" className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#D3DEE8] text-[#5F6F86] hover:bg-[#F5F8FB]">
                          <X className="h-4 w-4" />
                        </button>
                      </form>
                    ) : (
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <span className={`font-medium ${s.is_active ? 'text-[#0D1B4C]' : 'text-[#8A9AB0] line-through decoration-[#C9D3DE]'}`}>{s.name}</span>
                        {!s.is_active && <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">Hidden</span>}
                        {used > 0 && <span className="text-xs text-[#8A9AB0]">Used by {used} tournament{used === 1 ? '' : 's'}</span>}
                      </div>
                    )}

                    <label htmlFor={`cat-${s.id}`} className="sr-only">Water type for {s.name}</label>
                    <select id={`cat-${s.id}`} value={s.category} disabled={working}
                      onChange={(e) => patch(s, { category: e.target.value }, (n) => `${n.name} is now ${CATEGORY_LABEL[n.category].toLowerCase()}`)}
                      className={`h-[30px] rounded-full border-0 px-3 text-xs font-medium focus:ring-2 focus:ring-[#22B3B5] ${CAT_CHIP[s.category]}`}>
                      {SPECIES_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABEL[c]}</option>)}
                    </select>

                    <div className="flex gap-1">
                      {!isEditing && (
                        <button type="button" onClick={() => { setEditing(s.id); setEditName(s.name); }} aria-label={`Rename ${s.name}`} title="Rename"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A9AB0] hover:bg-[#EEF8F8] hover:text-[#0E7C7B]">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button type="button" disabled={working}
                        onClick={() => patch(s, { isActive: !s.is_active }, (n) => `${n.name} is ${n.is_active ? 'shown' : 'hidden'} in the Species filter`)}
                        aria-label={s.is_active ? `Hide ${s.name}` : `Show ${s.name}`} title={s.is_active ? 'Hide from the Species filter' : 'Show in the Species filter'}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A9AB0] hover:bg-[#EEF8F8] hover:text-[#0E7C7B] disabled:opacity-50">
                        {s.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                      </button>
                      <button type="button" disabled={working} onClick={() => setConfirmDelete(s)} aria-label={`Delete ${s.name}`} title="Delete"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-[#8A9AB0] hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-[#5F6F86]">
            Renaming a species also updates tournaments that use it. Hiding removes it from the filter but keeps it on the list. Deleting removes it from the list; tournaments keep showing the species on their own pages.
          </p>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#0A1A2E]/60 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby="del-species-title" className="w-full max-w-[420px] rounded-xl bg-white p-6 shadow-2xl">
            <h3 id="del-species-title" className="font-montserrat text-lg font-bold text-[#0D1B4C]">Delete {confirmDelete.name}?</h3>
            <p className="mt-2 text-sm text-[#4A5B76]">
              It will be removed from the Species filter and this list.
              {usedBy(confirmDelete.name) ? ` ${usedBy(confirmDelete.name)} tournament${usedBy(confirmDelete.name) === 1 ? ' still uses' : 's still use'} it and will keep showing it on ${usedBy(confirmDelete.name) === 1 ? 'its page' : 'their pages'}.` : ''}
              {' '}If you might need it again, hide it instead.
            </p>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setConfirmDelete(null)} className="h-[38px] rounded-lg border border-[#D3DEE8] px-4 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB]">Cancel</button>
              {confirmDelete.is_active && (
                <button type="button" onClick={() => { const s = confirmDelete; setConfirmDelete(null); patch(s, { isActive: false }, (n) => `${n.name} is hidden in the Species filter`); }}
                  className="h-[38px] rounded-lg border border-[#D3DEE8] px-4 text-sm font-medium text-[#2E3F5C] hover:bg-[#F5F8FB]">Hide instead</button>
              )}
              <button type="button" onClick={() => doDelete(confirmDelete)} disabled={busy === confirmDelete.id}
                className="flex h-[38px] items-center justify-center gap-1.5 rounded-lg bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">
                {busy === confirmDelete.id && <Loader2 className="h-4 w-4 animate-spin" />} Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <Toast toasts={toasts} onRemove={remove} />
    </div>
  );
}
