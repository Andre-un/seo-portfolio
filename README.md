# The SEO Dictionary — Jędrzej Szymula

Personal SEO portfolio site. Static HTML/CSS/JS, no build step, no framework — hosted for free on Cloudflare Pages.

Live: https://portfolio-4mh.pages.dev

## Structure

```
index.html        Home
work.html          Case studies + work history
about.html         Bio, expertise, experience timeline
shop.html          Digital products (checklists, guides) — currently waitlist-only
style.css          Shared stylesheet used by all pages
site.js            Shared behaviour (footer year, tooltip touch support)
favicon.svg        Favicon (modern browsers)
favicon-32.png     Favicon fallback (PNG)
apple-touch-icon.png  iOS home-screen icon
og-image.png       Social share preview image (1200×630)
robots.txt         Crawler rules
sitemap.xml        Sitemap for search engines
images/            Case study screenshots (currently placeholders, see TODO below)
```

## Adding a new page

1. Copy an existing page (e.g. `about.html`) as a starting point.
2. Keep the `<link rel="stylesheet" href="style.css" />` and `<script src="site.js"></script>` includes.
3. Update `<title>`, `<meta name="description">`, `<link rel="canonical">`, and the `og:*` tags.
4. Add the page to the `<nav>` list on all other pages.
5. Add the new URL to `sitemap.xml`.

## Styling

All CSS lives in `style.css`. Don't add `<style>` blocks back into individual pages — if a page needs a new component, add the class to `style.css` with a comment noting which page(s) use it.

## Deployment

This repo is connected to Cloudflare Pages. Pushing to `main` triggers an automatic build and deploy — no manual upload needed. Cloudflare serves the files as-is (no build command required for a static site like this).

## Known gaps / next steps

- **Screenshots**: `work.html` currently shows "Screenshot pending" placeholders where real GSC/Ahrefs screenshots should go. Drop the images into `images/` and swap the `.shot-placeholder` div for an `<img>` tag (see the `TODO` comments in `work.html`).
- **Forms**: the email signup (`index.html`, `shop.html`) and waitlist buttons (`shop.html`) are client-side only right now — nothing is actually captured or stored. Wire them up to a form backend (e.g. Formspree, Buttondown) before relying on them.
- **Shop**: no payment processing yet. When ready to sell, Gumroad or Lemon Squeezy are the simplest zero-setup-cost options (pay-per-sale, no monthly fee).
- **Analytics**: none installed. Cloudflare Web Analytics (free, privacy-friendly, toggle on in the Cloudflare Pages dashboard) is the simplest zero-cost option.
- **Testimonial**: the quote on `index.html` is still a placeholder (`— Client name, Company`). Replace with a real quote when available.
