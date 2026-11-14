# Changelog / Work Log

Running history of changes made to this site, kept so future sessions have context without re-discovering everything from scratch.
















## 2026-11-14 — Globe simplified: fixed loop, one glitch, one button style

- `public/globe.js` rewritten around three rules, with every setting at the top of the file:
  - ROUTE: the dashed line always travels Warsaw → Brussels → Indiana → Tokyo → Tbilisi → Warsaw and
    never goes back. It leaves after `HOLD`, or earlier as soon as the city starts shrinking near the horizon.
    One city marker at a time; cities scale with the globe like the tags.
  - TAGS: appear only right after the line lands in a visible city; each topic at most once; never on top
    of another marker.
  - ONE GLITCH: cities and tags share one marker mechanism (`glitchIn` / `glitchOut`) and one CSS glitch
    (`.is-in` / `.is-out` on the marker, `.glitch` + `data-text` on the label). The topic panel swap uses
    the same 420 ms jitter. Removed the separate "burst" flicker and instant hides.
- Buttons: one style for every button (`.btn`, `.btn-ghost`). The header "Hire me" is now a `.btn`;
  `.hire-btn` and `.g-box-btn` only place the button.

## 2026-11-14 — Each topic tag at most once on the globe

- `nextWord()` in `public/globe.js` skips any topic already on the globe (incl. tags still glitching out);
  if all five are shown, no new tag spawns until one leaves. B2B keeps its double weight in the deck.
- Stress-tested with a tag every 0.4 s: 0 duplicate samples out of 500 (desktop + phone).

## 2026-11-14 — Hero: two boxes, one button each

- The homepage entry's two senses are now two boxes side by side (stacked on phones):
  1. what Jędrzej does + 2× / 1,000+ / 40 → "Check my portfolio →" (work.html)
  2. informal sense + "Available for new projects" + "Download my CV (PDF)" link → "Hire me →" (mailto)
- Buttons sit at the bottom of each box and line up. Entry box widened to 35rem.

## 2026-11-13 — CV on the homepage

- `public/downloads/jedrzej-szymula-cv.pdf` (English CV, 2 pages) linked from a "See my CV" button in the
  homepage hero, next to "See the work" and "Work with me"; opens in a new tab.
- Hero buttons slightly tighter and the entry box a bit wider so all three fit on one line on desktop.
- Note: the CV contains a phone number and a personal email — it is public on the site and in this repo.

## 2026-11-12 — Tokyo instead of Riyadh

- Globe places: Warsaw, Indiana, Brussels, Tokyo (Riyadh removed).

## 2026-11-12 — Globe markers never overlap

- New tags never spawn on top of the city marker.
- Every frame, `resolveOverlaps()` in `public/globe.js` checks the real on-screen boxes (+8px gap) of the
  city marker and all tags: a tag that runs into the city or into another tag disappears at once
  (the newer one goes first). A tag under the cursor wins — then the city marker hides instead.
- Stress-tested (a tag every 1.5 s, 40 s, desktop + phone): 0 overlapping frames out of 800.

## 2026-11-12 — One-line header bar

- The big two-line masthead is replaced by a header bar: "The SEO Playbook" logo on the far left,
  the tabs, and "Hire me" on the right — one line on screens ≥900px (bar spans 60% of the window,
  at least 840px, centred). Below 900px: logo + Hire me on the first row, tabs underneath.
- The active tab's outline opens onto the bar's bottom rule (folder-tab look).
- "Available for new projects" moved to the footer.

## 2026-11-12 — Mobile globe at the bottom, long desktop nav

- Phones (≤760px): the globe moved out from behind the hero text into its own strip below the buttons —
  a cap rising from the bottom, full opacity. `globe.js` sets `--globe-top` / `--globe-h`, which the
  canvas, city and tag layers and the hero's bottom padding use.
- Desktop: the tab nav spans 60% of the window, centred (20% · 60% · 20%), never narrower than the
  page column.
- Fixed a 6px horizontal overflow on phones (hero stats now share the width in three equal columns).

## 2026-11-12 — "The SEO Playbook"

- Site name changed from "The SEO Dictionary" to "The SEO Playbook": masthead on every page, OG title,
  new `public/og-image.png`, README, package name.
- City labels on the globe: solid paper box with a little more padding, so no globe dots show through letters.
- `_headers`: scripts in `/public` (`globe.js`, `site.js`) are always revalidated, so visitors never get
  an old script with new CSS after a deploy.

