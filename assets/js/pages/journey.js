import { loadJSON, tx, ui, esc, icon, routeQuery, scrollToEl } from '../core.js';

export async function render() {
  const [{ items }, stories] = await Promise.all([loadJSON('data/journey.json'), loadJSON('data/stories.json')]);
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
        ${items.map((it, idx) => `
          <li class="tl-item reveal" id="j-${idx}">
            <span class="tl-dot" aria-hidden="true"></span>
            <span class="tl-year">${it.yearLabel ? tx(it.yearLabel) : esc(it.year)}</span>
            <article class="card hover tl-card">
              <h3>${tx(it.title)}</h3>
              <p>${tx(it.body)}</p>
              ${it.more?.length ? `
                <details class="tl-more">
                  <summary><span class="tl-more-open">${esc(ui('journey.readMore'))}</span><span class="tl-more-close">${esc(ui('journey.readLess'))}</span> ${icon('arrowRight')}</summary>
                  <ul class="story-facts">${it.more.map((f) => `<li>${icon('sparkle')}<span>${tx(f)}</span></li>`).join('')}</ul>
                </details>` : ''}
              ${it.tags?.length ? `<div class="chips">${it.tags.map((tg) => `<span class="chip chip-pink">${tx(tg)}</span>`).join('')}</div>` : ''}
            </article>
          </li>`).join('')}
      </ol>
    </div>
  </section>

  <section class="section" id="deep-dives" style="padding-top:0">
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">${icon('star')} Deep dives</span>
        <h2 class="section-title">${esc(ui('journey.deepTitle'))}</h2>
        <p class="section-sub">${esc(ui('journey.deepSub'))}</p>
      </div>
      <div class="story-list">
        ${stories.items.map((s, i) => `
          <details class="card story reveal" style="--d:${(i % 3) * 0.05}s" ${i === 0 ? 'open' : ''}>
            <summary>
              <span class="story-icon g-${i % 4}">${icon(s.icon)}</span>
              <span class="story-head">
                <span class="story-title">${tx(s.title)}</span>
                <span class="story-teaser">${s.years ? `<b>${esc(s.years)}</b> · ` : ''}${tx(s.teaser)}</span>
              </span>
              <span class="story-toggle" aria-hidden="true">${icon('arrowRight')}</span>
            </summary>
            <div class="story-body">
              ${s.body.map((p) => `<p>${tx(p)}</p>`).join('')}
              ${s.facts?.length ? `
                <h4 class="story-facts-title">${esc(ui('journey.keyFacts'))}</h4>
                <ul class="story-facts">${s.facts.map((f) => `<li>${icon('sparkle')}<span>${tx(f)}</span></li>`).join('')}</ul>` : ''}
              <a class="btn btn-ghost btn-sm" href="${esc(s.source)}" target="_blank" rel="noopener">${esc(ui('journey.readSource'))} ${icon('link')}</a>
            </div>
          </details>`).join('')}
      </div>
    </div>
  </section>`;
}

/** #/journey?item=<index> (from the home page highlight cards) scrolls to that timeline entry and flashes it. */
export function mount(root) {
  const { item } = routeQuery();
  const target = item != null && root.querySelector(`#j-${CSS.escape(item)}`);
  if (!target) return;
  // Wait for the router's scroll-to-top after navigation, then jump to the entry.
  setTimeout(() => {
    target.classList.add('in');
    scrollToEl(target);
    target.querySelector('.tl-card')?.classList.add('flash');
  }, 120);
}
