# Nepal Uncharted Theme Guide

Use this guide when creating or updating pages so the app stays visually consistent with the landing, login, and register pages.

## Brand Direction

Nepal Uncharted uses a premium heritage-travel style: editorial, calm, and grounded. The interface should feel like a modern cultural tourism platform, not a generic SaaS dashboard.

Core feeling:

- Cinematic Himalayan discovery.
- Sustainable and community-first travel.
- Warm terracotta accents with green heritage tones.
- Light, airy surfaces with strong serif headings.
- Sharp rectangular cards and panels, not soft bubbly SaaS shapes.

Avoid:

- Purple/blue SaaS gradients.
- Rounded pill-heavy layouts everywhere.
- Emoji-based icon systems.
- Default gray login-card UI.
- Dark navbar/footer unless the specific section intentionally uses an inverse panel.

## Colors

Primary tokens from `src/app/globals.css`:

```css
--surface: #f9f9ff;
--on-surface: #121c2c;
--on-surface-variant: #57423a;
--primary: #9f3e07;
--primary-container: #c05621;
--on-primary-container: #fffeff;
--secondary: #376850;
--tertiary: #7b5600;
--tertiary-fixed: #ffdeaa;
--on-tertiary-fixed: #271900;
--surface-container-low: #f0f3ff;
--surface-container: #e7eeff;
--outline-variant: #dec0b5;
--inverse-surface: #273141;
--inverse-primary: #ffb596;
```

Usage:

- Page backgrounds: `bg-surface` or subtle gradients from `#f9f9ff` to `#f0f3ff`.
- Main text: `text-on-surface`.
- Muted text: `text-on-surface-variant`.
- Primary CTAs: `bg-primary-container text-on-primary-container`.
- Heritage/action links: `text-primary`.
- Sustainability/stat blocks: `bg-secondary text-white`.
- Small label badges: `bg-tertiary-fixed text-on-tertiary-fixed`.
- Borders: `border-outline-variant` or `border-stone-200`.

## Typography

Fonts:

- Headings and brand text: `Noto Serif`.
- Body and labels: `Inter`.

Tailwind theme utilities:

- Hero/page title: `font-h1 text-h1`.
- Section title: `font-h2 text-h2`.
- Card title: `font-h3 text-h3`.
- Eyebrow labels: `font-label-sm text-label-sm uppercase tracking-widest`.
- Body copy: `font-body-md text-body-md` or `font-body-lg text-body-lg`.

Rules:

- Use serif for navigation labels, CTAs, card titles, and major headings.
- Keep heading language concise and editorial.
- Use uppercase tracked labels for section tags and metadata.

## Icons

Use `lucide-react` for icons.

Rules:

- Do not use Material Symbols or emoji icons.
- Use stroke widths around `1.7` to `2.2`.
- Icon color should usually be `text-primary`, `text-secondary`, `text-tertiary`, or muted stone.
- Keep icons functional and sparse.

## Navbar

The navbar follows the original `test.html` theme.

Structure:

- Fixed at top.
- `bg-white/90 backdrop-blur-md`.
- `border-b border-stone-200`.
- Brand: `Nepal Uncharted`, serif, orange.
- Desktop nav: uppercase serif labels with wide tracking.
- Active nav: orange text and bottom border.
- Actions: search icon plus either sign-in button or user/dashboard icon.

Auth behavior:

- Use `useAuthStore`.
- If `isAuthenticated` is true, show a user/dashboard icon.
- If false, show the `Sign In` button.
- Current frontend testing default is authenticated.

Mobile:

- Use a collapsible top menu.
- Keep the bottom navigation from the landing HTML.
- Use Lucide icons for Explore, Planner, Impact, and Bookings.
- Floating action button links to Trail Builder.

## Footer

The footer follows the light original `test.html` footer.

Structure:

- `bg-stone-50`.
- `border-t border-stone-200`.
- Four columns on desktop.
- Brand column, Navigation column, Connect icons, Newsletter field.

Color rules:

- Brand: orange.
- Column headings: green.
- Links: stone text with green hover.
- Newsletter arrow: primary terracotta.

Avoid using the older dark gradient footer for this theme.

## Landing Page

Hero:

- Full cinematic image background.
- Fixed navbar offset handled by root layout.
- Overlay content uses translucent glass panel.
- Left border uses `border-primary-container`.
- CTA uses `bg-primary-container`.

Featured trails:

- Bento grid layout.
- White cards with `border-stone-200`.
- Large horizontal cards and smaller vertical cards.
- Images use object-cover and a subtle hover scale.
- Categories use `text-secondary`.

Responsible travel section:

- Section background: `bg-surface-container-low`.
- Two-column layout on desktop.
- Image column has decorative green corner line.
- Green `92%` stat card must stay inside the image area on desktop.
- On mobile/tablet, stat card stacks below image instead of overflowing.

Journey steps:

- Centered section.
- Three steps with square white icon blocks.
- Thin connector line on desktop.

Testimonials:

- White section.
- Testimonial cards use `bg-stone-50` and light borders.
- Quote icon uses `text-tertiary`.

## Login Page

Theme:

- Must align with landing page, not generic gray auth UI.
- Light `bg-surface` with subtle radial terracotta/green background.
- Main auth container: white, bordered with `border-outline-variant`, strong shadow.
- Desktop split layout with inverse heritage panel.

Left/right content:

- Login page uses inverse panel on desktop with the title:
  `Return to the uncharted heart of Nepal.`
- Form panel has:
  `Nepal Uncharted` link, heading, subtitle, social buttons, divider, email/password fields, CTA, register link.

Controls:

- Social buttons: bordered, white/low-surface background, Lucide icons.
- Inputs: square edged, `border-outline-variant`, focus border primary.
- Submit: `bg-primary-container text-on-primary-container`, uppercase serif.

Behavior:

- On successful login, save token to `localStorage`.
- Call `useAuthStore().setAuthenticated(...)`.
- Social login buttons redirect to:
  `${NEXT_PUBLIC_AUTH_URL || "http://localhost:5000/auth"}/google`
  `${NEXT_PUBLIC_AUTH_URL || "http://localhost:5000/auth"}/github`

## Register Page

Theme:

- Same auth shell as login.
- Responsive white form panel and inverse-surface editorial panel.
- Background uses subtle green/terracotta radial gradients.

Form fields:

- Full name.
- Email.
- Password.
- Google and GitHub options.

Desktop inverse panel:

- Title: `Build journeys that preserve living heritage.`
- Include small stat cards using inverse panel styling:
  `92% Local revenue retention`
  `100% Verified partners`

Behavior:

- On successful register, save token to `localStorage`.
- Call `useAuthStore().setAuthenticated(...)`.
- Send both `fullName` and `full_name` for backend compatibility if needed.

## Responsive Rules

- Use `px-4 sm:px-6 lg:px-8` for page sections.
- Auth cards should be single-column on mobile and split on large screens.
- Hide large editorial side panels below `lg`.
- Keep CTAs full-width on auth forms.
- Avoid absolute elements that overflow on mobile.

## Implementation Checklist

When creating a new page:

- Use the theme tokens from `globals.css`.
- Use `Noto Serif` heading utilities.
- Use Lucide icons only.
- Prefer light surfaces and terracotta/green accents.
- Keep cards square or lightly rounded only if existing local pattern requires it.
- Use real project routes with `next/link`.
- Check mobile layout before finalizing.