## 2026-11-12 — Globe: static cities, pulsing topic tags

- City markers are static dots; the name sits on a paper-coloured label at full opacity, in its own
  DOM layer (`.globe-places`) above the canvas so the bottom fade mask doesn't dim it.
- Cities switch instantly just before the arc lands (no cross-fade, no landing ring).
- The pulse moved to the dots under the topic tags (SEO, AEO, GEO, AI, B2B): `.gtag-dot::after`.

## 2026-11-12 — Globe tilted towards the equator

- View tilt lowered from 18° to 4° (`TILT` in `public/globe.js`) to show a different part of the globe.
  (A short-lived version also hid everything above 66°; the full globe incl. the Arctic is drawn again.)

## 2026-11-12 — Globe: one place at a time, hopping arc

- Only one place is shown at a time. A dashed arc grows from the current place towards the next one
  (Warsaw → Indiana → Brussels → Riyadh order, skipping places on the far side of the globe).
  The new place appears with a landing ring just before the arc arrives, the old one fades out,
  and the arc's tail then retracts into the new place. Hold 1.8 s, flight 1.7 s, landing 0.65 s
  (`HOLD`, `FLY`, `LAND` in `public/globe.js`). Arc height scales with distance.

## 2026-11-12 — Recommendations + more places on the globe

- New `src/components/Recommendations.astro`: two LinkedIn recommendations (Maciej Robak, direct manager;
  Agnieszka Cabel, direct report — translated from Polish), shown on the homepage and on About.
- Globe: added Brussels and Riyadh; dashed routes now run from Warsaw to every other place
  (`places` in `public/globe.js`, first entry is the hub).

## 2026-11-12 — Globe homepage is the homepage

- `src/pages/index.astro` is now the rotating-globe homepage (indexable, own OG title/description).
  The previous dictionary-style homepage was removed; its content is covered by the globe hero
  and the "See also" entries below it.
- The draft URL `/home-globe.html` 301-redirects to `/` (`public/_redirects`), so there is one link.
- The "Home" tab on every page points to `./` (the root).

## 2026-11-12 — Migration to Astro

- Site rebuilt as an Astro project (static output, same look, same URLs via `build.format: 'file'`).
  One shared layout `src/layouts/Base.astro` replaces the header/nav/footer copied into every page.
- All inline `style=""` attributes moved into `src/styles/global.css` as classes.
- All images now live in the repo: the 4 Autopay / winiety-online screenshots (previously hot-linked
  from old Cloudflare preview deployments) are in `public/images/`.
- The 3 free checklists (previously 404 in the local folder) are in `public/downloads/`.
- Removed before launch: placeholder testimonial on the homepage, hard-coded "23 people waiting"
  counters in the shop, and signup forms that showed "You're on the list" without saving anything.
  Replaced with honest mailto links ("Email me to get notified", "Join the waitlist by email").
- JSON-LD Person schema now on every page, updated to "Content & SEO Specialist" with AEO/GEO/B2B.
- Sitemap now lists Knowledge. Added Cloudflare `_headers` (security + long cache for `/_astro/*`).
- Added GitHub Actions build check.

## 2026-11-02 — Draft globe homepage

- New `home-globe.html` (draft, `noindex`, not in nav or sitemap): dictionary-entry hero ("Jędrzej Szymula, noun") on the right, big rotating dotted globe in the bottom-left quarter with a bottom fade, Warsaw → Indiana route. Below the fold: Case Studies, SEO·AEO·GEO and Resources teasers.
- Globe pop-up tags: SEO, AEO, GEO, AI, B2B (B2B weighted ×2) appear pinned to land dots, rotate with the globe, glitch in/out (RGB-split slices, CSS only) — `.globe-tags` / `.gtag*` in `style.css`, logic in `globe.js`. Static and calm with reduced motion.
- Tuning (v4): rotation 6°/s (was 4), hover slow-down to 30% (was 10%), a new tag every 7 s (was 30).
- Tag timing (v3): one new tag every 30 s (`SPAWN_EVERY` in `globe.js`); tags no longer time out — they ride the globe, shrink towards the horizon and glitch out only once they go over it. Leaving a hovered tag brings the globe back to full speed straight away (~1 s ease), even while the topic panel is still open.
- Topic hover: hovering (or tapping/focusing) a globe tag slows the globe to 10% and swaps the entry panel, with a glitch, to that topic — title, expansion, intro and two buttons (Learn more + Hire me / Consult me). Topic copy lives in `.g-topics` inside `home-globe.html`. The panel stays open while the cursor is in it, and returns to the default entry ~2s after leaving (Esc closes). Tags never spawn under the panel. `knowledge.html` entries got ids `#seo`, `#aeo`, `#geo` for deep links. On phones the tags stay decorative.
- New `globe.js`: canvas globe, land dots from world-atlas via jsDelivr (d3-geo + topojson-client); falls back to a plain dotted sphere if the CDN fails; respects reduced-motion; pauses when off screen.
- `style.css`: globe-page classes (`.globe-canvas`, `.g-*`) and a narrow-phone nav fix for all pages (tabs no longer run together under 480px).
- To make it the real homepage later: rename to `index.html` (keep the old one as backup), remove the `noindex` meta, and point the Home tab to `index.html`.

