// App shell: language, theme, header/footer, hash router.
// Pages are registered in data/site.json → "pages" and live in assets/js/pages/<module>.
import { state, LANGS, LANG_LABEL, loadJSON, t, ui, esc, icon, reveal, brandName } from './core.js';

const $ = (sel) => document.querySelector(sel);
const store = {
  get(k) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

let current = null; // { page, mod }

// Default language is Thai; a ?lang= link or the visitor's own earlier choice wins (docs/decisions.md D-9).
function pickLang() {
  const fromUrl = new URLSearchParams(location.search).get('lang');
  if (LANGS.includes(fromUrl)) return fromUrl;
  const saved = store.get('hyeri.lang');
  if (LANGS.includes(saved)) return saved;
  return 'th';
}

async function setLang(lang, rerender = true) {
  state.lang = lang;
  state.strings = await loadJSON(`data/i18n/${lang}.json`);
  document.documentElement.lang = lang;
  store.set('hyeri.lang', lang);
  if (rerender && new URLSearchParams(location.search).has('lang')) {
    history.replaceState(null, '', location.pathname + location.hash); // manual choice beats ?lang= link
  }
  renderChrome();
  if (rerender) route();
}

/* ---------- Theme ---------- */
// Light by default; dark only when the visitor picks it with the toggle (docs/decisions.md D-11).
function applyTheme(mode) {
  document.documentElement.dataset.theme = mode === 'dark' ? 'dark' : 'light';
  const btn = $('#theme-toggle');
  btn.innerHTML = icon(mode === 'dark' ? 'sun' : 'moon');
  btn.setAttribute('aria-label', ui('common.toggleTheme'));
}

/* ---------- Header / footer ---------- */
function navPages() {
  return state.site.pages.filter((p) => p.nav !== false);
}

/** Logo text: first word large, the rest as a small second line ("HYERI" / "THAILAND FC"). */
function renderLogo() {
  const [first, ...rest] = brandName().split(' ');
  $('#logo').setAttribute('aria-label', brandName());
  $('#logo .logo-text').innerHTML = `${esc(first.toUpperCase())}${rest.length ? `<small class="logo-sub">${esc(rest.join(' ').toUpperCase())}</small>` : ''}`;
}

function renderChrome() {
  renderLogo();
  const links = navPages().map((p) => `<a class="nav-link" href="#${p.path}" data-path="${p.path}">${esc(t(p.label))}</a>`).join('');
  $('#main-nav').innerHTML = links;
  $('#drawer-nav').innerHTML = navPages().map((p, i) => `<a class="nav-link" style="animation-delay:${i * 50}ms" href="#${p.path}" data-path="${p.path}">${esc(t(p.label))}</a>`).join('');

  $('#lang-switch').innerHTML = LANGS.map((l) =>
    `<button class="lang-btn" type="button" data-lang="${l}" aria-pressed="${l === state.lang}" lang="${l}">${LANG_LABEL[l]}</button>`).join('');

  $('#menu-toggle').innerHTML = icon('menu');
  $('#menu-toggle').setAttribute('aria-label', ui('common.menu'));
  $('#to-top').innerHTML = icon('arrowUp');
  $('#to-top').setAttribute('aria-label', ui('common.backToTop'));
  $('.skip-link').textContent = ui('common.skip');
  applyTheme(document.documentElement.dataset.theme);

  const s = state.site;
  const year = new Date().getFullYear();
  $('#site-footer').innerHTML = `
    <div class="container footer-inner">
      <div>
        <div class="footer-brand">${esc(brandName())} <span class="logo-heart">♡</span></div>
        <p class="footer-small" style="margin-bottom:.4em">${esc(ui('footer.fansite'))}</p>
        <p class="footer-small">${esc(ui('footer.disclaimer'))}</p>
        <p class="footer-small">${esc(ui('footer.source'))} <a href="${esc(s.source.url)}" target="_blank" rel="noopener">${esc(s.source.name)}</a> · ${esc(s.source.license)} · ${esc(ui('footer.synced'))} ${esc(s.source.lastSynced)}</p>
        <p class="footer-small">${esc(ui('footer.tmdb'))} <a href="https://www.themoviedb.org/" target="_blank" rel="noopener">themoviedb.org</a></p>
        <p class="footer-small">© ${year} ${esc(ui('footer.madeBy'))}</p>
      </div>
      <div class="footer-links">
        ${navPages().map((p) => `<a href="#${p.path}">${esc(t(p.label))}</a>`).join('')}
        <a href="admin/" rel="nofollow">${icon('lock', 'inline-icon').replace('<svg', '<svg width="14" height="14" style="display:inline;vertical-align:-2px"')} ${esc(ui('footer.admin'))}</a>
      </div>
    </div>`;
  highlightNav();
}

function highlightNav() {
  const path = currentPath();
  document.querySelectorAll('.nav-link').forEach((a) => {
    const on = a.dataset.path === path;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

/* ---------- Drawer ---------- */
function toggleDrawer(open) {
  const d = $('#drawer');
  const btn = $('#menu-toggle');
  if (open) {
    d.hidden = false;
    requestAnimationFrame(() => d.classList.add('open'));
    btn.innerHTML = icon('close');
  } else {
    d.classList.remove('open');
    btn.innerHTML = icon('menu');
    setTimeout(() => { if (!d.classList.contains('open')) d.hidden = true; }, 400);
  }
  btn.setAttribute('aria-expanded', String(open));
}

/* ---------- Router ---------- */
function currentPath() {
  const p = (location.hash.replace(/^#/, '').split('?')[0]) || '/';
  return p.startsWith('/') ? p : '/' + p;
}

async function route() {
  const path = currentPath();
  const page = state.site.pages.find((p) => p.path === path);
  const main = $('#main');
  highlightNav();
  toggleDrawer(false);

  if (current?.mod?.unmount) { try { current.mod.unmount(); } catch { /* ignore */ } }

  if (!page) {
    current = null;
    main.innerHTML = `<section class="section"><div class="container empty">${icon('heart')}<h1>404</h1><p>${esc(ui('common.notFound'))}</p><a class="btn btn-primary" href="#/">${esc(ui('common.goHome'))}</a></div></section>`;
    return;
  }

  try {
    const mod = await import(`./pages/${page.module}`);
    const ctx = { site: state.site, page };
    const html = await mod.render(ctx);
    if (currentPath() !== path) return; // user navigated away while loading
    main.classList.remove('page-enter');
    main.innerHTML = html;
    void main.offsetWidth;
    main.classList.add('page-enter');
    current = { page, mod };
    document.title = page.path === '/' ? `${brandName()} ♡` : `${t(page.label)} · ${brandName()}`;
    mod.mount?.(main, ctx);
    reveal(main);
  } catch (err) {
    console.error(err);
    main.innerHTML = `<section class="section"><div class="container empty">${icon('info')}<p>${esc(ui('common.error'))}</p><button class="btn btn-ghost" type="button" onclick="location.reload()">${esc(ui('common.retry'))}</button></div></section>`;
  }
}

/* ---------- Boot ---------- */
async function boot() {
  applyTheme(store.get('hyeri.theme') || 'light');
  const [site, fallback] = await Promise.all([loadJSON('data/site.json'), loadJSON('data/i18n/en.json')]);
  state.site = site;
  state.fallback = fallback;
  await setLang(pickLang(), false);

  window.addEventListener('hashchange', () => {
    const prev = current?.page?.path;
    route().then(() => { if (prev !== currentPath()) window.scrollTo({ top: 0, behavior: 'instant' }); });
  });

  document.addEventListener('click', (e) => {
    const langBtn = e.target.closest('[data-lang]');
    if (langBtn) setLang(langBtn.dataset.lang);
    if (e.target.closest('[data-close]')) toggleDrawer(false);
  });
  $('#menu-toggle').addEventListener('click', () => toggleDrawer($('#drawer').hidden));
  $('#theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    store.set('hyeri.theme', next);
    applyTheme(next);
  });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') toggleDrawer(false); });
  $('#to-top').addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  const header = $('#site-header');
  const toTop = $('#to-top');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 8);
    toTop.classList.toggle('show', y > 600);
  }, { passive: true });

  await route();
}

boot().catch((err) => {
  console.error(err);
  $('#main').innerHTML = '<div class="container empty"><p>Could not load the site. Please refresh.</p></div>';
});
