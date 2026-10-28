import { loadJSON, tx, ui, esc, icon } from '../core.js';

export async function render() {
  const { items } = await loadJSON('data/journey.json');
  return `
  <section class="page-hero">
    <div class="container">
      <span class="eyebrow reveal">${icon('sparkle')} Journey</span>
      <h1 class="reveal"><span class="title-pop">${esc(ui('journey.title'))}</span></h1>
      <p class="reveal">${esc(ui('journey.sub'))}</p>
    </div>
  </section>
  <section class="section" style="padding-top:20px">
    <div class="container">
      <ol class="timeline list-clean">
        ${items.map((it) => `
          <li class="tl-item reveal">
            <span class="tl-dot" aria-hidden="true"></span>
            <span class="tl-year">${it.yearLabel ? tx(it.yearLabel) : esc(it.year)}</span>
            <article class="card hover tl-card">
              <h3>${tx(it.title)}</h3>
              <p>${tx(it.body)}</p>
              ${it.tags?.length ? `<div class="chips">${it.tags.map((tg) => `<span class="chip chip-pink">${tx(tg)}</span>`).join('')}</div>` : ''}
            </article>
          </li>`).join('')}
      </ol>
    </div>
  </section>`;
}