## 2026-11-02 — Flobotics report + full LinkedIn skills

- Added `downloads/flobotics-state-of-rcm-automation-2026.pdf` (Flobotics "State of RCM Automation: 2026 Edition", CC BY 4.0; photos and logo excluded from the licence) and previews `images/flobotics-rcm-2026-{cover,p2,p12}.jpg`.
- `work.html`: Flobotics case now contains a featured-report block (cover, key numbers, my contribution, evidence grades, download button, two page previews). New `.report*` / `.grade*` classes in `style.css`. `toggle()` now ignores clicks inside an open case body so links/downloads don't collapse it.
- `about.html`: every role now shows its full LinkedIn skill list (translated to English); Profisun Polska (2020) added; Flobotics description updated; Fintek title in English.

## 2026-10-29 — Case studies from LinkedIn experience

- `work.html`: Flobotics updated (2× U.S. blog growth YoY, 40 AI citations in 3 months, featured "U.S. RCM: 2026 Review", GitHub deploy). Autopay dated 2024–2026 and credited to the Mamalu.io Content Team Lead role. winiety-online.pl got LinkedIn metrics (1,000+ TOP 3 keywords, +250% visibility, $125K+ content-driven purchases). New Milo Solutions case. New "Earlier Work" section (BimmerTech, Rightout, Finelf, Fintek, freelance, Profisun) using `.results-list` / `.dt-meta` in `style.css`. Each case now has an id for deep links.
- `index.html`: Milo Solutions teaser added; teasers deep-link to their case.
- `about.html`: Mamalu.io Content Team Lead now dated 2024 — 2026.

## 2026-10-29 — Flobotics case study

- `work.html`: added Flobotics (healthcare RCM rebrand & pivot) as the first case study, with id `#flobotics`. Results shown as a grouped list (Content / Social media / Branding / Optimisation) using new `.results` classes in `style.css`. Updated og:description.
- `index.html`: added Flobotics teaser card to the Case Studies grid, linking to `work.html#flobotics`.
- `sitemap.xml`: bumped lastmod for `/` and `work.html`.
- No screenshots for this case yet — add GSC/Ahrefs/LinkedIn analytics images as `<figure>` blocks like the Autopay case when available.

## 2026-07-25 — Code cleanup + infra investigation

