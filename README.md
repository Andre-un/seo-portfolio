# The SEO Dictionary — Jędrzej Szymula

Personal portfolio: case studies, knowledge entries and (soon) digital products.
Built with [Astro](https://astro.build) and hosted for free on Cloudflare Pages.

Live: https://portfolio-4mh.pages.dev

## Why Astro

Every page shares one layout (`src/layouts/Base.astro`): `<head>` with SEO and social
tags, JSON-LD, the masthead, the tab menu and the footer. Change the menu or the footer
once and every page follows. The output is still plain static HTML + one CSS file —
no JavaScript framework is shipped to visitors.

## Structure

```
src/
  layouts/Base.astro   Shared layout (head, masthead, nav, footer, JSON-LD)
  pages/*.astro        One file per page → built to /<name>.html (old URLs kept)
    index.astro          Home
    work.astro           Case studies, earlier work, free checklists
    knowledge.astro      SEO / AEO / GEO entries (#seo, #aeo, #geo)
    about.astro          Bio, expertise, full experience timeline
    shop.astro           Upcoming products (waitlist by email)
    home-globe.astro     Draft homepage with the rotating globe (noindex)
  styles/global.css    The only stylesheet — no inline style="" in pages
public/                Copied as-is to the site root
  images/              Case-study screenshots and report previews
  downloads/           PDFs: Flobotics report + 3 free SEO checklists
  globe.js, site.js    Small vanilla scripts
  _headers             Cloudflare security + caching headers
  robots.txt, sitemap.xml, favicons, og-image.png
```

## Working on it

```
npm install
npm run dev       # http://localhost:4321
npm run build     # outputs dist/
```

### Add a page
1. Copy `src/pages/knowledge.astro` to `src/pages/new-page.astro`.
2. Set `title`, `description`, `path="/new-page.html"` and `active` on `<Base>`.
3. Add it to the menu in `src/layouts/Base.astro` (if it belongs there) and to `public/sitemap.xml`.

### Add a case study
Copy one `<div class="case" id="…">` block in `src/pages/work.astro`, put screenshots
in `public/images/` and reference them as `images/<file>`.

## Deploy on Cloudflare Pages (free)

Cloudflare dashboard → Workers & Pages → `portfolio` → Settings → Build:

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 22 (read from `.node-version`) |

Connect this GitHub repository; every push to `main` then builds and deploys
automatically, and other branches get preview URLs. GitHub Actions
(`.github/workflows/build.yml`) also builds every push, so a broken change shows up
as a red ✗ on GitHub before it reaches the site.

## Moving to your own domain
Update the URL in four places: `astro.config.mjs` (`site`), `src/layouts/Base.astro`
(`SITE_URL`), `public/robots.txt` and `public/sitemap.xml`.

## Next steps
- Email capture: links currently open an email to `j.szymula.seo@gmail.com`. For a real
  signup form use a free form backend (Formspree, Buttondown) and swap the links.
- Shop payments: Gumroad or Lemon Squeezy (no monthly fee).
- Analytics: Cloudflare Web Analytics (free toggle in the Pages dashboard).
- Content collections: move Knowledge entries and case studies to Markdown files
  once there are more of them.
