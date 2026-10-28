import { loadJSON, loadExternal, tmdbImg, t, tx, ui, esc, icon, daysSince, seoulToday, countUp } from '../core.js';

function daysToBirthday(iso) {
  const [, m, d] = iso.split('-').map(Number);
  const now = seoulToday();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  let next = Date.UTC(now.getFullYear(), m - 1, d);
  if (next < today) next = Date.UTC(now.getFullYear() + 1, m - 1, d);
  return Math.round((next - today) / 86400000);
}

export async function render() {
  const [profile, journey, works, awards, media, ext] = await Promise.all([
    loadJSON('data/profile.json'), loadJSON('data/journey.json'), loadJSON('data/works.json'),
    loadJSON('data/awards.json'), loadJSON('data/media.json'), loadExternal(),
  ]);

  // Hero photo: admin's featured upload → any upload → TMDB profile photo → monogram.
  const tmdbPhoto = ext.tmdb.person?.profile && { src: tmdbImg(ext.tmdb.person.profile, 'h632'), caption: profile.stageName };
  const featured = media.gallery.find((g) => g.featured) || media.gallery[0] || tmdbPhoto;
  const letters = 'HYERI'.split('').map((c, i) => `<span style="--i:${i}">${c}</span>`).join('');
  const bday = daysToBirthday(profile.birthDate);
  const highlights = journey.items.map((j, idx) => ({ ...j, idx })).filter((j) => j.highlight); // idx links the card to its timeline entry
  const nicks = profile.nicknames.map((n) => `<a class="chip nick" href="#/profile?section=nicknames" title="${tx(n.desc)}">${icon('heart')}${tx(n.name)}</a>`).join('');
  const nicksHidden = nicks.replace(/class="chip nick"/g, 'class="chip nick" aria-hidden="true" tabindex="-1"');
  const sparkles = [[8, 18], [46, 6], [88, 30], [70, 84], [18, 78]]
    .map(([x, y], i) => `<span class="sparkle" style="left:${x}%;top:${y}%;animation-delay:${i * 0.45}s">${icon('sparkle')}</span>`).join('');

  return `
  <section class="hero">
    <div class="container hero-grid">
      <div>
        <span class="chip chip-pink hero-brand reveal">${icon('heart')} ${esc(ui('home.brandTag'))}</span>
        <div class="hero-kicker reveal">${esc(ui('home.kicker'))}</div>
        <h1 class="hero-name" aria-label="HYERI">${letters}</h1>
        <div class="hero-alt reveal" style="--d:.5s">혜리 · ฮเยริ · Lee Hye-ri</div>
        <p class="hero-lead reveal" style="--d:.6s">${esc(ui('home.lead'))}</p>
        <div class="hero-actions reveal" style="--d:.7s">
          <a class="btn btn-primary" href="#/works">${icon('film')} ${esc(ui('home.ctaWorks'))}</a>
          <a class="btn btn-ghost" href="#/journey">${esc(ui('home.ctaJourney'))} ${icon('arrowRight')}</a>
        </div>
        <div class="chips hero-chips reveal" style="--d:.8s">
          <span class="chip chip-pink">${icon('music')} ${tx(profile.group)}</span>
          <span class="chip">${icon('heart')} ${esc(ui('home.fandomTitle'))}: ${tx(profile.fandom)}</span>
        </div>
      </div>
      <div class="hero-visual reveal" style="--d:.3s">
        ${sparkles}
        <span class="sticker s1">${icon('heart')}</span>
        <span class="sticker s2">${icon('star')}</span>
        <span class="sticker s3">${icon('music')}</span>
        <div class="polaroid">
          <div class="polaroid-img">
            ${featured ? `<img src="${esc(featured.src)}" alt="${tx(featured.caption)}" loading="eager">` : '<span class="polaroid-mono">H</span>'}
            <img class="polaroid-sign" src="images/signature.png" alt="${esc(ui('home.signatureAlt'))}" width="251" height="191">
          </div>
          <div class="polaroid-cap">${esc(ui('home.polaroidCaption'))}</div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">${icon('calendar')} D-day</span>
        <h2 class="section-title">${esc(ui('home.countersTitle'))}</h2>
        <p class="section-sub">${esc(ui('home.countersSub'))}</p>
      </div>
      <div class="counters">
        <div class="card counter reveal"><div class="counter-icon">${icon('music')}</div><div class="counter-num">D+<span data-count="${daysSince(profile.debutSinger.date)}">0</span></div><div class="counter-label">${esc(ui('home.sinceDebut'))}</div></div>
        <div class="card counter reveal" style="--d:.1s"><div class="counter-icon">${icon('film')}</div><div class="counter-num">D+<span data-count="${daysSince(profile.debutActor.date)}">0</span></div><div class="counter-label">${esc(ui('home.sinceActing'))}</div></div>
        <div class="card counter reveal" style="--d:.2s"><div class="counter-icon">${icon('cake')}</div>${bday === 0
          ? `<div class="counter-num">🎂</div><div class="counter-label">${esc(ui('home.birthdayToday'))}</div>`
          : `<div class="counter-num">D-<span data-count="${bday}">0</span></div><div class="counter-label">${esc(ui('home.toBirthday'))}</div>`}</div>
      </div>
      <div class="counters" style="margin-top:16px">
        <div class="card counter reveal"><div class="counter-num" data-count="${works.drama.length + works.movie.length}">0</div><div class="counter-label">${esc(ui('home.statsWorks'))}</div></div>
        <div class="card counter reveal" style="--d:.1s"><div class="counter-num" data-count="${awards.items.length}">0</div><div class="counter-label">${esc(ui('home.statsAwards'))}</div></div>
        <div class="card counter reveal" style="--d:.2s"><div class="counter-num" data-count="${works.variety.length}">0</div><div class="counter-label">${esc(ui('home.statsVariety'))}</div></div>
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">${icon('star')} Best of</span>
        <h2 class="section-title">${esc(ui('home.highlightsTitle'))}</h2>
        <p class="section-sub">${esc(ui('home.highlightsSub'))}</p>
      </div>
      <div class="grid grid-3">
        ${highlights.map((h, i) => `
          <a class="card hover highlight reveal" style="--d:${(i % 3) * 0.08}s;text-decoration:none;color:inherit" href="#/journey?item=${h.idx}">
            <div class="highlight-top g-${i % 4}">
              <div class="highlight-year">${esc(h.year)}</div>
              <h3 class="highlight-title">${tx(h.title)}</h3>
            </div>
            <div class="highlight-body">${esc(t(h.body).slice(0, 150))}…</div>
          </a>`).join('')}
      </div>
    </div>
  </section>

  <section class="section">
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">${icon('smile')} Nicknames</span>
        <h2 class="section-title">${esc(ui('home.nicknamesTitle'))}</h2>
      </div>
    </div>
    <div class="marquee reveal"><div class="marquee-track">${nicks}${nicksHidden}${nicksHidden}${nicksHidden}</div></div>
    <div class="container" style="text-align:center;margin-top:24px">
      <a class="btn btn-ghost" href="#/profile?section=nicknames">${esc(ui('home.nickOrigins'))} ${icon('arrowRight')}</a>
    </div>
  </section>`;
}

export function mount(root) {
  countUp(root);
}
