# Design system — "Pastel blue soft-pop"

Mood: bright, fresh, playful, a little bubbly — like Hyeri on Amazing Saturday — in clear-sky blues, always clean and readable.
Light theme is the default; dark ("midnight blue") is opt-in via the header toggle.
All styles live in `assets/css/main.css`. Admin-only styles live in `admin/admin.css`.

## Tokens (use these, never raw hex in new CSS)
| Token | Use |
|---|---|
| `--bg`, `--bg-2` | Page background (icy white-blue) |
| `--surface`, `--surface-2` | Cards, inputs |
| `--ink`, `--ink-2`, `--muted` | Text: primary (navy) / secondary / tertiary |
| `--line` | Borders, dividers |
| `--blue`, `--aqua`, `--sky`, `--periwinkle` | Main decorative pastels (fills, dots, blobs, rings) — **not** for body text |
| `--lilac`, `--mint`, `--butter` | Secondary accents used sparingly (tags, sparkles, 1 highlight card) |
| `--accent` | Text-safe blue for links, active states, labels (#2563C9 light / #8EC5FF dark) |
| `--accent-soft` | Tinted backgrounds behind accent text (chips, active nav) |
| `--grad-pop` (blue→aqua), `--grad-dream` (periwinkle→blue), `--grad-fresh`, `--grad-hero` | Gradients for buttons, headings, highlights |
| `--glow` | Colored shadow under primary buttons / selected tabs |
| `--radius-sm/--radius/--radius-lg/--radius-pill` | 12 / 20 / 32 / pill |
| `--shadow-sm/--shadow/--shadow-lg` | Soft blue-tinted shadows |
| `--ease-pop` (bouncy), `--ease-out` (smooth) | Motion curves |
| `--font-display`, `--font-body` | Switch automatically per language via `:lang()` |

Dark mode redefines the same tokens in `:root[data-theme="dark"]` (set only by the toggle — there is no OS-based auto mode).
If you add a token, add it to **both** light and dark blocks.

## Typography
- Display: Fredoka (Latin) / Mali (Thai) / Jua (Korean). Body: Nunito / Noto Sans Thai / Noto Sans KR.
- Page title: `.page-hero h1` with `<span class="title-pop">` gradient text. Gradient text (`background-clip: text`) only paints inside its box:
  `.title-pop` carries `.45em` padding so Thai stacked marks (เกี่ยว) aren't cut off. Keep that padding on any new gradient text with Thai.
- Section title: `.section-head` → `.eyebrow` (small pill with icon) + `h2.section-title` + `p.section-sub`.
- Korean uses `word-break: keep-all`; Thai uses taller line-height — don't override.

## Layout
- Wrap content in `.container` (max 1180px, gutter `clamp(16px, 4vw, 32px)`).
- Vertical rhythm: `.section` (responsive padding). First section after `.page-hero` uses `style="padding-top:12px"`.
- Grids: `.grid.grid-2 | .grid-3 | .grid-4` (auto-fill, collapse to 1 column on phones).
- Breakpoints used: 1200px (tighter nav spacing), 1040px (nav → drawer; sized for 8 nav items — re-measure if you add one),
  860px (hero stacks), 760px (timeline single side), 560px, 420px (compact logo), 340px (logo mark only).
- No horizontal scrolling at 320px. Tabs scroll horizontally inside themselves (`.tabs`).

## Components (reuse before inventing)
| Class | What |
|---|---|
| `.card` (+ `.hover`) | White rounded panel; `.hover` lifts and tilts slightly |
| `.btn.btn-primary / .btn-ghost / .btn-sm` | Pill buttons |
| `.chip`, `.chip-pink`, `.chips` | Small pills (tags, quick facts) |
| `a.chip.chip-link` / `.text-link` | Clickable chip (lift + arrow nudge on hover) / inline accent text link (underline on hover) |
| `.tag.tag-lead / .tag-support / .tag-cameo / .tag-special / .tag-other` | Role badges |
| `.tabs > .tab[aria-selected]` (+ `.count`) | Pill tab bar |
| `.search` | Rounded search input with icon |
| `.counter`, `.counter-num[data-count]` | Animated number tiles (call `countUp(root)` in `mount`) |
| `.timeline > .tl-item` | Alternating vertical timeline |
| `.highlight` + `.g-0..g-3` | Gradient-topped feature cards |
| `.award-card` > `.award-poster` | Award with the poster of its work (or the YouTube avatar) + small trophy badge; plain `.award-icon` when no picture |
| `.gallery` > `.gallery-item` | "Hyeri" photos: masonry columns, photos uncropped (owner prefers this look) |
| `.gallery.gallery-works` | "From her works": row-by-row grid in the saved order, 16:9 tiles; lightbox shows the full still |
| `.row-card` (`a.row-card.row-link` when it links out) | Compact list row (year / title / badge); the whole row is the link, never a nested link inside |
| `.marquee > .marquee-track` | Infinite scrolling chip strip (duplicate the content once) |
| `.work-card.has-poster` + `.work-poster` / `.work-info` | Work card with a TMDB poster on the left |
| `.work-more` | "Details" button that makes the whole card clickable |
| `.modal > .modal-panel` | Detail popup (backdrop image, poster, synopsis); close on Esc/backdrop |
| `.video-card > .yt[data-yt]` | Lazy YouTube player: thumbnail first, iframe on click |
| `.channel-card` | YouTube channel highlight (avatar, stats chips, button) |
| `.empty` | Friendly empty state with icon |
| `.note-box` | Soft pink callout |
| `icon(name)` in `core.js` | Inline SVG icons — add new ones to the `ICONS` map there |

## Motion
- Entrance: add `.reveal` to blocks; stagger with `style="--d:.1s"` (max ~0.3s). `reveal()` runs after every render.
- To jump to an element (deep links like `?item=`), use `scrollToEl(el)` from core.js: it ignores the `.reveal` slide-in offset so the target never ends up under the sticky header.
- Hover: lift (`translateY(-3…-6px)`) and/or tiny rotate with `--ease-pop`.
- Ambient: floating stickers, drifting background blobs, twinkle sparkles — keep to the hero/headers, never behind long text.
- Durations 0.3–0.9s for UI; ambient loops 5–40s. Never flash, never autoplay sound.
- Everything must degrade under `prefers-reduced-motion: reduce` (already handled globally — don't add `!important` motion).

## Accessibility
- Text contrast ≥ 4.5:1: use `--ink`/`--ink-2`/`--accent` for text; pastels only for decoration or white-on-gradient headings ≥ 1.2rem bold.
- Interactive elements are `<a>` or `<button>`, with visible `:focus-visible`.
- Images need `alt` (use the localized caption). Icon-only buttons need `aria-label` via `ui()`.

## Don't
- Don't add new fonts, CSS frameworks or icon libraries.
- Don't use pure black/white blocks, sharp corners, or heavy drop shadows.
- Don't put text over photos without a gradient scrim.
