# Cooked — Performance & Privacy Audit

> Refresh after significant versions or when something feels slow. Re-measure against current source; don't trust stale numbers.
> Last pass: **v0.28.3** (2026-06-15). Scorecard at the bottom.

---

## Privacy — what leaves the device (Principle #8)

Cooked is privacy-by-default. **No analytics, telemetry, or tracking SDKs** — verified by grep (`analytics|telemetry|gtag|mixpanel|segment|posthog|sentry|amplitude|datadog`): the only match is a code comment in `imageUtils.ts` ("transform segment"). Confirmed.

External data flows (all the egress that exists):

| Destination | What is sent | When | Notes |
|-------------|--------------|------|-------|
| `api.anthropic.com` | Recipe page text / pasted text / photo bytes; recipe metadata for enrichment | Import + deferred enrichment (server-side, `ANTHROPIC_API_KEY`) | The only substantive content flow. Minimise to what extraction needs. |
| `api.dropboxapi.com` / `content.dropboxapi.com` | All user data (recipes, history, pantry, shopping, images) | Background sync | **User's own account** via PKCE. Not Cooked infrastructure. |
| `api.unsplash.com` | Image search query (recipe title / cuisine) | Image resolution + picker | Recipe metadata only, no PII. |
| `api-inference.huggingface.co` | Image bytes for 2× upscale | Settings image refresh only | Not during import. |
| `img.youtube.com` | Video ID (thumbnail fetch) | YouTube import | Public asset. |
| `www.google.com` | — (used as `Referer` header) | Recipe page fetch | Server fetches the user-supplied recipe URL. |

**Watch:** the import route fetches arbitrary user-supplied URLs server-side, and forwards extracted page text to Anthropic. That's inherent to the feature, but it's the boundary to keep honest — don't log recipe content server-side, don't persist it beyond the request.

## Bundle & load

| Metric | Value | Notes |
|--------|-------|-------|
| Framework | Next.js 14 App Router, Server Components by default | `"use client"` only on interactive leaves |
| Heavy client deps | framer-motion, lucide-react | Tree-shaken; Lucide imported per-icon |
| Fonts | Texturina, Fraunces, Alegreya Sans | Via `next/font` — self-hosted, no external font CDN |
| PWA | next-pwa, SW disabled in dev | `next.config.mjs` |
| _TODO_ | Run `next build` and record route-level First Load JS | Not yet captured |

## Runtime

| Area | Observation |
|------|-------------|
| Timers | ~12 `setInterval`/`setTimeout`/rAF sites; cooking timer runs in a Web Worker (off main thread). DropboxConnect polls auth state. No obvious accumulating timers — verify each clears on unmount. |
| Sync I/O | `localStorage` write is synchronous + instant; Dropbox upload debounced 1500ms; downloads throttled to once/15min per path. |
| Caching (SW) | `cooked-pages` / `cooked-recipe-pages` (NetworkFirst-style on `/`, `/recipes`, `/settings`, recipe detail); `cooked-images` CacheFirst for image hosts. |
| Image cache | `useDropboxImage` 4h TTL on resolved temp URLs (`cooked-img-cache:*`). |

## Security

| Check | Status |
|-------|--------|
| XSS — React escapes by default; no `dangerouslySetInnerHTML` audited | ⚠️ confirm no `dangerouslySetInnerHTML` introduced |
| Secrets — server-only keys (`ANTHROPIC_API_KEY`, `UNSPLASH_ACCESS_KEY`, `HUGGINGFACE_API_TOKEN`) never `NEXT_PUBLIC_` | ✅ |
| Client-visible env — only `NEXT_PUBLIC_DROPBOX_APP_KEY`, `NEXT_PUBLIC_APP_URL` (both safe to expose) | ✅ |
| Dropbox auth — PKCE, App-folder scope, tokens in localStorage | ✅ (localStorage tokens are an accepted tradeoff for a personal PWA) |

## Known gaps

| Gap | Severity | Notes |
|-----|----------|-------|
| Route-level bundle sizes not measured | Low | Capture on next `next build`. |
| No automated sync / two-device test | Medium | Highest-value coverage gap (see TEST_MATRIX.md). |
| Server fetches arbitrary user URLs (SSRF surface) | Low–Medium | Import is the intended behaviour; ensure URL validation stays HTTP/HTTPS-only. |
| Timer cleanup not audited per-component | Low | Spot-check `useEffect` returns. |

## Scorecard

| Area | Rating |
|------|--------|
| Privacy | ✅ no telemetry; egress documented + minimal |
| Secrets handling | ✅ |
| Bundle / load | ⚠️ not yet measured |
| Runtime / timers | ✅ (spot-check cleanup) |
| Security (XSS/SSRF) | ⚠️ low-risk, keep URL validation |
| Test coverage | ⚠️ sync paths manual |
