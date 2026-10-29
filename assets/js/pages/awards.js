import { loadJSON, loadExternal, workKey, tmdbImg, tx, ui, esc, icon, countUp } from '../core.js';

/**
 * Picture for an award's `work`: the TMDB poster of the matching works.json entry (same Korean or English title,
 * or a season/special of it, e.g. "진짜 사나이" → "진짜 사나이 여군특집"), else her YouTube channel avatar
 * for "I am Lee Hyeri". Null when nothing matches.
 */
function workPicture(work, works, ext) {
  if (!work) return null;
  const entries = ['drama', 'movie', 'variety', 'hosting'].flatMap((kind) => (works[kind] || []).map((w) => [kind, w]));
  const same = ([, w]) => w.title.ko === work.ko || w.title.en === work.en;
  const partOf = ([, w]) => work.ko && w.title.ko.startsWith(work.ko);
  for (const test of [same, partOf]) {
    for (const [kind, w] of entries.filter(test)) {
      const poster = ext.tmdb.works[workKey(kind, w)]?.poster;
      if (poster) return { src: tmdbImg(poster, 'w92') };
    }
  }
  const ch = ext.yt.channel;
  if (ch?.thumbnail && (work.en === ch.title || /^I am Lee Hyeri$/i.test(work.en))) return { src: ch.thumbnail, avatar: true };
  return null;
}

export async function render() {
  const [{ items }, works, ext] = await Promise.all([loadJSON('data/awards.json'), loadJSON('data/works.json'), loadExternal()]);
  const byYear = new Map();
  items.forEach((a) => { if (!byYear.has(a.year)) byYear.set(a.year, []); byYear.get(a.year).push(a); });
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return `
  <section class="page-hero">
    <div class="container">
      <span class="eyebrow reveal">${icon('trophy')} Awards</span>
      <h1 class="reveal"><span class="title-pop">${esc(ui('awards.title'))}</span></h1>
      <p class="reveal">${esc(ui('awards.sub'))}</p>
    </div>
  </section>
  <section class="section" style="padding-top:12px">
    <div class="container">
      <div class="award-stats">
        <div class="card award-stat counter reveal"><div class="counter-num" data-count="${items.length}">0</div><div class="counter-label">${esc(ui('awards.total'))}</div></div>
        <div class="card award-stat counter reveal" style="--d:.1s"><div class="counter-num" data-count="${years.length}">0</div><div class="counter-label">${esc(ui('awards.years'))}</div></div>
        <div class="card award-stat counter reveal" style="--d:.2s"><div class="counter-num">${years[0]}</div><div class="counter-label">${esc(ui('awards.latest'))}</div></div>
      </div>
      ${years.map((y) => `
        <div class="year-group">
          <div class="year-label reveal">${y}</div>
          <div class="grid grid-2">
            ${byYear.get(y).map((a, i) => {
              const pic = workPicture(a.work, works, ext);
              return `
              <article class="card hover award-card reveal" style="--d:${(i % 2) * 0.06}s">
                ${pic ? `<div class="award-poster ${pic.avatar ? 'is-avatar' : ''}"><img src="${esc(pic.src)}" alt="" loading="lazy" width="46" height="${pic.avatar ? 46 : 69}"><span class="award-icon">${icon('trophy')}</span></div>`
                  : `<div class="award-icon">${icon('trophy')}</div>`}
                <div>
                  <div class="award-cat">${tx(a.category)}</div>
                  <div class="award-cer">${tx(a.ceremony)}</div>
                  ${a.work ? `<div class="award-work">${tx(a.work)}</div>` : ''}
                </div>
              </article>`;
            }).join('')}
          </div>
        </div>`).join('')}
    </div>
  </section>`;
}

export function mount(root) {
  countUp(root);
}
