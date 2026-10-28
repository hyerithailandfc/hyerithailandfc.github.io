import { state, loadJSON, loadExternal, workKey, tx, ui, esc, icon, reveal, formatDate, formatNumber, daysSince, routeQuery, setRouteQuery } from '../core.js';

const FILTERS = {
  all: () => true,
  albums: (r) => ['album', 'repackage', 'mini'].includes(r.type),
  singles: (r) => ['single', 'digital', 'special', 'japan'].includes(r.type),
};
const MEMBER_GRADIENTS = ['g-1', 'g-3', 'g-2', 'g-0'];

let gd;
let ext;
let filter = 'all';

/** Secondary title: Korean when reading in TH/EN, English when reading in KR. */
const altTitle = (v) => esc(state.lang === 'ko' ? v.en : v.ko);

function releaseCard(r, i) {
  const v = ext.yt.mv[workKey('gd', r)];
  return `
    <article class="card hover video-card reveal" style="--d:${(i % 3) * 0.05}s">
      ${r.youtubeId
        ? `<button class="yt" type="button" data-yt="${esc(r.youtubeId)}" aria-label="${esc(ui('media.play'))}: ${tx(r.title)}">
             <img src="https://i.ytimg.com/vi/${esc(r.youtubeId)}/hqdefault.jpg" alt="" loading="lazy"><span class="play">${icon('play')}</span></button>`
        : `<div class="gd-nomv">${icon('music')}<span>${esc(ui('gd.noMv'))}</span></div>`}
      <div class="video-meta">
        <div class="work-top"><span class="work-year">${esc(formatDate(r.date))}</span>${v?.views ? `<span class="work-net">${esc(ui('works.views', { n: formatNumber(v.views) }))}</span>` : ''}</div>
        <h3 class="work-title">${tx(r.title)}</h3>
        <div class="work-alt">${altTitle(r.title)}</div>
        <div class="work-role">${esc(ui('gd.album'))} <b>${tx(r.album)}</b></div>
        <div class="row-tags" style="margin-top:6px">
          <span class="tag tag-support">${esc(ui(`gd.type.${r.type}`))}</span>
          ${r.withHyeri ? '' : `<span class="tag tag-other">${esc(ui('gd.beforeHyeri'))}</span>`}
        </div>
      </div>
    </article>`;
}

function renderReleases() {
  const list = gd.releases.filter(FILTERS[filter]).slice().reverse();
  const years = [...new Set(list.map((r) => r.date.slice(0, 4)))];
  return years.map((y) => `
    <div class="year-group">
      <div class="year-label reveal">${y}</div>
      <div class="grid grid-3">${list.filter((r) => r.date.startsWith(y)).map(releaseCard).join('')}</div>
    </div>`).join('');
}

export async function render() {
  [gd, ext] = await Promise.all([loadJSON('data/girlsday.json'), loadExternal()]);
  const q = routeQuery();
  filter = FILTERS[q.filter] ? q.filter : 'all';
  const mvCount = gd.releases.filter((r) => r.youtubeId).length;

  return `
  <section class="page-hero">
    <div class="container">
      <span class="eyebrow reveal">${icon('music')} Everyday, Girl's Day!</span>
      <h1 class="reveal"><span class="title-pop">${esc(ui('gd.title'))}</span></h1>
      <p class="reveal">${esc(ui('gd.sub'))}</p>
    </div>
  </section>

  <section class="section" style="padding-top:12px">
    <div class="container">
      <div class="card gd-intro reveal">
        <p>${tx(gd.intro)}</p>
        <div class="chips">
          <span class="chip chip-pink">${icon('star')} ${esc(ui('gd.debut'))} ${esc(formatDate(gd.debut))}</span>
          <span class="chip">${icon('calendar')} D+${formatNumber(daysSince(gd.debut))}</span>
          <span class="chip">${icon('heart')} ${esc(ui('gd.joined'))} ${esc(formatDate(gd.hyeriJoined))}</span>
          <span class="chip">${icon('users')} ${esc(ui('gd.fandom'))} ${tx(gd.fandom)}</span>
          <span class="chip">${icon('building')} ${tx(gd.agency)}</span>
        </div>
      </div>

      <div class="section-head reveal" style="margin-top:clamp(36px,6vw,56px)">
        <span class="eyebrow">${icon('users')} Members</span>
        <h2 class="section-title">${esc(ui('gd.members'))}</h2>
      </div>
      <div class="grid grid-4">
        ${gd.members.map((m, i) => `
          <div class="card hover member-card ${m.isHyeri ? 'is-hyeri' : ''} reveal" style="--d:${i * 0.07}s">
            <div class="member-avatar ${MEMBER_GRADIENTS[i % 4]}">${esc(m.name.en[0])}</div>
            <h3 class="member-name">${tx(m.name)}</h3>
            <div class="work-alt">${esc(state.lang === 'ko' ? m.name.en : m.name.ko)} · ${esc(formatDate(m.birthDate))}</div>
            <p class="member-pos">${tx(m.position)}</p>
            ${m.isHyeri ? `<span class="chip chip-pink">${icon('heart')} ${esc(ui('gd.ourHyeri'))}</span>` : ''}
          </div>`).join('')}
      </div>

      <div class="section-head reveal" style="margin-top:clamp(36px,6vw,56px)">
        <span class="eyebrow">${icon('play')} Discography</span>
        <h2 class="section-title">${esc(ui('gd.discography'))}</h2>
        <p class="section-sub">${esc(ui('gd.discoSub', { n: gd.releases.length, mv: mvCount }))}</p>
      </div>
      <div class="tabs" role="tablist" id="gd-filter">
        ${Object.keys(FILTERS).map((f) => `<button class="tab" role="tab" type="button" data-filter="${f}" aria-selected="${f === filter}">${esc(ui(`gd.filter.${f}`))} <span class="count">${gd.releases.filter(FILTERS[f]).length}</span></button>`).join('')}
      </div>
      <div id="gd-list">${renderReleases()}</div>
    </div>
  </section>`;
}

export function mount(root) {
  const list = root.querySelector('#gd-list');
  root.querySelector('#gd-filter').addEventListener('click', (e) => {
    const b = e.target.closest('[data-filter]');
    if (!b || b.dataset.filter === filter) return;
    filter = b.dataset.filter;
    root.querySelectorAll('[data-filter]').forEach((x) => x.setAttribute('aria-selected', String(x.dataset.filter === filter)));
    setRouteQuery(filter === 'all' ? {} : { filter });
    list.innerHTML = renderReleases();
    reveal(list);
  });
  list.addEventListener('click', (e) => {
    const yt = e.target.closest('[data-yt]');
    if (!yt) return;
    yt.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt.dataset.yt)}?autoplay=1&rel=0" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
    yt.removeAttribute('data-yt');
  });
}
