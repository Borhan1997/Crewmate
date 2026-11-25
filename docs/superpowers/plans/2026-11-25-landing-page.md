# Crewmate Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox syntax.

**Goal:** Public x.ai/bot-style landing page at `/`; dashboard moves to `/home`.

**Architecture:** `app/page.tsx` is a server component that redirects signed-in users to `/home`. Landing sections live in `components/landing/` as static server components with JSX mockups.

**Tech Stack:** Next.js 16 (read `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/redirect.md`), Clerk, Tailwind 4, existing `Button`, `Bubble`, `ChatAvatar`.

**Spec:** `docs/superpowers/specs/2026-11-25-landing-page-design.md`

## Global Constraints
- No new dependencies; no shadows; no colour accents; `rounded-full` buttons `h-10`+; titles `text-2xl`+; body `text-base`+.
- Use semantic tokens only. Never commit/branch (AGENTS.md).
- Only claim shipped features (no live office view, no billing).

## Review Focus
- Signed-out visit to `/` renders the page (not a sign-in redirect).
- Signed-in visit to `/` lands on `/home`.
- Creating a bot/group still returns to the dashboard home; Clerk post-sign-in goes to `/home`.
- Page has no horizontal scroll at phone width.

---

### Task 1: Routing
**Files:** Modify `proxy.ts`, `components/bot-dialog.tsx:108`, `components/group-chat-dialog.tsx:105`, `.env.local` (+ Railway var); Move `app/(dashboard)/page.tsx` → `app/(dashboard)/home/page.tsx`; Create `app/page.tsx`.
- [ ] Add `"/"` to `isPublicRoute` in `proxy.ts`.
- [ ] Move the dashboard page; change both `router.push("/")` to `"/home"`.
- [ ] Set `NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL` and `..._SIGN_UP_...` to `/home` in `.env.local` and on Railway.
- [ ] `app/page.tsx`: `const { isAuthenticated } = await auth(); if (isAuthenticated) redirect("/home");` then render `<Landing />`.
- [ ] Verify: `npx tsc --noEmit` passes.

### Task 2: Landing components
**Files:** Create `components/landing/{landing,hero,feature,mockups,architecture,stack,footer}.tsx`.
**Interfaces:** `Landing(): JSX` composes sections; `Feature({title, body, children, reverse?})` renders text beside a mockup; mockups are static JSX.
- [ ] Hero: headline, subcopy, pills `Get started` (`/sign-up`) and `View on GitHub` (`https://github.com/Borhan1997/Crewmate`).
- [ ] Four `Feature` blocks (job, own computer, handoffs, memory) with `Bubble` + `ChatAvatar` mockups.
- [ ] Architecture (flow boxes from README), stack list with one-line roles, closing CTA, footer.
- [ ] Verify: `npm run lint` and `npx tsc --noEmit` clean; view in browser at desktop + 390px width.
