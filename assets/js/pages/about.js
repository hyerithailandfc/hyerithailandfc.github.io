import { ui, esc, icon, formatDate } from '../core.js';

export async function render({ site }) {
  const s = site.source;
  const block = (key, ic) => `
    <div class="card reveal" style="margin-bottom:16px">
      <h2 style="margin-top:0;font-size:1.3rem">${icon(ic).replace('<svg', '<svg width="22" height="22" style="display:inline;vertical-align:-4px;color:var(--accent)"')} ${esc(ui(`about.${key}Title`))}</h2>
      <p style="margin:0;color:var(--ink-2)">${esc(ui(`about.${key}`))}</p>
    </div>`;

  return `
  <section class="page-hero">
    <div class="container">
      <span class="eyebrow reveal">${icon('info')} About</span>
      <h1 class="reveal"><span class="title-pop">${esc(ui('about.title'))}</span></h1>
      <p class="reveal">${esc(ui('about.sub'))}</p>
    </div>
  </section>
  <section class="section" style="padding-top:12px">
    <div class="container prose">
      ${block('what', 'heart')}
      ${block('source', 'link')}
      <div class="note-box reveal" style="margin:-4px 0 16px">
        <a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a> ·
        <a href="${esc(s.licenseUrl)}" target="_blank" rel="noopener">${esc(s.license)}</a><br>
        <span class="edu-note">${esc(ui('about.sourceModified'))}: ${esc(formatDate(s.sourceLastModified))} · ${esc(ui('about.lastSynced'))}: ${esc(formatDate(s.lastSynced))}</span>
      </div>
      ${block('images', 'image')}
      ${block('external', 'film')}
      ${block('update', 'sparkle')}
    </div>
  </section>`;
}
