---
name: Christo Prints Site Review — Issues Found
description: Issues found and fixed during QA reviews of christoprints.com; missing images list; design notes
type: project
---

Site reviewed 2026-03-17 (initial) and 2026-03-22 (follow-up). Build: 11ty v2, deployed to Netlify. All fixable issues fixed.

**Why:** Pre-deployment QA before christoprints.com goes live.
**How to apply:** Reference if re-reviewing or if similar small e-commerce 11ty sites come through.

## Issues Fixed in Initial Review (2026-03-17)

1. No canonical tag, OG tags, or schema markup — added to base.njk.
2. External Google Fonts (Inter via fonts.googleapis.com) — removed; system font stack used.
3. Netlify Identity widget loaded on all pages — removed from base.njk (still in admin/index.html).
4. 'Nunito' font reference in WhatsApp button inline style — changed to font-family:inherit.
5. No Forth Digital footer credit — added with link to forthdigital.uk.
6. Nav missing aria-label="Main navigation" — added.
7. Hamburger toggle missing aria-expanded — added plus aria-controls.
8. No `<main>` or `<header>` landmarks — added.
9. Google Maps iframe on contact page — replaced with button link.
10. Typos in products.json — "THe popular" (Spiral Cone), "mesmirising" (Fidget Twist). Fixed.

## Issues Fixed in Follow-up Review (2026-03-22)

1. **Duplicate `host:` key in .eleventy.js** setServerOptions — removed duplicate line.
2. **Missing `og:image` and `og:site_name`** OG meta tags — added to base.njk (using /CPLogo.png 500x500).
3. **No global `:focus-visible` styles** — buttons and links had no keyboard focus indicator. Added `outline: 2px solid var(--accent)` rule to CSS.
4. **`visually-hidden` CSS class missing** — needed for honeypot labels. Added to CSS.
5. **All 3 Netlify forms missing honeypot anti-spam** — custom.njk, basket.njk (delivery form), success.njk (square-order form). Added `netlify-honeypot="bot-field"` and hidden bot-field inputs.
6. **Filter tab buttons missing `type="button"`** in products.njk — could behave as submit in certain contexts. Fixed.
7. **`colours-toggle` button missing `type="button"`** in product-page.njk — fixed.
8. **Netlify Identity widget still on base.njk** — kept (it handles post-login redirect to /admin/). Intentional architectural decision, not a blocker.

## Needs Manual Attention (not auto-fixable)

- **EXAMPLE10 coupon is active** in coupons.json — 10% off, publicly usable. Either replace with a real promo code or set `"active": false` before launch.
- **9 missing product/bundle images** (see list below) — image fallback exists but images needed before launch.
- **OG image is 500x500** — functional but not optimal for social sharing (1200x630 is recommended).
- **reviews.json uses generic author names** ("Customer", "User") — no dates. Fine for launch but looks thin.

## Missing Images (need assets from client)

Products with no image file:
- images/joystick.jpg
- images/carabiner.jpg
- images/screw-lock-carabiner.jpg
- images/whistle.jpg
- images/flower.jpg
- images/rabbit.jpg
- images/easter-eggs.jpg
- images/fidgets-bundle.jpg (bundle)
- images/adventure-bundle.jpg (bundle)

JavaScript image placeholder fallback shows "Sorry, this image is unavailable" — pages won't break, but images are needed before launch.

## site.json state

site.json only has `{ "url": "https://christoprints.com" }`. All contact info hardcoded in templates and base.njk schema. Minimal but functional.

## Design Notes

- Dark theme: bg #0a0f14, accent #00e6c3 (teal)
- Hero: radial glow, bold h1, badge pill, two CTAs
- Product layout: auto-fill grid
- Border radius: 12px / 20px — friendly
- CTA: inline cta-banner sections, WhatsApp floating button
- No forbidden combo
