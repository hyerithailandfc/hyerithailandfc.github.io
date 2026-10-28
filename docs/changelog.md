# Changelog

Newest first. Claude adds an entry for every change it makes.

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
