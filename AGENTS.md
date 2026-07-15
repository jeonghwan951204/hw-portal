# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — Vite dev server with HMR (defaults to `.env.development`, API at `http://localhost:8080`)
- `npm run build` — production build; `npm run build:staging` / `npm run build:prod` build against `.env.staging` / `.env.production`
- `npm run lint` — ESLint over the repo. Lint a subset with `npx eslint <path>`.
- `npm run preview` — serve the built `dist/`

There is no test runner configured in this project.

## Working Conventions (from `.aiassistant/rules/`)

`.aiassistant/rules/common_rules.md` and `react_rules.md` are marked `apply: always`. The points that actually change how you work here:

**Communication & verification**
- **Respond in Korean**, and explain code changes in Korean.
- After editing, give: (1) a brief summary, (2) the list of modified files, (3) important notes/assumptions, (4) whether build/lint/tests were run.
- **Do not run** build, compile, lint, install, migration, or deployment commands (`npm run build`, `npm test`, `npm install`, `./gradlew …`, Docker, etc.) unless explicitly requested. For normal edits, change code only. If verification would help, suggest the command instead of running it, and state: "Build, compile, lint, and tests were not run because they were not requested."
- Do not modify lock files unless an install was explicitly requested and performed.

**Scope discipline**
- Keep changes minimal and focused on the request. Do not refactor unrelated code, rename components/files/routes/public APIs, or reorganize folders unless explicitly asked.
- Use `rg` (ripgrep, installed) for searching. Before editing, inspect related files, existing usages, and nearby patterns — don't rely only on the open file when a change may affect others.
- Match existing style, naming, and folder structure; place new files in the most appropriate existing directory.

**Patterns (do not introduce new ones)**
- No new dependencies, state-management libraries, API clients, form libraries, UI/CSS frameworks, or styling systems unless explicitly requested. Reuse the existing patterns described in Architecture below.
- This is a JavaScript project — do not convert files to TypeScript.
- API logic stays in the feature's `api/` layer; stateful logic in `hooks/`; pure formatting/parsing/validation in `utils/`. Keep page `index.jsx` focused on composition. Derive values instead of duplicating them into state.
- When rendering API-based data, handle loading / success / error / empty states. Reuse shared components, classes, and layout patterns rather than duplicating them.

**Security**
- Never hardcode secrets, tokens, credentials, private IPs, or environment-specific values — use the existing `.env` / `VITE_*` pattern. Don't log sensitive values. Be especially careful when touching auth, tokens, CORS, or route guards (see Auth & route protection below).

## Environment Config

API base URL comes from `VITE_API_BASE_URL` (per-mode `.env.*` files), read once in [src/utils/api.js](src/utils/api.js) as `BASE_URL`. Never hardcode API hosts — all requests go through `apiFetch`, which prepends `BASE_URL`.

## Architecture

React 19 SPA (Vite + React Router 7 + Tailwind CSS v4). No backend in this repo — it talks to an external API.

### Auth & route protection

Auth is token-based with a manual refresh flow, split across three files:

- [src/utils/auth.js](src/utils/auth.js) — pure `localStorage` accessors for `accessToken` (1-day), `refreshToken` (indefinite), and `role`. No network logic.
- [src/utils/api.js](src/utils/api.js) — `apiFetch(path, options)` is the **only** way to call the API. It attaches `Authorization: Bearer <accessToken>`, and on a `401` automatically refreshes via `refreshToken` and retries once. Concurrent 401s share a single in-flight refresh (`refreshPromise`). A failed refresh clears all tokens.
- [src/components/RequireAuth.jsx](src/components/RequireAuth.jsx) — route guard. Presence of `refreshToken` means "logged in" (refresh token never expires); optional `roles` array gates by `role`. Renders a blocked-state card instead of redirecting.

All app routes are wrapped in `<RequireAuth roles={["USER","ADMIN"]}>` in [src/App.jsx](src/App.jsx). There is no login page — users are onboarded through share-link signup (`/signup/:linkId`), which calls `saveTokens` on success.

### Feature-folder pattern

This is the key structural convention. Simple pages are single files in `src/pages/` (e.g. `NoticePage.jsx`). **Complex pages are split into a self-contained folder** following the pattern established by [src/pages/price/](src/pages/price/) and [src/pages/priceManagement/](src/pages/priceManagement/):

```
src/pages/<feature>/
├── index.jsx        # thin page: composes components + the hook, no business logic
├── constants.js     # field maps, page sizes, pure parse helpers
├── api/             # functions that call apiFetch and return res.json()
├── hooks/           # one custom hook holding all state + handlers; returns props grouped by section
└── components/      # presentational components, each fed a destructured group from the hook
```

The hook returns a single object whose keys (e.g. `average`, `history`, `rateModal`) are spread directly into the matching child components (`<AverageCalculator {...average} />`). When splitting a monolithic page, mirror this layout. `index.jsx` is imported via the folder (`./pages/price`), so the route import points at the directory.

### Shared layer

- [src/components/](src/components/) — cross-feature UI: `Header`, `Pagination` (reused by feature folders rather than re-implemented).
- [src/utils/format.js](src/utils/format.js) — `formatUSD`, `formatRate`, `formatKRW` display formatters.
- [src/utils/validate.js](src/utils/validate.js) — `normalizeDateRangeChange` / `getDateRangeLimits` for the start/end date-range filters used across list pages.

Prefer reusing these shared modules over per-feature duplicates.
