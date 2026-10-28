import { loadJSON, tx, ui, esc, icon, countUp } from '../core.js';

export async function render() {
  const { items } = await loadJSON('data/awards.json');
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
            ${byYear.get(y).map((a, i) => `
              <article class="card hover award-card reveal" style="--d:${(i % 2) * 0.06}s">
                <div class="award-icon">${icon('trophy')}</div>
                <div>
                  <div class="award-cat">${tx(a.category)}</div>
                  <div class="award-cer">${tx(a.ceremony)}</div>
                  ${a.work ? `<div class="award-work">${tx(a.work)}</div>` : ''}
                </div>
              </article>`).join('')}
          </div>
        </div>`).join('')}
    </div>
  </section>`;
}

export function mount(root) {
  countUp(root);
}
