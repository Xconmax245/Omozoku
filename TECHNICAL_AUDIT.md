# OmoZoku — Technical Audit & Recommendations

**Audit Date:** July 8, 2026  
**Scope:** Full-stack monorepo (Next.js 14, Turborepo, pnpm workspaces)  
**Total estimated LOC:** ~10,000+ (TypeScript/TSX, CSS, SQL, config)

---

## 1. Architecture Overview

The project is a **Turborepo monorepo** with the following structure:

```
Omozoku/
├── apps/web/           # Next.js 14 app (App Router, React 18)
├── packages/
│   ├── api-clients/    # External API clients (Jikan, Gogoanime scraper, AniDB stub)
│   ├── db/             # Drizzle ORM schema, migrations, DB client
│   ├── transformers/   # Jikan → internal type transformers
│   └── types/          # Shared TypeScript type definitions
├── infra/              # Redis key convention docs
├── docker-compose.yml  # Consumet API container
├── turbo.json          # Turborepo pipeline config
└── pnpm-workspace.yaml
```

### 1.1 Strengths
- **Clean monorepo separation** — clear boundaries between data fetching, transformations, types, and UI.
- **Workspace packages** used correctly (`@omozoku/*`) with `workspace:*` protocol.
- **Next.js App Router** with a mix of server and client components.
- **Drizzle ORM** for type-safe database queries.
- **Comprehensive error handling** in the API client layer with typed error classes (`ProviderDownError`, `NotFoundError`, `RateLimitError`, etc.).
- **Caching abstraction** with `CacheProvider` interface and in-memory fallback.
- **Throttle/rate-limit** token-bucket implementation for external APIs.
- **Retry logic** with exponential backoff and jitter.

---

## 2. Critical Issues

### 🔴 CRITICAL 1: Authentication Secret Hardcoded

**File:** `apps/web/src/auth.ts`  
**Line:** `secret: process.env.AUTH_SECRET || "fallback-dev-secret-1234567890"`

A hardcoded fallback secret for NextAuth is extremely dangerous. If this code is deployed without setting `AUTH_SECRET`, session tokens can be forged by anyone who knows this string.

**Fix:** Remove the fallback and throw if `AUTH_SECRET` is not set in production.

### 🔴 CRITICAL 2: Fallback Dev Secret in Production Risk

**File:** `apps/web/src/auth.ts`  
The `"fallback-dev-secret-1234567890"` string is trivially guessable. If a production environment lacks the env var, an attacker can:
1. Forge any JWT session token
2. Escalate privileges arbitrarily
3. Access any user's account

### 🔴 CRITICAL 3: Proxy Stream Open to Abuse / SSRF

**File:** `apps/web/src/app/api/proxy/stream/route.ts`  
The stream proxy forwards arbitrary URLs from the `url` query parameter to the server. While there is an allowlist (`ALLOWED_HOSTS`), the validation only checks the hostname, not the full URL path. An attacker could potentially:
- Use URL parsing ambiguities to bypass the allowlist
- Access internal network resources if the proxy is misconfigured
- Abuse the proxy for bandwidth consumption

**Fix:** Add stricter URL validation — validate the entire URL, not just the hostname. Rate-limit the proxy endpoint.

### 🔴 CRITICAL 4: `@ts-nocheck` in Auth Module

**File:** `apps/web/src/auth.ts`  
`// @ts-nocheck` disables ALL TypeScript type checking for the authentication module — the most security-sensitive part of the application. This hides potential type errors in:
- Session handling
- User authentication logic
- Database queries for credentials

**Fix:** Remove `@ts-nocheck` and properly type the module. Use proper type imports from NextAuth.

---

## 3. Security Issues

### 🔸 3.1 Weak Password Hashing Cost

**File:** `apps/web/src/app/api/auth/register/route.ts`  
**Line:** `const hashedPassword = await bcrypt.hash(password, 12);`

While bcrypt with cost factor 12 is reasonable, the industry recommendation is moving toward **cost factor 14+** for password hashing, or preferably **argon2id**. Consider increasing the cost factor or migrating to argon2id.

### 🔸 3.2 No CSRF Protection on Auth Endpoints

The registration and login endpoints lack CSRF tokens. While Next.js has some built-in protections, explicit CSRF validation on state-changing auth endpoints is recommended.

### 🔸 3.3 Missing Input Sanitization on Profile Image Upload

**File:** `apps/web/src/app/profile/page.tsx`  
The avatar upload accepts `image/*` but only validates the MIME type client-side. Server-side validation is in `/api/profile/avatar` but the route file wasn't found — it may not exist or may not validate properly.

