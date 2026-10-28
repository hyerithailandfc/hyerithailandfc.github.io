# Content guide — data files, translation, sourcing

## Localized values
- A localized value is an object with any of `th`, `en`, `ko`: `{ "th": "…", "en": "…", "ko": "…" }`.
- **`en` and `ko` are required. `th` is required for sentences/descriptions**; for titles and proper nouns it may be omitted
  (the site falls back to English). `tools/validate.mjs` enforces this.
- UI strings (buttons, headings, labels) go in `data/i18n/{th,en,ko}.json` — same keys in all three files. Use `ui('section.key')`.
  Write the fan base name as `{brand}` (e.g. `"บ้านเบส {brand}"`) — `ui()` fills it from `site.json → brand.name`.

## Translation style
- **Thai:** friendly fan voice, natural Thai (not word-for-word). Use Thai fan spellings: ฮเยริ, อี ฮเยริ, Girl's Day, ด็อกซอน.
  Character names: Thai transliteration (e.g. ซองด็อกซอน). Show titles: official English title.
- **English:** warm and concise. Use official English titles (Reply 1988, Moonshine, Friendly Rivalry, Agents of Mystery…)
  and Revised Romanization with hyphen for people (Lee Hye-ri, Sung Deok-sun).
- **Korean:** neutral, encyclopedic-but-warm. Use the original Korean titles (《응답하라 1988》).
- Always refer to Hyeri as **she/her** (the machine-translated en.namu.wiki often says "he" — that's wrong).
- Keep it positive and factual. Skip controversies/rumors unless the admin explicitly asks; never include private info about non-celebrities.

## Sourcing
- Source of truth: Korean namu.wiki article <https://namu.wiki/w/혜리> — text pasted by the admin in the request issue.
- Summarize in our own words; don't paste long passages. Short factual lists (titles, years, roles, award names) are fine.
- When you update data from a refresh request, also set `data/site.json → source.sourceLastModified` to the date in the issue,
  and `source.lastSynced` to today's date.

## Schemas
`data/site.json`
```json
{ "source": { "name", "url", "license", "licenseUrl", "sourceLastModified": "YYYY-MM-DD", "lastSynced": "YYYY-MM-DD" },
  "pages": [ { "id": "works", "path": "/works", "module": "works.js", "label": {th,en,ko}, "nav": true } ] }
```
`nav: false` hides a page from the menu but keeps its route.

`data/profile.json` — single object: `stageName`, `realName`, `birthDate`, `birthplace`, `heightCm`, `bloodType`, `mbti`, `agency`,
`group`, `position`, `fandom`, `debutSinger {date, work}`, `debutActor {date, work}`, `education[] {name, note}`, `family`, `nicknames[] {name, desc}`.

`data/journey.json` — `items[]`: `year` (string), optional `yearLabel` (localized, replaces year), `title`, `body`, `tags[]` (localized),
optional `highlight: true` (shown on the home page "Signature moments"). Keep chronological order (oldest first).

`data/works.json`
- `drama[]`: `year` (number), `network`, `title {en,ko}`, `role {th,en,ko}`, `type` (`lead|support|cameo|special`), `rating` (peak %, number or `null`)
- `movie[]`: `year`, `title`, `role`, `type`
- `variety[]`: `year` (string, ranges like "2018–2020"), `title`, `kind` (`guest|regular|narration|surprise|voice|call`), optional `ep`
- `hosting[]`: `year`, `title`, `kind` (`main|special`), optional `cohosts {en,ko}`
- `mv[]`: `year`, `artist`, `song`
Keep each list in chronological order (oldest first); the page shows newest first. New `type`/`kind` values need UI strings in `works.*`.

Optional pins (set them when automatic matching picks the wrong thing — the Admin dashboard shows what was matched):
- `drama[]` / `movie[]`: `"tmdbId": 64010` — the number in the TMDB URL (`themoviedb.org/tv/64010`).
- `mv[]`: `"youtubeId": "xxxxxxxxxxx"` — the 11 characters after `watch?v=`.
Matching keys come from `workKey()` in `assets/js/core.js`: `drama:<title.ko>`, `movie:<title.ko>`, `mv:<artist.en>|<song.en>`, `gd:<title.en>`.
**Changing those title fields changes the key** — the posters/MV reappear after the next sync.

## Generated files (don't hand-edit)
`data/tmdb.json` and `data/youtube.json` are rewritten by `tools/sync-external.mjs` (weekly, or "ดึงข้อมูลใหม่ตอนนี้" on the Admin page).
- `tmdb.json`: `person {id, name, profile, url, images[]}`, `works { <workKey>: {tmdbId, type, url, poster, backdrop, rating, votes, character, title{th,en,ko}, overview{th,en,ko}} }`, `unmatched[]` (TMDB credits not in works.json).
- `youtube.json`: `channel {id, title, handle, url, thumbnail, subscribers, videos, views}`, `latest[] {id, title, channel, publishedAt, views}`, `mv { <workKey>: {id, pinned, title, channel, publishedAt, views} }`.
Pages read them through `loadExternal()` and must still look complete when they are empty (before the first sync or without API keys).
Sync settings live in `data/site.json → external` (`tmdbPersonId`, `tmdbPersonQueries`, `youtubeChannelHandle`).

`data/awards.json` — `items[]`: `year` (number), `ceremony`, `category`, optional `work`.

`data/girlsday.json` — the group page (`#/girlsday`). Source: namu.wiki 걸스데이 article (discography + MV table).
- `debut`, `hyeriJoined` (dates), `fandom`, `agency`, `intro` (localized prose)
- `members[]`: `name`, `birthDate`, `position`, optional `isHyeri: true`
- `releases[]` (oldest first): `date`, `type` (`single|digital|mini|album|repackage|special|japan` — new types need `gd.type.*` strings),
  `album {en,ko}`, `title {en,ko}` (official English title per Wikipedia), `youtubeId` (official GIRL'S DAY channel upload, else 1theK; `null` if no MV),
  `withHyeri` (false for the two 2010 releases before she joined). YouTube view counts come from the sync (`workKey('gd', r)` = `gd:<title.en>`).

`data/media.json`
- `channels[]`: `type` (`instagram|youtube|x|weibo|web`), `name`, `handle`, `url` — official accounts only.
- `videos[]`: `id` (11-char YouTube id), `title`, optional `date`.
- `gallery[]`: `src` (`images/gallery/…webp`), `width`, `height`, `caption`, `credit`, optional `featured` (home hero), `avatar` (profile).

## JSON formatting
2-space indentation, UTF-8, trailing newline. The admin editor rewrites files in this format, so don't rely on custom alignment.
