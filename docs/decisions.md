# Decisions (why things are the way they are)

Short records of choices already made with the site owner. Don't reverse one without the admin asking.
Add new entries at the bottom: `D-<n> (YYYY-MM-DD): decision — reason`.

- **D-1 (2026-10-28): Host on GitHub Pages, no build step.** Free, global CDN, no server to rent. Plain ES modules
  mean Claude and the admin can edit any file directly and the change is live after Pages redeploys (~1 min).
- **D-2 (2026-10-28): Hash routing (`#/works`).** GitHub Pages has no server-side rewrites; hash routes always work and can be shared.
- **D-3 (2026-10-28): No automatic scraping of namu.wiki.** namu.wiki returns 403 to bots and protects itself against crawlers.
  "Refresh" = admin pastes changed text → Claude restructures and translates it → PR → admin publishes.
- **D-4 (2026-10-28): Content is rewritten, not copied.** en.namu.wiki is machine-translated and inaccurate (wrong pronouns, garbled titles).
  We summarize from the Korean original in our own words and keep official English titles. License CC BY-NC-SA 2.0 KR applies.
- **D-5 (2026-10-28, updated 2026-10-28): Images only from admin uploads or TMDB.** namu.wiki images belong to many rights holders — never use them.
  Admins upload photos they may share (resized to WebP ≤1600px). Posters, backdrops and profile photos are **hotlinked** from
  image.tmdb.org via the synced data (allowed by the TMDB API terms with attribution) — never copied into the repo.
  Videos are embeds of YouTube uploads (youtube-nocookie).
- **D-6 (2026-10-28): Admin auth = GitHub fine-grained token.** The admin page is public HTML but every write uses the visitor's own token
  via the GitHub API, so only repo owner/collaborators can change anything. No secrets are stored in the site.
- **D-7 (2026-10-28): Claude runs in GitHub Actions** (`anthropics/claude-code-action@v1`) with the owner's Claude subscription token
  (`CLAUDE_CODE_OAUTH_TOKEN`). It always works on a branch and opens a PR; nothing reaches the live site until the admin merges.
- **D-8 (2026-10-28, changed same day): Theme = pastel BLUE soft-pop** (sky blue / aqua / periwinkle on an icy-white background,
  rounded shapes, bouncy micro-motion). The owner first chose pink, then asked for blue — don't bring pink back as a main color.
  Dark mode is a "midnight blue" variant.
- **D-9 (2026-10-28, changed same day): Default language = Thai.** Overridden only by a `?lang=` link or the visitor's earlier choice
  (remembered per device). Browser language is NOT used.
- **D-10 (2026-10-28): Privacy of family.** Only list parents generically and the younger sister's name/birth year. No other private-person details.
- **D-11 (2026-10-28): Default theme = light.** The OS dark-mode setting is ignored; dark mode only via the header toggle (remembered per device).
- **D-12 (2026-10-28): TMDB + YouTube data via a weekly GitHub Action.** `tools/sync-external.mjs` reads API keys from repo secrets
  (`TMDB_API_KEY`, `YOUTUBE_API_KEY`) and writes `data/tmdb.json` + `data/youtube.json`. Keys never reach the browser.
  `works.json` stays the curated source of truth (facts, roles, Thai text); TMDB adds posters, synopses, ratings and photos;
  YouTube adds MV videos/views, channel stats and latest uploads. TMDB credits missing from works.json are shown to the admin, not auto-added.
- **D-13 (2026-10-28): Fan base name = "Hyeri Thailand FC"** (Thai: บ้านแฟนคลับ). Stored once in `data/site.json → brand.name`.
  Logo = "H" mark + first word large ("HYERI") + rest as a small second line ("THAILAND FC"). The site presents itself as a Thai fan base
  (not a generic fansite) in all three languages.
