// Sync posters/synopses from TMDB and MV/channel data from YouTube into data/tmdb.json and data/youtube.json.
// Run by .github/workflows/sync-external.yml (weekly + "ดึงข้อมูลใหม่" button on the Admin page).
// Env: TMDB_API_KEY (v3 key or v4 read token), YOUTUBE_API_KEY. A missing key skips that source.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmdbClient, ytClient, buildTmdb, buildYoutube, changed } from './lib/external.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => (existsSync(join(root, rel)) ? JSON.parse(readFileSync(join(root, rel), 'utf8')) : null);

function save(rel, data) {
  const prev = read(rel);
  if (!changed(prev, data)) { console.log(`${rel}: unchanged`); return; }
  writeFileSync(join(root, rel), JSON.stringify({ updatedAt: new Date().toISOString(), ...data }, null, 2) + '\n');
  console.log(`${rel}: updated`);
}

const works = read('data/works.json');
const config = read('data/site.json').external || {};
let failed = false;

if (process.env.TMDB_API_KEY) {
  try {
    const tmdb = tmdbClient(process.env.TMDB_API_KEY.trim());
    save('data/tmdb.json', await buildTmdb(tmdb, works, config, read('data/tmdb.json')));
  } catch (e) { console.error(`TMDB sync failed: ${e.message}`); failed = true; }
} else console.log('TMDB_API_KEY not set — skipping TMDB');

if (process.env.YOUTUBE_API_KEY) {
  try {
    const yt = ytClient(process.env.YOUTUBE_API_KEY.trim());
    save('data/youtube.json', await buildYoutube(yt, works, config));
  } catch (e) { console.error(`YouTube sync failed: ${e.message}`); failed = true; }
} else console.log('YOUTUBE_API_KEY not set — skipping YouTube');

process.exit(failed ? 1 : 0);