### 🔸 3.4 No Rate Limiting on Auth Routes

The `/api/auth/register` and `/api/auth/signin` routes have no rate limiting, making them vulnerable to brute-force attacks. Consider:
- Rate limiting per IP (5 attempts/minute for login, 2/minute for registration)
- CAPTCHA after failed attempts
- Account lockout after N failed attempts

### 🔸 3.5 No Secure HTTP Headers

The `next.config.js` doesn't set security headers like:
- `Content-Security-Policy`
- `X-Frame-Options`
- `X-Content-Type-Options`
- `Strict-Transport-Security`
- `Referrer-Policy`

---

## 4. Code Quality Issues

### 🔸 4.1 Massive Use of `eslint-disable` Comments

Files with `/* eslint-disable */`:
- `apps/web/src/lib/tunes.ts`
- `apps/web/src/lib/packs.ts`
- `apps/web/src/lib/factory.ts`
- `apps/web/src/lib/provider.tsx`
- `apps/web/src/lib/config.ts`
- `apps/web/src/components/FeaturedCarousel.tsx`
- `apps/web/src/components/SearchInput.tsx`
- `apps/web/src/components/ui/OmoButton.tsx`
- `apps/web/src/stores/notificationStore.ts`
- `apps/web/src/app/anime/[id]/page.tsx`

Using `/* eslint-disable */` at the file level disables all linting rules and defeats the purpose of having a linter. Almost all of these are unnecessary — the actual lint errors are minimal.

**Fix:** Remove file-level disable comments. Fix actual lint errors instead.

### 🔸 4.2 Extensive Use of `any` Types

Multiple files use `as any` type casts and `// @ts-expect-error` or `// @ts-ignore`:
- `auth.ts` — `handlers: any`, `auth: any`, `signIn: any`, `signOut: any`
- `transformers/src/anime.ts` — `as any` for images mapping
- `stores/notificationStore.ts` — `(n: any)` in fetch callback
- `FeaturedCarousel.tsx` — implicit any patterns

This defeats TypeScript's type safety entirely for the most critical paths.

### 🔸 4.3 Dead/Unused Code

1. **`packages/api-clients/src/anidb.ts`** — Entire module is a stub that returns `[]` and logs a warning. No AniDB integration is implemented.
2. **`packages/api-clients/src/stream-provider.ts`** — `ConsumetStreamProvider` class just throws errors. The Consumet Docker container is defined in `docker-compose.yml` but never used.
3. **`packages/db/src/client.ts`** — The `MemoryDb` class is a completely separate in-memory implementation that duplicates data stored in the real Postgres database. It's defined but never imported by any API route.
4. **`packages/db/src/index.ts`** — Both `db` (real Drizzle) and `client` (MemoryDb) are exported, creating confusion about which to use.
5. **`apps/web/src/lib/tunes.ts`** — `EXTENDED_TUNES` contains 15+ sound definitions (`lock`, `unlock`, `copy`, `undo`, `redo`, `delete`, `refresh`, etc.) that are never used in the UI.
6. **`apps/web/src/lib/pack-generator.ts`** — `generateCustomSoundPack()` is exported but never imported anywhere in the codebase.

### 🔸 4.4 Mock Data Instead of Real Implementation

**Files:**
- `apps/web/src/app/history/page.tsx` — Uses `MOCK_HISTORY` array instead of fetching from the database
- `apps/web/src/app/watchlist/page.tsx` — Uses `MOCK_WATCHLIST` array instead of calling the real `/api/watchlist` endpoint

Both pages have a real API route but choose to show static mock data. This means:
- Users never see their actual watchlist or history
- The API routes are implemented but untested
- The mock data includes hardcoded anime images from MAL CDN

### 🔸 4.5 Nested Project Directory

The project lives in `Omozoku/Omozoku/` — there's a nested directory structure with the same name. This suggests a git cloning or project setup issue that can confuse tooling and CI/CD pipelines.

---

## 5. Performance Issues

### 🔸 5.1 No ISR Configuration on Anime Detail Page

The anime detail page (`apps/web/src/app/anime/[id]/page.tsx`) is a **server component** that does NOT use `revalidate` or ISR (Incremental Static Regeneration). Every request fetches fresh data from Jikan. Since Jikan has strict rate limits (3 req/s), this will fail under load.

The `/api/anime/[id]` route DOES cache responses, but the page itself doesn't leverage ISR.

### 🔸 5.2 Unoptimized Font Loading

**File:** `apps/web/src/app/layout.tsx`  
Both the CSS import in `globals.css` AND a `<link>` tag in the `<head>` load the same Fontshare fonts. This results in redundant font requests.

### 🔸 5.3 No Image Optimization for External Images

