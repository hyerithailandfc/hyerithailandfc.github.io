import { state, loadJSON, loadExternal, workKey, tmdbImg, t, tx, ui, esc, icon, reveal, formatNumber, routeQuery, setRouteQuery } from '../core.js';

const TABS = [
  { id: 'drama', icon: 'tv' },
  { id: 'movie', icon: 'film' },
  { id: 'variety', icon: 'smile' },
  { id: 'hosting', icon: 'mic' },
  { id: 'mv', icon: 'music' },
];

let works;
let ext;
let tab = 'drama';
let query = '';
let onKey;

/** Secondary title: Korean original when reading in TH/EN, English when reading in KR. */
const altTitle = (v) => esc(state.lang === 'ko' ? v.en : v.ko);

function typeTag(type) {
  const cls = { lead: 'tag-lead', support: 'tag-support', cameo: 'tag-cameo', special: 'tag-special' }[type] || 'tag-other';
  return `<span class="tag ${cls}">${esc(ui(`works.${type}`))}</span>`;
}

function kindLabel(item) {
  const k = ui(`works.kind.${item.kind}`);
  return item.ep ? `${esc(k)} · ${esc(ui('works.ep', { ep: item.ep }))}` : esc(k);
}

function matches(item) {
  if (!query) return true;
  const hay = JSON.stringify([item.title, item.role, item.artist, item.song, item.network, item.year, item.cohosts]).toLowerCase();
  return hay.includes(query);
}

function screenCard(w, i) {
  const key = workKey(tab, w);
  const m = ext.tmdb.works[key];
  return `
    <article class="card hover work-card ${m?.poster ? 'has-poster' : ''} reveal" style="--d:${(i % 3) * 0.05}s">
      ${m?.poster ? `<img class="work-poster" src="${esc(tmdbImg(m.poster, 'w185'))}" alt="" loading="lazy" width="92" height="138">` : ''}
      <div class="work-info">
        <div class="work-top"><span class="work-year">${esc(w.year)}</span>${w.network ? `<span class="work-net">${esc(w.network)}</span>` : ''}</div>
        <h3 class="work-title">${tx(w.title)}</h3>
        <div class="work-alt">${altTitle(w.title)}</div>
        <div class="work-role">${esc(ui('works.as'))} <b>${tx(w.role)}</b></div>
        <div class="row-tags">${typeTag(w.type)}${m?.rating ? `<span class="tag tag-other">★ ${m.rating}</span>` : ''}</div>
        ${w.rating ? `<div class="rating"><div class="rating-bar"><span style="--w:${Math.min(100, (w.rating / 20) * 100)}%"></span></div><div class="rating-text">${esc(ui('works.rating'))} ${w.rating}%</div></div>` : ''}
        ${m ? `<button class="work-more" type="button" data-work="${esc(key)}">${esc(ui('works.details'))} ${icon('arrowRight')}</button>` : ''}
      </div>
    </article>`;
}