### Code changes (done, files updated on disk)
- Extracted duplicated inline `<style>` blocks (present in all 4 pages) into a single shared `style.css`. All pages now use `<link rel="stylesheet" href="style.css" />`.
- Created `site.js` (shared JS): makes the footer copyright year update automatically (`#cur-year` span), and makes `[data-def]` tooltips in `index.html` usable via keyboard focus and touch tap (previously hover-only).
- Added `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` (generated, simple "§" mark on dark square, matches site's ink/paper palette). Linked in all 4 pages' `<head>`.
- Generated `og-image.png` (1200×630, matches site's editorial/dictionary look) and added `og:image` + `twitter:card` meta tags to all 4 pages.
- Added `robots.txt` and `sitemap.xml` at project root.
- Added `<link rel="canonical">` to all 4 pages.
- `work.html`: the 4 case-study screenshots (`images/screen-mobilityautopayeu-1`, `screenshot-mobilityautopayeu-5.png`, `-2.png`, `-4.png`) were referenced but the actual image files were missing from the local project folder → replaced with a styled "Screenshot pending" placeholder (`.shot-placeholder` class) and `<!-- TODO -->` comments so it's easy to swap back in once real screenshots are available. **Note:** Cloudflare deployment history shows these images DID exist at some point (deployment log has entries like "Rename screen-mobilityautopayeu-6 to screen-mobilityautopayeu-6.png") — they may still exist in the `JSzymula/WWW` GitHub repo or an earlier Cloudflare deployment; worth checking there before re-shooting screenshots.
- Left the testimonial placeholder on `index.html` ("— Client name, Company · add yours here") as-is per explicit user decision — not a bug, intentionally untouched until a real quote is available.
- Footer year changed from hardcoded "© 2024" to "© <span id=cur-year>2026</span>" (auto-updates via site.js).
- Wrote `README.md` (project structure, how to add a page, how styling works, known gaps) and `.gitignore` (.DS_Store, Thumbs.db).

### Infra / hosting — what we learned (important context)
- The live site (**https://portfolio-4mh.pages.dev**) is a Cloudflare Pages project named `portfolio`, under Cloudflare account `Jedrzejszymula@gmail.com`.
- Discovered mid-session: this Cloudflare Pages project was **already connected to a GitHub repo** — `JSzymula/WWW` — with automatic deploy-on-push enabled, and has been for ~3 months. This was not known at the start of the session; a *separate*, unnecessary new repo (`Andre-un/seo-portfolio`) was created before this was discovered. `JSzymula` is a different, likely older/primary GitHub account than `Andre-un` (which was freshly created during this session).
- We disconnected the `JSzymula/WWW` git integration in Cloudflare Pages settings, intending to reconnect it to `Andre-un/seo-portfolio` instead. The reconnect flow required GitHub OAuth in a popup window that our browser-automation tooling couldn't reach/control. After the popup, the Cloudflare settings page showed `JSzymula/WWW` connected again — **current actual git-connection state in Cloudflare Settings → Build → Git repository is unconfirmed as of end of session.** Check this directly before assuming either way.
- Given the friction with the two-GitHub-account situation, the user decided to bypass GitHub entirely for deploys and instead use Cloudflare Pages' **Direct Upload** feature (Workers & Pages → portfolio → "Create deployment" → drag in files → Save and deploy). This does NOT go through git at all — it's a manual, one-off upload.
- A Direct Upload of the updated files (12 files: index.html, work.html, about.html, shop.html, style.css, site.js, favicon.svg, favicon-32.png, apple-touch-icon.png, og-image.png, robots.txt, sitemap.xml) was performed via browser automation and Cloudflare reported "Success! Your site was built and deployed." **However, a post-deploy check of `https://portfolio-4mh.pages.dev/style.css` still returned the old `index.html` content (HTML, not CSS) instead of the actual stylesheet** — meaning the new files may not actually be live, or there's a routing issue (possibly a leftover `_redirects` catch-all rule serving `index.html` for all unmatched/all paths — unconfirmed, not investigated further per user request to stop debugging mid-session).
- **Action needed next session:** before doing anything else, check `https://portfolio-4mh.pages.dev/style.css` in a real browser (not a text fetch) to see if it now loads correctly (CDN propagation can lag; the user will check visually). If it's still broken, check for a `_redirects` file in whatever is actually deployed, and check Cloudflare Pages → portfolio → Settings → Build → Git repository to see the real current connection state.
- GitHub repo `Andre-un/seo-portfolio` (https://github.com/Andre-un/seo-portfolio) exists with one commit containing the updated files (14 files, uploaded via GitHub's web upload UI, not real git). It is currently **not** connected to any Cloudflare deploy. Decide whether to keep, connect, or delete this repo — it may now be redundant given Direct Upload is the chosen path.

### Known open items (see also README.md "Known gaps")
- Confirm whether the Direct Upload actually updated the live site (style.css / favicon / robots.txt should all resolve, footer should show dynamic year).
- Decide fate of `Andre-un/seo-portfolio` repo (keep as backup / connect / delete).
- Confirm actual current Git connection state of the Cloudflare Pages project.
- Real screenshots for `work.html` case studies still needed (see TODO comments in that file) — may already exist in `JSzymula/WWW` repo history.
- Forms (email signup, waitlist) are still not wired to any backend.
- No analytics installed yet.
- No payment processing for the shop yet.
