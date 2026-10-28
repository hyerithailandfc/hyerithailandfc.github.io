# Changelog

Newest first. Claude adds an entry for every change it makes.

## 2026-10-28 — Admin: edit deep dives and Girl's Day
- Admin "แก้ไขข้อความ" can now open `data/stories.json` and `data/girlsday.json`.
- "+ เพิ่มรายการ" on an empty list (e.g. a new story's `body[]`) now adds a TH/EN/KR item instead of a plain text field.
- Empty `…Id` fields (`youtubeId`, `tmdbId`) are saved as `null`; list rows show `date` when there is no `year`.

## 2026-10-28 — Polish: wording, links, nicknames, duplicates
- Cute caption under the D-day counters; every em dash in site text replaced with ": " (TMDB synopses too, at sync time).
- "บ้านเบส" → "บ้านแฟนคลับ" everywhere; footer heart removed.
- Home highlight cards open `#/journey?item=<n>` and scroll to / flash that timeline entry.
- Nicknames: origins re-checked against namu.wiki footnotes (Hyericles, Ppori, Power Celebrity, Kobong-i, Coke-das, Hyermione);
  5 with no documented origin are marked `unknown` instead of guessed. Home chips link to `#/profile?section=nicknames` and show the origin on hover.
- Nickname marquee repeats 4× so there is no empty gap on wide screens.
- Hidden a duplicate TMDB profile photo via `external.tmdbImageIgnore`.

## 2026-10-28 — Deep dives + photos from her works
- Journey page: new "Deep dives" section (`data/stories.json`) — 7 expandable topics summarized in TH/EN/KR from namu.wiki sub-pages
  (Real Men, Amazing Saturday, YouTube, fan meetings, ads & magazines, persona, trivia), each linking to the original.
- TMDB sync saves up to 4 text-free stills per work; the Media gallery is split into "Hyeri" and "From her works".

## 2026-10-28 — Brand text clean-up
- Hero chip shows only the fan base name (no "บ้านเบส" / "Thai fan base" prefix); hero intro no longer uses an em dash (TH/EN/KR).
- Removed the ♡ from the browser tab title and the header logo (admin too). The footer heart stays.
- tools/serve.ps1 no longer crashes when the browser drops a connection.

## 2026-10-28 — #1 Profile: Girl's Day chip and Group fact link to #/girlsday
- `profile.js`: the "Girl's Day" chip and the "Group" fact value are now links to `#/girlsday` (all 3 languages, text comes from `profile.json`).
- `main.css`: new reusable `a.chip-link` (small lift + arrow nudge on hover) and `.text-link` (accent text, underline on hover) with focus-visible ring.

## 2026-10-28 — First live sync reviewed
- Pinned the 5 MV YouTube ids (all verified official uploads); C-Clown song title corrected to "Shaking Heart".
- Added `external.tmdbIgnore` (6 reviewed TMDB credits: variety/YouTube appearances, Chinese duplicate of Reply 1988, a wrong 2007 credit).
  "Treat Her with Caution (그녀는, 취급주의)" left visible — not yet confirmed by namu.wiki.

## 2026-10-28 — Girl's Day page, compact mobile logo, TMDB verified
- New page `#/girlsday` (`data/girlsday.json`): intro, 4 members, 20 releases with 19 playable official MVs, album/single filter, "before Hyeri" tags.
  YouTube sync now also fetches view counts for these MVs (`mvTargets()` in tools/lib/external.mjs).
- Header: compact two-line logo on phones ≤420px (mark only ≤340px); nav switches to the drawer below 1040px (8 items).
- TMDB key verified: person id 1413827 pinned; all 18 dramas/films match. English titles fixed from TMDB: "My Punch-Drunk Boxer", "Night Fever".
- Works: official Thai titles from TMDB shown in Thai mode; MV tab links to the Girl's Day page.

## 2026-10-28 — Fan base name "Hyeri Thailand FC"
- Added `brand.name` to `data/site.json`; header logo now reads HYERI / THAILAND FC; tab titles, footer and admin use the name.
- `ui()` fills `{brand}` in any UI string; home hero has a "บ้านเบส Hyeri Thailand FC" chip; About/footer texts now describe a Thai fan base (TH/EN/KR).

## 2026-10-28 — Blue theme, Thai/light defaults, TMDB + YouTube
- Theme switched from pastel pink to pastel blue (tokens `--blue`, `--aqua`, `--periwinkle`); dark mode is now opt-in only.
- Default language Thai, default theme light.
- New weekly sync (`tools/sync-external.mjs`): TMDB posters, synopses, ratings, photos; YouTube MV matches, channel stats, latest uploads.
- Works: poster cards + detail modal; MV tab plays videos. Media: channel card, latest uploads, TMDB photos. Admin: sync status/button, unmatched TMDB credits, MV matches.

## 2026-10-28 — Initial site
- Built the static site: Home, Profile, Journey, Works, Awards, Media, About in TH / EN / KR.
- Data sourced from the Korean namu.wiki article (last modified 2026-10-04), rewritten and translated.
- Admin panel: GitHub-token login, content editor, namu.wiki refresh requests, Claude requests, photo/video manager.
- Claude GitHub Action + validator workflow; project rules in CLAUDE.md and docs/.