function mvCard(m, i) {
  const v = ext.yt.mv[workKey('mv', m)];
  return `
    <article class="card hover video-card reveal" style="--d:${(i % 3) * 0.05}s">
      ${v ? `<button class="yt" type="button" data-yt="${esc(v.id)}" aria-label="${esc(ui('media.play'))}: ${tx(m.song)}">
        <img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy"><span class="play">${icon('play')}</span></button>` : ''}
      <div class="video-meta">
        <div class="work-top"><span class="work-year">${esc(m.year)}</span>${v?.views ? `<span class="work-net">${esc(ui('works.views', { n: formatNumber(v.views) }))}</span>` : icon('music').replace('<svg', '<svg width="20" height="20" style="color:var(--blue)"')}</div>
        <h3 class="work-title">${tx(m.song)}</h3>
        <div class="work-alt">${altTitle(m.song)}</div>
        <div class="work-role"><b>${tx(m.artist)}</b></div>
      </div>
    </article>`;
}

function renderList() {
  const items = (works[tab] || []).filter(matches).slice().reverse();
  if (!items.length) return `<div class="empty">${icon('search')}<p>${esc(ui('common.noResults'))}</p></div>`;
  if (tab === 'drama' || tab === 'movie') return `<div class="grid grid-3">${items.map(screenCard).join('')}</div>`;
  if (tab === 'mv') return `<div class="grid grid-3">${items.map(mvCard).join('')}</div>`;

  return `<div class="list-rows">${items.map((v, i) => `
    <article class="card row-card reveal" style="--d:${Math.min(i, 6) * 0.03}s">
      <div class="row-year">${esc(v.year)}</div>
      <div>
        <div class="row-title">${tx(v.title)}</div>
        <div class="row-sub">${altTitle(v.title)}${v.cohosts ? ` · ${esc(ui('works.cohosts'))} ${tx(v.cohosts)}` : ''}</div>
      </div>
      <div><span class="tag ${v.kind === 'regular' || v.kind === 'main' ? 'tag-lead' : 'tag-support'}">${kindLabel(v)}</span></div>
    </article>`).join('')}</div>`;
}

function renderTabs() {
  return TABS.map((tb) => `
    <button class="tab" role="tab" type="button" data-tab="${tb.id}" aria-selected="${tb.id === tab}">
      ${icon(tb.icon)} ${esc(ui(`works.${tb.id}`))} <span class="count">${works[tb.id]?.length || 0}</span>
    </button>`).join('');
}

function closeModal() {
  document.querySelector('.modal')?.remove();
  if (onKey) document.removeEventListener('keydown', onKey);
}

function openModal(key) {
  const w = works[tab].find((x) => workKey(tab, x) === key);
  const m = ext.tmdb.works[key];
  if (!w || !m) return;
  const overview = t(m.overview);
  const box = document.createElement('div');
  box.className = 'modal';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.setAttribute('aria-label', t(w.title));
  box.innerHTML = `
    <div class="modal-panel">
      <button class="icon-btn modal-close" type="button" aria-label="${esc(ui('common.close'))}">${icon('close')}</button>
      <div class="modal-hero" ${m.backdrop ? `style="background-image:url('${esc(tmdbImg(m.backdrop, 'w780'))}')"` : ''}></div>
      <div class="modal-body">
        ${m.poster ? `<img class="modal-poster" src="${esc(tmdbImg(m.poster, 'w342'))}" alt="" width="120" height="180">` : ''}
        <div class="modal-head">
          <div class="work-top" style="justify-content:flex-start;gap:10px"><span class="work-year">${esc(w.year)}</span>${w.network ? `<span class="work-net">${esc(w.network)}</span>` : ''}</div>
          <h2 class="modal-title">${tx(w.title)}</h2>
          <div class="work-alt">${altTitle(w.title)}</div>
          <div class="work-role">${esc(ui('works.as'))} <b>${tx(w.role)}</b></div>
          <div class="row-tags">${typeTag(w.type)}${m.rating ? `<span class="tag tag-other">${esc(ui('works.tmdbRating'))} ★ ${m.rating}</span>` : ''}</div>
        </div>
        <h3 class="modal-sub">${esc(ui('works.overview'))}</h3>
        <p class="modal-text">${overview ? esc(overview) : esc(ui('works.noOverview'))}</p>
        <a class="btn btn-ghost btn-sm" href="${esc(m.url)}" target="_blank" rel="noopener">${esc(ui('works.viewOnTmdb'))} ${icon('link')}</a>
      </div>
    </div>`;
  onKey = (e) => { if (e.key === 'Escape') closeModal(); };
  box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('.modal-close')) closeModal(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(box);
  box.querySelector('.modal-close').focus();
}

export async function render() {
  [works, ext] = await Promise.all([loadJSON('data/works.json'), loadExternal()]);
  const q = routeQuery();
  tab = TABS.some((x) => x.id === q.tab) ? q.tab : 'drama';
  query = '';
  return `
  <section class="page-hero">
    <div class="container">
      <span class="eyebrow reveal">${icon('film')} Works</span>
      <h1 class="reveal"><span class="title-pop">${esc(ui('works.title'))}</span></h1>
      <p class="reveal">${esc(ui('works.sub'))}</p>
    </div>
  </section>
  <section class="section" style="padding-top:12px">
    <div class="container">
      <div class="tabs" role="tablist" id="work-tabs">${renderTabs()}</div>
      <div class="toolbar">
        <label class="search">${icon('search')}<span class="visually-hidden">${esc(ui('common.search'))}</span>
          <input type="search" id="work-search" placeholder="${esc(ui('common.search'))}" autocomplete="off">
        </label>
      </div>
      <div id="work-list" role="tabpanel">${renderList()}</div>
    </div>
  </section>`;
}

export function mount(root) {
  const list = root.querySelector('#work-list');
  const refresh = () => { list.innerHTML = renderList(); reveal(list); };
  root.querySelector('#work-tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b || b.dataset.tab === tab) return;
    tab = b.dataset.tab;
    root.querySelectorAll('[data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.tab === tab)));
    setRouteQuery({ tab });
    refresh();
  });
  root.querySelector('#work-search').addEventListener('input', (e) => {
    query = e.target.value.trim().toLowerCase();
    refresh();
  });
  list.addEventListener('click', (e) => {
    const more = e.target.closest('[data-work]');
    if (more) { openModal(more.dataset.work); return; }
    const yt = e.target.closest('[data-yt]');
    if (yt) {
      yt.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt.dataset.yt)}?autoplay=1&rel=0" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      yt.removeAttribute('data-yt');
    }
  });
}

export function unmount() {
  closeModal();
}
