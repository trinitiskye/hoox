'use client';

/* ------------------------------------------------------------------ */
/* Clubs map — one pin per club.                                       */
/*                                                                     */
/* Uses the Google Maps JavaScript API when NEXT_PUBLIC_GOOGLE_MAPS_   */
/* API_KEY is set (Cloudflare Pages → Settings → Environment variables).*/
/* Multiple pins need the JS API; the keyless Google embed used on the */
/* event pages can only show one place. Until a key is added, the same */
/* pins are drawn on OpenStreetMap so the view still works.            */
/* ------------------------------------------------------------------ */

import { useEffect, useRef, useState } from 'react';

export interface MapClub {
  id: string;
  name: string;
  place: string; // "Bozeman, MT"
  members: number;
  lat: number;
  lng: number;
}

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const PIN_COLOR = '#0E7C7B';

/* ----------------------------- loaders ------------------------------ */

const loaded: Record<string, Promise<void>> = {};

function loadScript(src: string, cssHref?: string) {
  if (!loaded[src]) {
    loaded[src] = new Promise<void>((resolve, reject) => {
      if (cssHref && !document.querySelector(`link[href="${cssHref}"]`)) {
        const l = document.createElement('link');
        l.rel = 'stylesheet';
        l.href = cssHref;
        document.head.appendChild(l);
      }
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        delete loaded[src];
        reject(new Error(`Failed to load ${src}`));
      };
      document.head.appendChild(s);
    });
  }
  return loaded[src];
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function popupHtml(c: MapClub) {
  return `
    <div style="font-family:Roboto,system-ui,sans-serif;min-width:190px">
      <div style="font:700 15px/1.25 Montserrat,system-ui,sans-serif;color:#0D1B4C">${escapeHtml(c.name)}</div>
      <div style="margin-top:3px;font-size:13px;color:#5F7896">${escapeHtml(c.place)} · ${c.members.toLocaleString()} members</div>
      <button type="button" data-club="${escapeHtml(c.id)}"
        style="margin-top:10px;width:100%;height:32px;border:1px solid #1FA3A6;border-radius:6px;background:#fff;color:#0E7C7B;font:600 13px Roboto,system-ui,sans-serif;cursor:pointer">
        View details →
      </button>
    </div>`;
}

/* ------------------------------ component ----------------------------- */

export default function ClubsMap({ clubs, onSelect }: { clubs: MapClub[]; onSelect: (id: string) => void }) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const layer = useRef<any[]>([]);
  const [engine, setEngine] = useState<'google' | 'osm' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  // Popup "View details" buttons (both engines render plain HTML)
  useEffect(() => {
    const node = el.current;
    if (!node) return;
    const onClick = (e: MouseEvent) => {
      const btn = (e.target as HTMLElement).closest('[data-club]') as HTMLElement | null;
      if (btn?.dataset.club) selectRef.current(btn.dataset.club);
    };
    node.addEventListener('click', onClick);
    return () => node.removeEventListener('click', onClick);
  }, []);

  // Create the map once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (GOOGLE_KEY) {
          await loadScript(`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_KEY)}&v=weekly`);
          if (cancelled || !el.current) return;
          const g = (window as any).google;
          map.current = new g.maps.Map(el.current, {
            center: { lat: 39.5, lng: -98.35 },
            zoom: 4,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          });
          setEngine('google');
        } else {
          await loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
          if (cancelled || !el.current) return;
          const L = (window as any).L;
          map.current = L.map(el.current, { scrollWheelZoom: false }).setView([39.5, -98.35], 4);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          }).addTo(map.current);
          setEngine('osm');
        }
      } catch {
        if (!cancelled) setError('The map couldn’t be loaded. Check your connection and try again.');
      }
    })();
    return () => {
      cancelled = true;
      if (map.current?.remove) map.current.remove(); // Leaflet cleanup
      map.current = null;
      layer.current = [];
    };
  }, []);

  // (Re)draw pins whenever the filtered clubs change
  useEffect(() => {
    const m = map.current;
    if (!m || !engine) return;

    if (engine === 'google') {
      const g = (window as any).google;
      layer.current.forEach((mk) => mk.setMap(null));
      layer.current = [];
      if (clubs.length === 0) return;
      const info = new g.maps.InfoWindow();
      const bounds = new g.maps.LatLngBounds();
      clubs.forEach((c) => {
        const mk = new g.maps.Marker({
          position: { lat: c.lat, lng: c.lng },
          map: m,
          title: c.name,
          icon: {
            path: 'M12 0C7 0 3 4 3 9c0 6.6 9 15 9 15s9-8.4 9-15c0-5-4-9-9-9zm0 12.5A3.5 3.5 0 1 1 12 5.5a3.5 3.5 0 0 1 0 7z',
            fillColor: PIN_COLOR,
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 1.5,
            scale: 1.5,
            anchor: new g.maps.Point(12, 24),
          },
        });
        mk.addListener('click', () => {
          info.setContent(popupHtml(c));
          info.open({ map: m, anchor: mk });
        });
        layer.current.push(mk);
        bounds.extend({ lat: c.lat, lng: c.lng });
      });
      if (clubs.length === 1) {
        m.setCenter({ lat: clubs[0].lat, lng: clubs[0].lng });
        m.setZoom(8);
      } else {
        m.fitBounds(bounds, 48);
      }
    } else {
      const L = (window as any).L;
      layer.current.forEach((mk) => mk.remove());
      layer.current = [];
      if (clubs.length === 0) return;
      const icon = L.divIcon({
        className: '',
        iconSize: [30, 40],
        iconAnchor: [15, 40],
        popupAnchor: [0, -36],
        html: `<svg width="30" height="40" viewBox="0 0 24 32" aria-hidden="true"><path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.5 12 32 12 32s12-11.5 12-20.3C24 5.2 18.6 0 12 0z" fill="${PIN_COLOR}" stroke="#fff" stroke-width="1.5"/><circle cx="12" cy="11.5" r="4.5" fill="#fff"/></svg>`,
      });
      clubs.forEach((c) => {
        const mk = L.marker([c.lat, c.lng], { icon, title: c.name, alt: c.name, keyboard: true })
          .addTo(m)
          .bindPopup(popupHtml(c));
        layer.current.push(mk);
      });
      if (clubs.length === 1) m.setView([clubs[0].lat, clubs[0].lng], 8);
      else m.fitBounds(L.latLngBounds(clubs.map((c) => [c.lat, c.lng])), { padding: [48, 48] });
    }
  }, [clubs, engine]);

  return (
    <div className="relative overflow-hidden rounded-lg border border-[#E8EEF4] bg-[#E9F2F7] shadow-[0_2px_10px_rgba(10,30,60,0.06)]">
      <div
        ref={el}
        role="region"
        aria-label={`Map of ${clubs.length} fishing club${clubs.length === 1 ? '' : 's'}`}
        className="h-[420px] w-full sm:h-[520px] xl:h-[600px]"
      />
      {!engine && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-[15px] text-[#5F7896]">Loading map…</div>
      )}
      {error && <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-[15px] text-[#5F7896]">{error}</div>}
      {engine && clubs.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-4 mx-auto w-fit rounded-md bg-white px-4 py-2 text-[14px] font-medium text-[#0D1B4C] shadow">
          No clubs match your filters.
        </div>
      )}
    </div>
  );
}
