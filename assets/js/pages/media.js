import { loadJSON, loadExternal, tmdbImg, t, tx, ui, esc, icon, formatDate, formatNumber } from '../core.js';

const SOCIAL_ICON = { instagram: 'instagram', youtube: 'youtube', x: 'x', weibo: 'weibo', web: 'globe' };
let photos = [];
let onKey;

export async function render() {
  const [media, ext] = await Promise.all([loadJSON('data/media.json'), loadExternal()]);
  const { channel } = ext.yt;

  // Admin-picked videos first, then the latest uploads from her channel (synced from YouTube).
  const seen = new Set(media.videos.map((v) => v.id));
  const videos = [
    ...media.videos,
    ...ext.yt.latest.filter((v) => !seen.has(v.id)).map((v) => ({ id: v.id, title: v.title, date: v.publishedAt?.slice(0, 10) })),
  ];

  // Group 1: admin uploads, then TMDB profile photos. Group 2: stills from her works (TMDB).
  const person = ext.tmdb.person;
  const portraits = [
    ...media.gallery,
    ...(person?.images || []).map((img) => ({
      src: tmdbImg(img.path, 'h632'), width: img.width, height: img.height, caption: person.name, credit: 'TMDB',
    })),
  ];
  const stills = Object.values(ext.tmdb.works).flatMap((w) => (w.stills || []).map((img) => ({
    src: tmdbImg(img.path, 'w780'), width: img.width, height: img.height, caption: w.title, credit: 'TMDB',
  })));
  photos = [...portraits, ...stills];
  const galleryHtml = (list, offset) => `<div class="gallery">${list.map((g, i) => `
    <button class="gallery-item reveal" type="button" data-img="${offset + i}" style="--d:${(i % 3) * 0.05}s">
      <img src="${esc(g.src)}" alt="${tx(g.caption)}" loading="lazy" ${g.width ? `width="${g.width}" height="${g.height}"` : ''}>
      <span class="gallery-cap">${tx(g.caption)}${g.credit ? ` · © ${esc(g.credit)}` : ''}</span>
    </button>`).join('')}</div>`;

  return `
  <section class="page-hero">
    <div class="container">
      <span class="eyebrow reveal">${icon('play')} Media</span>
      <h1 class="reveal"><span class="title-pop">${esc(ui('media.title'))}</span></h1>
      <p class="reveal">${esc(ui('media.sub'))}</p>
    </div>
  </section>

  <section class="section" style="padding-top:12px">
    <div class="container">
      ${channel ? `
      <a class="card hover channel-card reveal" href="${esc(channel.url)}" target="_blank" rel="noopener">
        ${channel.thumbnail ? `<img class="channel-avatar" src="${esc(channel.thumbnail)}" alt="" width="72" height="72">` : `<span class="social-icon si-youtube">${icon('youtube')}</span>`}
        <span class="channel-main">
          <span class="channel-name">${esc(channel.title)}</span>
          <span class="chips">
            ${channel.subscribers ? `<span class="chip chip-pink">${icon('users')} ${esc(ui('media.subscribers', { n: formatNumber(channel.subscribers) }))}</span>` : ''}
            <span class="chip">${icon('play')} ${esc(ui('media.channelVideos', { n: formatNumber(channel.videos) }))}</span>
          </span>
        </span>
        <span class="btn btn-primary btn-sm">${icon('youtube')} ${esc(ui('media.visitChannel'))}</span>
      </a>` : ''}

      <h2 class="reveal">${esc(ui('media.videos'))}</h2>
      ${videos.length ? `<div class="grid grid-3">${videos.map((v, i) => `
        <article class="card hover video-card reveal" style="--d:${(i % 3) * 0.06}s">
          <button class="yt" type="button" data-yt="${esc(v.id)}" aria-label="${esc(ui('media.play'))}: ${tx(v.title)}">
            <img src="https://i.ytimg.com/vi/${esc(v.id)}/hqdefault.jpg" alt="" loading="lazy">
            <span class="play">${icon('play')}</span>
          </button>
          <div class="video-meta"><h3>${tx(v.title)}</h3>${v.date ? `<div class="edu-note">${esc(formatDate(v.date))}</div>` : ''}</div>
        </article>`).join('')}</div>`
      : `<div class="card empty reveal">${icon('youtube')}<p>${esc(ui('media.noVideos'))}</p></div>`}
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <h2 class="reveal">${esc(ui('media.gallery'))}</h2>
      ${photos.length ? `
        ${portraits.length ? `<h3 class="gallery-group reveal">${icon('user')} ${esc(ui('media.galleryHyeri'))} <span class="count">${portraits.length}</span></h3>${galleryHtml(portraits, 0)}` : ''}
        ${stills.length ? `<h3 class="gallery-group reveal">${icon('film')} ${esc(ui('media.galleryWorks'))} <span class="count">${stills.length}</span></h3>${galleryHtml(stills, portraits.length)}` : ''}`
      : `<div class="card empty reveal">${icon('image')}<p>${esc(ui('media.noPhotos'))}</p></div>`}
    </div>
  </section>

  <section class="section" style="padding-top:0">
    <div class="container">
      <h2 class="reveal">${esc(ui('media.channels'))}</h2>
      <div class="social-grid">
        ${media.channels.map((c, i) => `
          <a class="card hover social reveal" style="--d:${(i % 4) * 0.05}s" href="${esc(c.url)}" target="_blank" rel="noopener">
            <span class="social-icon si-${esc(c.type)}">${icon(SOCIAL_ICON[c.type] || 'link')}</span>
            <span><span class="social-name">${esc(c.name)}</span><br><span class="social-handle">${esc(c.handle)}</span></span>
          </a>`).join('')}
      </div>
    </div>
  </section>`;
}

function openLightbox(i) {
  const g = photos[i];
  const box = document.createElement('div');
  box.className = 'lightbox';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.innerHTML = `<button class="icon-btn" type="button" aria-label="${esc(ui('common.close'))}">${icon('close')}</button>
    <figure style="margin:0"><img src="${esc(g.src)}" alt="${esc(t(g.caption))}"><figcaption class="lightbox-cap">${esc(t(g.caption))}${g.credit ? ` · © ${esc(g.credit)}` : ''}</figcaption></figure>`;
  const close = () => { box.remove(); document.removeEventListener('keydown', onKey); };
  onKey = (e) => { if (e.key === 'Escape') close(); };
  box.addEventListener('click', (e) => { if (e.target === box || e.target.closest('.icon-btn')) close(); });
  document.addEventListener('keydown', onKey);
  document.body.appendChild(box);
  box.querySelector('.icon-btn').focus();
}

export function mount(root) {
  root.addEventListener('click', (e) => {
    const yt = e.target.closest('[data-yt]');
    if (yt) {
      yt.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${encodeURIComponent(yt.dataset.yt)}?autoplay=1&rel=0" title="YouTube video" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      yt.removeAttribute('data-yt');
      return;
    }
    const img = e.target.closest('[data-img]');
    if (img) openLightbox(Number(img.dataset.img));
  });
}

export function unmount() {
  document.querySelector('.lightbox')?.remove();
  if (onKey) document.removeEventListener('keydown', onKey);
}
