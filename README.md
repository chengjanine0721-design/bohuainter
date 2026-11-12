# Bohuainter

Static English tool site for word and character counting. No framework, no build step, no dependencies. Every page is plain HTML served with one shared stylesheet and one shared script.

Site: https://bohuainter.com
Contact: contact@bohuainter.com

## Stack

Plain HTML, CSS and JavaScript. Cloudflare Pages serves the repository root directly. There is no npm install, no bundler and no CI pipeline, because there is nothing to compile.

## Deploy

The repository is connected to Cloudflare Pages on the `main` branch. A push to `main` triggers a deploy automatically.

Cloudflare Pages project settings:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Build command | (leave empty) |
| Build output directory | `/` |
| Production branch | `main` |

Custom domain `bohuainter.com` is attached in the Pages project under Custom domains, and the apex record is proxied through Cloudflare so HTTPS is issued automatically. Redirect `www` to the apex with a Cloudflare redirect rule so only one hostname is indexed.

## File layout

```
/                        index.html
/blog/                   blog/index.html
/blog/{slug}/            blog/{slug}/index.html
/tool/                   tool/index.html
/tool/{slug}/            tool/{slug}/index.html
/faq/                    faq/index.html
/about-us/               about/index.html       (rewrite in _redirects)
/contact-us/             contact/index.html     (rewrite in _redirects)
/privacy/                privacy/index.html
/terms/                  terms/index.html
/404.html                404.html
/sitemap.xml             sitemap.xml
/robots.txt              robots.txt
```

Two public URLs do not match their folder name because the spec fixes both the URL and the file path. `_redirects` bridges the gap with a 200 rewrite, so `/about-us/` serves `about/index.html` without changing the address bar. Remove those lines only if you rename the folders.

## Pages

Eight tools, all client side:

- Character Counter
- Words to Pages Calculator
- Character to Words Calculator
- Essay Word Counter
- Upper Case Generator
- Lower Case Generator
- Twitter Character Counter
- Google Meta Counter

Six blog guides covering word counts in Pages, Google Docs, Word and Excel, novel length, and title tag length.

Plus FAQ, About, Privacy, Terms, Contact and a 404 page. Every page carries a breadcrumb trail, the same header with a Tools dropdown, and a footer with Home, Tools and More destinations.

## Editing

Content lives directly in the HTML files. Navigation and footer are duplicated in each page by design, since there is no templating layer. If you change a nav item, update all pages together, or search for `site-header` and `site-footer` to find every occurrence.

Shared presentation is in `assets/style.css`. Shared behaviour, including all eight tool calculations, is in `assets/site.js`.

## Copy rules

House style for all visible text on the site:

- No semicolons
- No dashes of any kind in prose, including em dashes and en dashes
- Sentence case for body copy, title case for headings

## Local preview

Open `index.html` through a local server rather than the file protocol, because asset paths are root relative.

```
python -m http.server 8000
```

Then visit http://localhost:8000

## Tool slugs

Slugs follow the original spec exactly, including the spellings `eassy-word-counter` and `twitter-charactor-generator`. Changing them breaks live URLs and requires redirects.
