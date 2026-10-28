// Pure logic for syncing TMDB + YouTube data. No file system access, `fetch` is injected,
// so it can be tested in a browser with mocked responses.
import { workKey } from '../../assets/js/core.js';

const NON_SCRIPTED_TV = new Set([10763, 10764, 10767]); // TMDB genres: news, reality, talk

export const norm = (s) => String(s || '').toLowerCase().normalize('NFKC').replace(/[\s\p{P}\p{S}]/gu, '');
const yearOf = (c) => Number((c.release_date || c.first_air_date || '').slice(0, 4)) || 0;
const nameOf = (d = {}) => d.title || d.name || '';

/* ---------------- TMDB ---------------- */

/** Accepts a v3 API key or a v4 read-access token (starts with "eyJ"). */
export function tmdbClient(key, fetchImpl = fetch) {
  const bearer = key.startsWith('eyJ');
  return async (path, params = {}) => {
    const url = new URL(`https://api.themoviedb.org/3${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    if (!bearer) url.searchParams.set('api_key', key);
    const res = await fetchImpl(url, { headers: bearer ? { Authorization: `Bearer ${key}` } : {} });
    if (!res.ok) throw new Error(`TMDB ${path}: HTTP ${res.status}`);
    return res.json();
  };
}

/** Find Hyeri's TMDB person id: the search result whose "known for" titles overlap most with works.json. */
export async function findPerson(tmdb, queries, works) {
  const titles = new Set([...works.drama, ...works.movie].flatMap((w) => [norm(w.title.ko), norm(w.title.en)]));
  let best = null;
  for (const query of queries) {
    const res = await tmdb('/search/person', { query });
    for (const p of res.results || []) {
      const score = (p.known_for || []).filter((k) =>
        titles.has(norm(k.original_title || k.original_name)) || titles.has(norm(nameOf(k)))).length;
      if (!best || score > best.score || (score === best.score && p.popularity > best.person.popularity)) {
        best = { person: p, score };
      }
    }
  }
  return best && best.score > 0 ? best.person.id : null;
}

/** Match a works.json entry to a TMDB credit: pinned `tmdbId` first, else Korean original title, else English title. */
export function matchCredit(kind, w, cast) {
  const type = kind === 'movie' ? 'movie' : 'tv';
  if (w.tmdbId) return cast.find((c) => c.id === w.tmdbId && c.media_type === type) || { id: w.tmdbId, media_type: type, pinned: true };
  const ko = norm(w.title.ko);
  const en = norm(w.title.en);
  const found = cast.filter((c) => c.media_type === type
    && (norm(c.original_title || c.original_name) === ko || norm(nameOf(c)) === en));
  return found.sort((a, b) => Math.abs(yearOf(a) - w.year) - Math.abs(yearOf(b) - w.year))[0] || null;
}

function pickTranslation(translations, lang) {
  const list = (translations || []).filter((t) => t.iso_639_1 === lang);
  return (list.find((t) => ['TH', 'US', 'KR'].includes(t.iso_3166_1)) || list[0])?.data || {};
}

export async function buildTmdb(tmdb, works, config, previous, log = console.log) {
  let personId = config.tmdbPersonId || previous?.person?.id || null;
  if (!personId) {
    personId = await findPerson(tmdb, config.tmdbPersonQueries || ['Lee Hye-ri', 'Hyeri'], works);
    if (!personId) throw new Error('Could not find Hyeri on TMDB. Set data/site.json → external.tmdbPersonId.');
    log(`TMDB: found person id ${personId} (pin it in site.json → external.tmdbPersonId to skip the search)`);
  }

  const [person, credits, images] = await Promise.all([
    tmdb(`/person/${personId}`, { language: 'en-US' }),
    tmdb(`/person/${personId}/combined_credits`, { language: 'en-US' }),
    tmdb(`/person/${personId}/images`),
  ]);
  const cast = credits.cast || [];
  const out = {
    person: {
      id: personId,
      name: person.name,
      profile: person.profile_path || null,
      url: `https://www.themoviedb.org/person/${personId}`,
      images: (images.profiles || [])
        .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
        .slice(0, 12)
        .map((i) => ({ path: i.file_path, width: i.width, height: i.height })),
    },
    works: {},
    unmatched: [],
  };

  const matched = new Set();
  for (const kind of ['drama', 'movie']) {
    for (const w of works[kind] || []) {
      const c = matchCredit(kind, w, cast);
      if (!c) { log(`TMDB: no match for ${kind} "${w.title.en}" (add "tmdbId" to pin it)`); continue; }
      matched.add(`${c.media_type}:${c.id}`);
      const [tr, detail, imgs] = await Promise.all([
        tmdb(`/${c.media_type}/${c.id}/translations`),
        c.pinned ? tmdb(`/${c.media_type}/${c.id}`, { language: 'en-US' }) : Promise.resolve(c),
        tmdb(`/${c.media_type}/${c.id}/images`, { include_image_language: 'null' }).catch(() => ({})),
      ]);
      const th = pickTranslation(tr.translations, 'th');
      const en = pickTranslation(tr.translations, 'en');
      const ko = pickTranslation(tr.translations, 'ko');
      out.works[workKey(kind, w)] = {
        tmdbId: c.id,
        type: c.media_type,
        url: `https://www.themoviedb.org/${c.media_type}/${c.id}`,
        poster: detail.poster_path || null,
        backdrop: detail.backdrop_path || null,
        rating: detail.vote_count ? Math.round(detail.vote_average * 10) / 10 : null,
        votes: detail.vote_count || 0,
        character: c.character || null,
        title: { th: nameOf(th), en: nameOf(en) || nameOf(detail), ko: nameOf(ko) },
        overview: { th: th.overview || '', en: en.overview || detail.overview || '', ko: ko.overview || '' },
        // Up to 4 text-free stills/backdrops for the Media gallery ("From her works").
        stills: (imgs.backdrops || [])
          .filter((b) => !b.iso_639_1)
          .sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
          .slice(0, 4)
          .map((b) => ({ path: b.file_path, width: b.width, height: b.height })),
      };
    }
  }

  const ignore = new Set(config.tmdbIgnore || []); // credits the admin reviewed and decided not to add
  out.unmatched = cast
    .filter((c) => !matched.has(`${c.media_type}:${c.id}`) && !ignore.has(c.id))
    .filter((c) => c.media_type === 'movie' || !(c.genre_ids || []).some((g) => NON_SCRIPTED_TV.has(g)))
    .map((c) => ({
      tmdbId: c.id, type: c.media_type, title: nameOf(c), original: c.original_title || c.original_name || '',
      year: yearOf(c) || null, character: c.character || null, poster: c.poster_path || null,
    }))
    .sort((a, b) => (b.year || 0) - (a.year || 0));
  return out;
}