**Files:** `apps/web/src/app/history/page.tsx`, `apps/web/src/app/watchlist/page.tsx`  
The mock data uses direct MAL CDN URLs. Next.js Image optimization for these is handled via `remotePatterns` in `next.config.js`, which is good. However, the anime detail page requests `jikanGetAnimePictures()` results and passes them directly, potentially loading large images without proper sizing.

### 🔸 5.4 Large Client-Side Bundle from Sensory UI

The Sensory UI sound system (`src/lib/*`) is roughly **2,500+ lines** of sound synthesis code that:
- Is loaded in the root layout via `SensoryUIProvider`
- Creates AudioContext on every page load
- Contains 9 complete sound packs with custom synthesizers
- Includes extensive hero sound compositions

This adds significant JS bundle weight to every page, including pages where sounds are never played (e.g., search results, settings, profile).

### 🔸 5.5 `useEffect` Data Fetching Without AbortController

Multiple client components use `useEffect` for data fetching without:
- AbortController cleanup on unmount
- Race condition handling (stale closure on fast navigation)
- Proper loading state transitions

**Affected files:**
- `apps/web/src/components/player/RecommendationsRail.tsx`
- `apps/web/src/components/player/EpisodeList.tsx`
- `apps/web/src/components/SearchInput.tsx`
- `apps/web/src/app/page.tsx` (home page)

---

## 6. Architecture & Design Issues

### 🔸 6.1 Database Client Architecture Confusion

There are **two separate database client implementations**:
1. `packages/db/src/index.ts` — Real Drizzle ORM with Postgres (used by most API routes)
2. `packages/db/src/client.ts` — `MemoryDb` in-memory mock (exported but **never imported** by any route)

The `index.ts` file exports both:
```ts
export { db } from './index';  // real Drizzle
export { getDb } from './client'; // in-memory mock
```

This creates confusion about which client to use. The memory client appears to be an early prototype that was replaced but not removed.

### 🔸 6.2 API Routes Bypass Caching Layer

**Files:** `apps/web/src/app/api/episodes/route.ts`, `apps/web/src/app/api/recommendations/route.ts`  
These routes fetch from Jikan directly without using the `CacheProvider` interface. They rely solely on Next.js `Cache-Control` headers for caching, which means:
- Cache doesn't persist across deployments
- In-memory cache (`MemoryCache`) is not utilized
- No cache key convention is followed

### 🔸 6.3 Inconsistent Error Response Format

Some API routes return errors as:
```json
{ "error": "CODE", "message": "Human readable" }
```

Others return:
```json
{ "error": "Human readable message" }
```

This inconsistency makes error handling on the client side unreliable.

### 🔸 6.4 No Centralized HTTP Client

The web app uses raw `fetch()` in multiple hooks and components instead of wrapping through the shared `apiFetch` utility from `@omozoku/api-clients`. This means:
- No consistent error handling
- No retry logic
- No rate limiting
- No structured logging

### 🔸 6.5 Watch Progress Uses Session ID Instead of User ID

**File:** `apps/web/src/app/api/progress/route.ts`  
The progress API uses a session ID cookie for unauthenticated users, but:
- The cookie is never actually set (the route handler acknowledges this with a comment)
- The client stores the session ID in localStorage instead
- This means progress is lost when clearing browser data
- There's no migration path from session-based to user-based progress

### 🔸 6.6 Redundant Styling System

CSS classes are defined in THREE places:
1. Tailwind utility classes directly in JSX
2. Custom CSS in `globals.css` (component-level styles for player, skeleton, scrollbar, etc.)
3. `style={{}}` inline styles with hardcoded values

The player styles in CSS (~300 lines) could be Tailwind utilities, reducing context switching.

---

## 7. Testing & Validation Issues

### 🔸 7.1 No Tests

The project has zero test files — no unit tests, integration tests, or E2E tests. Given the complexity of the Gogoanime scraper (AES decryption, multi-step embedding chain), the auth system, and the API routes, this is a significant risk.

### 🔸 7.2 No TypeScript Build Validation

The `typecheck` script exists in `turbo.json` but there's no CI pipeline configured to enforce it. Additionally, the `@ts-nocheck` in `auth.ts` would hide type errors even if typechecking ran.

### 🔸 7.3 No Lint Enforcement

Similarly, `lint` scripts exist but there's no pre-commit hook or CI check. The extensive `/* eslint-disable */` comments suggest lint would fail across most of the codebase.

---

## 8. Dependency Health

### 🔸 8.1 Outdated Major Dependencies

