---
name: Christo Prints Site Review — Issues Found
description: Issues found and fixed during the March 2026 QA review of christoprints.com
type: project
---

Site reviewed 2026-03-17. Build: 11ty v2, deployed to Netlify. All issues fixed.

**Why:** Pre-deployment QA before christoprints.com goes live.
**How to apply:** Reference if re-reviewing or if similar small e-commerce 11ty sites come through.

## Issues Found & Fixed

1. **No canonical tag, OG tags, or schema markup** — base.njk had none. Added canonical, og:title/description/type/url/locale, and LocalBusiness JSON-LD.
2. **External Google Fonts** (Inter via fonts.googleapis.com) — violates system-font-stack requirement. Removed; CSS updated to system font stack.
3. **Netlify Identity widget** loaded on all pages — unnecessary third-party JS for visitors. Removed from base.njk.
4. **'Nunito' font reference** in WhatsApp button inline style — changed to `font-family:inherit`.
5. **No Forth Digital footer credit** — added `<div class="footer-credit">Designed by <a href="https://forthdigital.uk">Forth Digital</a></div>` with supporting CSS.
6. **Nav missing `aria-label="Main navigation"`** — added to `<nav>`.
7. **Hamburger toggle missing `aria-expanded`** — added `aria-expanded="false"` plus `aria-controls="navLinks"` to button; nav.js updated to toggle it on open/close.
8. **No `<main>` or `<header>` landmarks** — wrapped content in `<main>` and nav in `<header>`.
9. **Google Maps iframe on contact page** — violates no-iframe performance rule. Replaced with direct Google Maps link button.
10. **Typos in products.json** — "THe popular" (Spiral Cone), "mesmirising" (Fidget Twist). Fixed.

## Missing Images (not fixed — need assets from client)

Products with no image file present:
- carabiner.jpg
- joystick.jpg
- screw-lock-carabiner.jpg
- whistle.jpg
- fidgets-bundle.jpg (bundle)
- adventure-bundle.jpg (bundle)

Site has a JavaScript image placeholder fallback that shows "Sorry, this image is unavailable" — so these won't break the page, but images are needed before launch.

## site.json state

site.json only has `{ "url": "https://christoprints.com" }`. This is minimal but functional — the site doesn't use site.json variables in templates (all contact info is hardcoded). Schema markup was added inline in base.njk.

## Design Notes

- Dark theme: bg #0a0f14, accent #00e6c3 (teal)
- Hero style: radial glow, bold h1 with gradient highlight span, badge pill, two CTAs
- Service layout: product-grid with auto-fill columns
- Border radius: 12px (--radius) / 20px (--radius-lg) — "friendly" style
- CTA: inline cta-banner sections throughout, WhatsApp floating button
- No forbidden combo (gradient hero exists but no 3-col card grid + alternating sections + CTA banner in that sequence)
