// Shared helpers for every page module. Pages import from here — never duplicate these.

export const LANGS = ['th', 'en', 'ko'];
export const LANG_LABEL = { th: 'TH', en: 'EN', ko: 'KR' };

export const state = {
  lang: 'th',
  strings: {},   // UI strings for current language (data/i18n/<lang>.json)
  fallback: {},  // English UI strings, used when a key is missing
  site: null,    // data/site.json
};

const cache = new Map();

/**
 * Stable key linking a works.json entry to its TMDB / YouTube data in data/tmdb.json and data/youtube.json.
 * Also imported by tools/lib/external.mjs — change both sides together.
 */
export function workKey(kind, w) {
  if (kind === 'mv') return `mv:${w.artist.en}|${w.song.en}`;
  if (kind === 'gd') return `gd:${w.title.en}`; // Girl's Day release (data/girlsday.json)
  return `${kind}:${w.title.ko}`;
}

/** Build a TMDB image URL. Local/absolute paths pass through unchanged. */
export function tmdbImg(path, size = 'w342') {
  if (!path) return '';
  return /^(https?:|data:|\/|images\/)/.test(path) ? path : `https://image.tmdb.org/t/p/${size}${path}`;
}

/** Synced data from TMDB and YouTube (written weekly by tools/sync-external.mjs). Never throws. */
export async function loadExternal() {
  const [tmdb, yt] = await Promise.all([
    loadJSON('data/tmdb.json').catch(() => null),
    loadJSON('data/youtube.json').catch(() => null),
  ]);
  return {
    tmdb: { person: null, works: {}, unmatched: [], ...tmdb },
    yt: { channel: null, latest: [], mv: {}, ...yt },
  };
}

/** Fetch a JSON file relative to the site root (cached per session). */
export async function loadJSON(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path, { cache: 'no-cache' }).then((r) => {
      if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
      return r.json();
    }).catch((e) => { cache.delete(path); throw e; }));
  }
  return cache.get(path);
}

/** Pick the current language from a localized value {th, en, ko}. Falls back th → en → ko. */
export function t(value) {
  if (value == null) return '';
  if (typeof value !== 'object') return String(value);
  return value[state.lang] || value.en || value.ko || value.th || '';
}

/**
 * Look up a UI string by dotted key, e.g. ui('nav.home'). Supports {var} placeholders;
 * {brand} is always available (data/site.json → brand.name).
 */
export function ui(key, vars) {
  const get = (obj) => key.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
  const all = { brand: state.site?.brand?.name || '', ...vars };
  return String(get(state.strings) ?? get(state.fallback) ?? key).replace(/\{(\w+)\}/g, (m, k) => all[k] ?? m);
}

/** Site/fan-base name, e.g. "Hyeri Thailand FC". */
export const brandName = () => state.site?.brand?.name || 'HYERI';

/** Escape text for safe insertion into HTML templates. Use for ALL data values. */
export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Localize + escape in one step. */
export const tx = (v) => esc(t(v));

export function formatDate(iso) {
  const locale = { th: 'th-TH', en: 'en-US', ko: 'ko-KR' }[state.lang];
  return new Date(iso + 'T00:00:00').toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatNumber(n) {
  return new Intl.NumberFormat({ th: 'th-TH', en: 'en-US', ko: 'ko-KR' }[state.lang]).format(n);
}

/** Days between an ISO date and today (Korea time, so D-day matches Korean fans). */
export function daysSince(iso) {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [y, m, d] = iso.split('-').map(Number);
  return Math.floor((today - Date.UTC(y, m - 1, d)) / 86400000);
}

export function seoulToday() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
}

/** Animate numbers in [data-count] elements when they scroll into view. */
export function countUp(root) {
  const els = root.querySelectorAll('[data-count]');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      io.unobserve(e.target);
      const el = e.target;
      const end = Number(el.dataset.count);
      if (reduce) { el.textContent = formatNumber(end); return; }
      const start = performance.now();
      const dur = 1400;
      const step = (now) => {
        const p = Math.min(1, (now - start) / dur);
        el.textContent = formatNumber(Math.round(end * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.4 });
  els.forEach((el) => io.observe(el));
}

let revealObserver;
/** Fade-up elements with .reveal when they enter the viewport. */
export function reveal(root = document) {
  revealObserver ??= new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); revealObserver.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  root.querySelectorAll('.reveal:not(.in)').forEach((el) => revealObserver.observe(el));
}

/** Small inline SVG icon set (stroke icons, 24×24). */
const ICONS = {
  heart: '<path d="M12 21s-7.5-4.6-9.5-9.2C1 8.2 3.2 4.5 6.9 4.5c2 0 3.6 1.1 5.1 3 1.5-1.9 3.1-3 5.1-3 3.7 0 5.9 3.7 4.4 7.3C19.5 16.4 12 21 12 21z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
  sparkle: '<path d="M12 2c.6 4.6 2.4 7.4 8 8-5.6.6-7.4 3.4-8 10-.6-6.6-2.4-9.4-8-10 5.6-.6 7.4-3.4 8-8z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  film: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 9h4M3 15h4M17 9h4M17 15h4"/>',
  tv: '<rect x="3" y="6" width="18" height="13" rx="2"/><path d="m8 2 4 4 4-4"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/>',
  mic: '<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/>',
  cake: '<path d="M4 21V12a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9M2 21h20M4 16c2 1 4 1 6 0s4-1 6 0 4 1 4 0M12 10V7"/><path d="M12 3c.8.9 1 1.7.5 2.5a.6.6 0 0 1-1 0C11 4.7 11.2 3.9 12 3z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  ruler: '<path d="M3 17 17 3l4 4L7 21z"/><path d="m7 13 2 2M10 10l2 2M13 7l2 2"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 3 3h0a2 2 0 0 0 3-1V5a2 2 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-3 3h0a2 2 0 0 1-3-1"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h.01M15 15h.01M10 21v-3h4v3"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M22 20a7 7 0 0 0-4-6.3"/>',
  school: '<path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11v5c3 2.5 9 2.5 12 0v-5"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.5-3.5 9c-2.5-2.5-3.5-5.5-3.5-9s1-6.5 3.5-9z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  play: '<path d="M7 4v16l13-8z" fill="currentColor"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 9"/>',
  arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
  arrowRight: '<path d="M5 12h14M13 5l7 7-7 7"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>',
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z" fill="currentColor"/>',
  x: '<path d="M4 4l16 16M20 4 4 20"/>',
  weibo: '<circle cx="10" cy="14" r="6"/><path d="M15 4a5 5 0 0 1 5 5M15 7a2 2 0 0 1 2 2"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
};

export function icon(name, cls = '') {
  const body = ICONS[name] || ICONS.sparkle;
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

/** Read the current hash query (e.g. #/works?tab=movie → {tab:'movie'}). */
export function routeQuery() {
  const q = location.hash.split('?')[1] || '';
  return Object.fromEntries(new URLSearchParams(q));
}

/** Update the hash query without triggering a full page re-render. */
export function setRouteQuery(params) {
  const path = (location.hash.split('?')[0] || '#/');
  const q = new URLSearchParams(params).toString();
  history.replaceState(null, '', path + (q ? '?' + q : ''));
}
