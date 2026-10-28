import { loadJSON, loadExternal, tmdbImg, tx, ui, esc, icon, formatDate, seoulToday } from '../core.js';

function age(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const now = seoulToday();
  let a = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) a -= 1;
  return a;
}

export async function render() {
  const [p, media, ext] = await Promise.all([loadJSON('data/profile.json'), loadJSON('data/media.json'), loadExternal()]);
  const tmdbPhoto = ext.tmdb.person?.profile && { src: tmdbImg(ext.tmdb.person.profile, 'h632'), caption: p.stageName };
  const avatar = media.gallery.find((g) => g.avatar) || tmdbPhoto;

  const facts = [
    ['user', 'profile.realName', tx(p.realName)],
    ['cake', 'profile.birth', `${esc(formatDate(p.birthDate))} · ${esc(ui('profile.age', { age: age(p.birthDate) }))}`],
    ['pin', 'profile.birthplace', tx(p.birthplace)],
    ['ruler', 'profile.height', `${p.heightCm} cm`],
    ['drop', 'profile.blood', esc(p.bloodType)],
    ['brain', 'profile.mbti', esc(p.mbti)],
    ['building', 'profile.agency', tx(p.agency)],
    ['music', 'profile.group', `<a class="text-link" href="#/girlsday">${tx(p.group)}</a>`],
    ['mic', 'profile.position', tx(p.position)],
    ['heart', 'profile.fandom', tx(p.fandom)],
    ['star', 'profile.debutSinger', `${esc(formatDate(p.debutSinger.date))}<br><span class="edu-note">${tx(p.debutSinger.work)}</span>`],
    ['film', 'profile.debutActor', `${esc(formatDate(p.debutActor.date))}<br><span class="edu-note">${tx(p.debutActor.work)}</span>`],
  ];

  return `
  <section class="page-hero">
    <div class="container">
      <span class="eyebrow reveal">${icon('user')} Profile</span>
      <h1 class="reveal"><span class="title-pop">${esc(ui('profile.title'))}</span></h1>
      <p class="reveal">${esc(ui('profile.sub'))}</p>
    </div>
  </section>

  <section class="section" style="padding-top:12px">
    <div class="container profile-layout">
      <aside class="card profile-card reveal">
        <div class="avatar">${avatar ? `<img src="${esc(avatar.src)}" alt="${tx(avatar.caption)}">` : '<span>H</span>'}</div>
        <h2 style="font-size:2rem;margin:0">${tx(p.stageName)}</h2>
        <p style="color:var(--muted);margin:0 0 14px">${tx(p.realName)}</p>
        <div class="chips" style="justify-content:center">
          <a class="chip chip-pink chip-link" href="#/girlsday">${tx(p.group)} ${icon('arrowRight')}</a>
          <span class="chip">${esc(p.mbti)}</span>
          <span class="chip">${p.heightCm} cm</span>
        </div>
      </aside>

      <div>
        <div class="facts">
          ${facts.map(([ic, label, value], i) => `
            <div class="card fact reveal" style="--d:${(i % 4) * 0.05}s">
              <div class="fact-icon">${icon(ic)}</div>
              <div><div class="fact-label">${esc(ui(label))}</div><div class="fact-value">${value}</div></div>
            </div>`).join('')}
        </div>

        <div class="grid grid-2" style="margin-top:22px">
          <div class="card reveal">
            <h3>${icon('school').replace('<svg', '<svg width="22" height="22" style="display:inline;vertical-align:-4px;color:var(--accent)"')} ${esc(ui('profile.education'))}</h3>
            <ul class="list-clean edu-list">
              ${p.education.map((e) => `<li><div style="font-weight:700">${tx(e.name)}</div><div class="edu-note">${tx(e.note)}</div></li>`).join('')}
            </ul>
          </div>
          <div class="card reveal" style="--d:.1s">
            <h3>${icon('users').replace('<svg', '<svg width="22" height="22" style="display:inline;vertical-align:-4px;color:var(--accent)"')} ${esc(ui('profile.family'))}</h3>
            <p style="color:var(--ink-2)">${tx(p.family)}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">${icon('smile')} Nicknames</span>
        <h2 class="section-title">${esc(ui('profile.nicknames'))}</h2>
      </div>
      <div class="nick-grid">
        ${p.nicknames.map((n, i) => `
          <div class="card hover nick-card reveal" style="--d:${(i % 3) * 0.06}s">
            <div class="nick-name">${tx(n.name)}</div>
            <p class="nick-desc">${tx(n.desc)}</p>
          </div>`).join('')}
      </div>
    </div>
  </section>`;
}