/* ---------------- YouTube ---------------- */

export function ytClient(key, fetchImpl = fetch) {
  return async (path, params = {}) => {
    const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
    Object.entries({ ...params, key }).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetchImpl(url);
    if (!res.ok) throw new Error(`YouTube ${path}: HTTP ${res.status}`);
    return res.json();
  };
}

/**
 * Every music video the site shows: MVs she appeared in (works.json → mv) and Girl's Day title tracks (girlsday.json).
 * Returns [{ key, youtubeId?, query }]; entries without youtubeId are searched on YouTube.
 */
export function mvTargets(works, girlsday) {
  return [
    ...(works?.mv || []).map((m) => ({ key: workKey('mv', m), youtubeId: m.youtubeId, query: `${m.artist.ko} ${m.song.ko} MV` })),
    ...(girlsday?.releases || []).filter((r) => r.youtubeId).map((r) => ({ key: workKey('gd', r), youtubeId: r.youtubeId })),
  ];
}

/**
 * Quota per run (free tier = 10,000 units/day): 1 channel + 1 playlist + 100 per un-pinned MV search + 1 per 50 videos.
 * Pin an MV with "youtubeId" to skip its search. `targets` comes from mvTargets().
 */
export async function buildYoutube(yt, targets, config, log = console.log) {
  const out = { channel: null, latest: [], mv: {} };
  let latestIds = [];

  const handle = config.youtubeChannelHandle;
  if (handle) {
    const ch = (await yt('channels', { part: 'snippet,statistics,contentDetails', forHandle: handle.replace(/^@/, '') })).items?.[0];
    if (!ch) log(`YouTube: channel ${handle} not found`);
    else {
      out.channel = {
        id: ch.id,
        title: ch.snippet.title,
        handle,
        url: `https://www.youtube.com/${handle.startsWith('@') ? handle : '@' + handle}`,
        thumbnail: ch.snippet.thumbnails?.medium?.url || ch.snippet.thumbnails?.default?.url || null,
        subscribers: ch.statistics.hiddenSubscriberCount ? null : Number(ch.statistics.subscriberCount) || null,
        videos: Number(ch.statistics.videoCount) || 0,
        views: Number(ch.statistics.viewCount) || 0,
      };
      const pl = await yt('playlistItems', { part: 'contentDetails', playlistId: ch.contentDetails.relatedPlaylists.uploads, maxResults: 12 });
      latestIds = (pl.items || []).map((i) => i.contentDetails.videoId);
    }
  }

  const mvIds = {};
  for (const { key, youtubeId, query } of targets) {
    if (youtubeId) { mvIds[key] = { id: youtubeId, pinned: true }; continue; }
    if (!query) continue;
    const r = await yt('search', { part: 'snippet', type: 'video', videoEmbeddable: 'true', maxResults: 1, q: query });
    const id = r.items?.[0]?.id?.videoId;
    if (id) mvIds[key] = { id, pinned: false };
    else log(`YouTube: no result for "${query}"`);
  }

  const ids = [...new Set([...latestIds, ...Object.values(mvIds).map((v) => v.id)])];
  const details = {};
  for (let i = 0; i < ids.length; i += 50) {
    const r = await yt('videos', { part: 'snippet,statistics', id: ids.slice(i, i + 50).join(',') });
    for (const v of r.items || []) {
      details[v.id] = {
        title: v.snippet.title,
        channel: v.snippet.channelTitle,
        publishedAt: v.snippet.publishedAt,
        views: Number(v.statistics?.viewCount) || null,
      };
    }
  }
  out.latest = latestIds.filter((id) => details[id]).map((id) => ({ id, ...details[id] }));
  for (const [key, v] of Object.entries(mvIds)) {
    if (details[v.id]) out.mv[key] = { id: v.id, pinned: v.pinned, ...details[v.id] };
  }
  return out;
}

/** True when two synced payloads differ, ignoring the timestamp. */
export function changed(prev, next) {
  const strip = (o) => JSON.stringify({ ...(o || {}), updatedAt: null });
  return strip(prev) !== strip(next);
}