| Package | Current | Latest | Notes |
|---------|---------|--------|-------|
| Next.js | 14.2.29 | 15.x | App Router, major improvements |
| React | 18.3.0 | 19.x | Server components, actions |
| next-auth | 5.0.0-beta.31 | Stable | Beta version — possible breaking changes |
| zod | 4.4.3 | 4.x | Stable, but verify v4 compat |
| zustand | 5.0.14 | 5.x | OK for v5 |

### 🔸 8.2 Unused Dependencies

- **`framer-motion`** — Very large library (~115KB gzipped). Used extensively for animations. Consider `motion` (the standalone smaller library from the same team) as a lighter alternative.
- **`postgres`** — The Postgres driver used by Drizzle is listed in `packages/db/package.json` but Drizzle ORM already bundles a driver dependency.

### 🔸 8.3 `esbuild` / `unrs-resolver` Build Allowances

**File:** `pnpm-workspace.yaml`
```yaml
allowBuilds:
  esbuild: true
  unrs-resolver: true
```

These allow postinstall scripts to run for these packages. While common for build tools, they should be justified and documented.

---

## 9. Recommended Fixes (Priority Order)

### P0 — Fix Immediately

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| 🔴 | Remove hardcoded auth secret | 5 min | Security — prevents session forgery |
| 🔴 | Remove `@ts-nocheck` from auth.ts | 30 min | Security & type safety |
| 🔴 | Fix proxy URL validation | 1 hour | Security — prevent SSRF |
| 🔴 | Add rate limiting to auth routes | 2 hours | Security — prevent brute force |

### P1 — High Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| 🟠 | Remove all file-level `eslint-disable` and fix actual issues | 1 day |
| 🟠 | Replace `any` types with proper types across the codebase | 1–2 days |
| 🟠 | Remove dead code (AniDB stub, Consumet stub, MemoryDb, unused tunes, unused pack-generator) | 1 day |
| 🟠 | Implement real watchlist/history fetching (remove mock data) | 1 day |
| 🟠 | Add AbortController to all `useEffect` data fetches | 1 day |

### P2 — Medium Priority

| Priority | Issue | Effort |
|----------|-------|--------|
| 🟡 | Consolidate database client (remove MemoryDb) | 30 min |
| 🟡 | Add ISR to anime detail page | 1 hour |
| 🟡 | Remove duplicate font import | 5 min |
| 🟡 | Standardize API error response format | 2 hours |
| 🟡 | Use `apiFetch` across all client-side fetches | 1 day |
| 🟡 | Add security headers in Next.js config | 30 min |
| 🟡 | Increase bcrypt cost factor or migrate to argon2id | 30 min |

### P3 — Nice to Have

| Priority | Issue | Effort |
|----------|-------|--------|
| 🟢 | Add unit tests for scraper and transformers | 2 days |
| 🟢 | Set up CI pipeline (typecheck, lint, test) | 1 day |
| 🟢 | Add E2E tests for critical flows (auth, watch, search) | 3 days |
| 🟢 | Migrate framer-motion to `motion` (standalone) | 1 day |
| 🟢 | Create an `API_ERRORS` constant for standard error objects | 1 hour |
| 🟢 | Add OpenAPI/Swagger documentation for API routes | 2 days |
| 🟢 | Set up Sentry or similar error monitoring | 1 day |
| 🟢 | Add pre-commit hooks (husky + lint-staged) | 1 hour |
| 🟢 | Remove nested `Omozoku/Omozoku/` directory structure | 30 min |
| 🟢 | Create proper `.env.example` with all required variables documented | 30 min |

---

## 10. Summary

### What's Done Well
- Monorepo structure with clear package boundaries
- Comprehensive error handling in API clients (typed errors, retries, throttling)
- Caching abstraction that supports both memory and Redis
- TypeScript type definitions shared across packages
- Well-designed UI with custom dark theme, animations, and responsive layout
- Thoughtful sound design system (Sensory UI) with Web Audio API synthesis
- Functional video player with HLS support, subtitles, keyboard shortcuts, and gestures
- Good use of modern React patterns (server components, client boundaries)

### Biggest Risks
1. **Security**: Hardcoded auth secret, `@ts-nocheck` in auth module, no rate limiting, proxy SSRF risk
2. **Type Safety**: Widespread `any` types, disabled linting, disabled TypeScript checking
3. **Dead Code**: 500+ lines of unused code (AniDB, Consumet, MemoryDb, extended tunes, pack-generator)
4. **Mock Data**: Watchlist and history pages show fake data instead of real user data
5. **No Tests**: Zero test coverage for critical functionality (auth, scraper, API routes)
6. **Duplicate Database Clients**: Confusion between real Drizzle Postgres and in-memory mock
