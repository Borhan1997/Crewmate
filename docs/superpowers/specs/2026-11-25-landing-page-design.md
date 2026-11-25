# Crewmate landing page — design

## Intent
A public page that sells Crewmate to two audiences: recruiters (skim for product and proof of engineering) and learners (see how it is built). Visual language is x.ai/bot's: monochrome, airy, pill buttons, product mockups beside copy.

## Goals
- Two CTAs everywhere: "Get started" (sign-up) and "View on GitHub".
- Sections: hero, four feature blocks (teammates with a job, a computer per bot, group chats with handoffs, memory across chats), "How it works" architecture, "Built with" stack, closing CTA, footer.
- Mockups built from existing UI (`Bubble`/`Message`, `ChatAvatar`), not screenshots.

## Non-goals / anti-goals
- No new dependencies, no colour accents, no shadows, no claims about unbuilt features (live office view, plans/billing stay out).
- Must not break the signed-in dashboard experience.

## Approaches considered
- **A (chosen):** landing at `/` for signed-out visitors; signed-in users redirect to the dashboard, which moves to its own route inside `(dashboard)`.
- B: landing at `/` for everyone, dashboard at `/app` — extra click for the owner.
- C: landing at `/about` — shared root URL still hits a sign-in wall.

## Design
- `proxy.ts`: add `/` to public routes.
- New `app/page.tsx` (landing). It checks `auth()`; if signed in, `redirect` to the dashboard route.
- Move `app/(dashboard)/page.tsx` to `app/(dashboard)/home/page.tsx`; update links that point to `/` (sidebar, chat header, post-delete redirects, Clerk after-sign-in URLs/env).
- Landing components in `components/landing/` (hero, feature-block, mockups, architecture, stack, footer). Server components, static content; scroll-in motion via CSS only.
- Style: tokens in `app/globals.css` (#0A0A0A, 12px radius, `rounded-full` buttons, Geist, `text-base`+ body, titles `text-2xl`+, buttons `h-10`+). Read `node_modules/next/dist/docs/` before writing routing code (this Next version differs).
- Architecture diagram is redrawn in JSX/SVG from the README flowchart, not mermaid.

## Left to the builder
Exact copy, section spacing, mockup content, and which links use `/home` vs. a constant.
