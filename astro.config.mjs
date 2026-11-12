// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Change this when the site moves to its own domain (also update public/robots.txt
  // and public/sitemap.xml, and SITE_URL in src/layouts/Base.astro).
  site: 'https://portfolio-4mh.pages.dev',
  build: {
    // Keep the old URLs: src/pages/work.astro -> /work.html (not /work/).
    format: 'file',
  },
});
