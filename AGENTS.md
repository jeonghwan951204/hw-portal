# AGENTS.md

This file provides guidance to AI coding agents (Codex, Claude Code, etc.) when working with code in this repository. `CLAUDE.md` is a symlink to this file — edit `AGENTS.md` only.

This repo lives in the `/srv/docker/hw-project` workspace together with its sibling repo. Workspace-wide rules (cross-repo API contracts, dev deploy procedure, Docker whitelist, Git, glossary) are in `../AGENTS.md`; read it first if your tool did not load it automatically.

## 응답 언어: 한국어

**사용자에게 보이는 모든 글은 한국어로 쓴다.** 이 문서나 코드, 도구 출력이 영어여도 마찬가지다.

- 대상: 최종 답변, 작업 중 진행 상황 알림, 질문과 확인 요청, 작업 보고, 계획, 오류 설명, 커밋 메시지, PR 설명, 문서.
- 영어로 두는 것: 코드, 식별자(클래스·함수·변수·API 경로), 명령어, 파일 경로, 로그·오류 원문 인용. 인용한 원문은 한국어로 풀어서 설명한다.
- 영어로 답하기 시작했으면 알아차린 즉시 한국어로 바꿔 이어 쓴다.

## Commands

- `npm run dev` — Vite dev server with HMR (`.env.development`, API at `http://localhost:8080`). Normal work is checked on the dev deploy instead (see Deployment).
- `npm run build` — production build; `npm run build:staging` / `npm run build:prod` build against `.env.staging` / `.env.production`
- `npm run lint` — ESLint over the repo. Lint a subset with `npx eslint <path>`.
- `npm run preview` — serve the built `dist/`

There is no test runner configured in this project.

## Working Conventions

Language, report format, which commands may run, dev deploy, Docker, Git, scope, and security rules: `../AGENTS.md`. Frontend-specific rules (from `.aiassistant/rules/react_rules.md`):

- Do not modify `package-lock.json` unless an install was explicitly requested and performed.
- No new dependencies, state-management libraries, API clients, form libraries, UI/CSS frameworks, or styling systems unless explicitly requested. Reuse the existing patterns described in Architecture below.
- This is a JavaScript project — do not convert files to TypeScript.
- API logic stays in the feature's `api/` layer; stateful logic in `hooks/`; pure formatting/parsing/validation in `utils/`. Keep page `index.jsx` focused on composition. Derive values instead of duplicating them into state.
- When rendering API-based data, handle loading / success / error / empty states. Reuse shared components, classes, and layout patterns rather than duplicating them.
- Be especially careful when touching auth, tokens, or route guards (see Auth & route protection below).

## Environment Config

API base URL comes from `VITE_API_BASE_URL` (per-mode `.env.*` files), read once in [src/utils/api.js](src/utils/api.js) as `BASE_URL`. Never hardcode API hosts — all requests go through `apiFetch`, which prepends `BASE_URL`.

| Where | Build mode | API (`VITE_API_BASE_URL`) |
|---|---|---|
| Dev server container (`:13000`) | `staging` (`.env.staging`) | `https://dev-api.jeongcloud.cloud` — the dev backend, dev DB |
| Production (S3 + CloudFront) | `production` (`.env.production`) | `https://api.hojaemetal.com` — production data |
| `npm run dev` (local) | `development` (`.env.development`) | `http://localhost:8080` |

Work against real data from the dev backend. Do not write mock data or mock API branches; the dev server has the data you need.

## Architecture

React 19 SPA (Vite + React Router 7 + Tailwind CSS v4). Domain terms: `../hw-back/GLOSSARY.md`. The backend is the sibling repo `../hw-back` (Kotlin/Spring Boot) in the same workspace; for cross-repo API contracts (auth, error codes, CORS, backend `*-frontend.md` handoff docs) see `../AGENTS.md`.

### Auth & route protection

Auth is token-based with a manual refresh flow, split across three files:

- [src/utils/auth.js](src/utils/auth.js) — pure `localStorage` accessors for `accessToken` (1-day), `refreshToken` (indefinite), and `role`. No network logic.
- [src/utils/api.js](src/utils/api.js) — `apiFetch(path, options)` is the **only** way to call the API. It attaches `Authorization: Bearer <accessToken>`, and on a `401` automatically refreshes via `refreshToken` and retries once. Concurrent 401s share a single in-flight refresh (`refreshPromise`). A failed refresh clears all tokens.
- [src/components/RequireAuth.jsx](src/components/RequireAuth.jsx) — route guard. Presence of `refreshToken` means "logged in" (refresh token never expires); optional `roles` array gates by `role`. Renders a blocked-state card instead of redirecting.

All app routes are wrapped in `<RequireAuth roles={["USER","ADMIN"]}>` in [src/App.jsx](src/App.jsx); `/admin/**` routes add `roles={["ADMIN"]}`. There is no login page — users are onboarded through share-link signup (`/signup/:linkId`), which calls `saveTokens` on success. `src/pages/LoginPage.jsx` is an old Spring form-login screen that is **not routed**; do not wire it up or use it as a reference. `KakaoInAppBrowserGuard` wraps the app and asks KakaoTalk in-app browser users to open an external browser.

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

### Pages

Routes are declared in [src/App.jsx](src/App.jsx). Feature folders map to backend packages like this:

| Route | Folder | Backend |
|---|---|---|
| `/` | `pages/priceManagement/` | `site` (per-company price boards) |
| `/lme` | `pages/price/` | `price` (LME, FX) |
| `/contract`, `/contract/new`, `/contract/:id`, `/contract/:id/edit` | `pages/contract/` | `contract` |
| `/weighing` | `pages/weighing/` | `inventory/sync` (weighing records, mapping, tickets, sync requests) |
| `/transactions`, `/transactions/new` | `pages/transaction/` | `inventory/transaction`, `inventory/plan` (trade plans, payment status) |
| `/inventory` | `pages/inventory/` | `inventory/stock` |
| `/companies`, `/companies/new`, `/companies/:id/edit` | `pages/companies/` | `company` |
| `/items` | `pages/items/` | `item` |
| `/admin` | `pages/admin/` | `auth/admin` (members, share links) |
| `/admin/discord-messages/...` | `pages/discordMessage/` | `messages/discord` |
| `/notice`, `/documents` | `NoticePage.jsx`, `DocumentsPage.jsx` | — |
| `/signup`, `/signup/:linkId` | `SignupPage.jsx` | `auth` |

### Shared layer

Reuse these before writing a new one:

- [src/components/](src/components/):
  - `AppLayout` — layout after login (sidebar + content).
  - `Sidebar` — side menu; add a menu entry here when adding a page.
  - `PageContainer` — page width, padding, and section spacing.
  - `PageHeader` — page title, description, and action buttons.
  - `Button` — button variants and sizes.
  - `Modal` — modal frame.
  - `ConfirmModal` — confirm dialog for create/update/delete (`danger` for destructive).
  - `Tabs` — segmented tabs.
  - `Pagination` — page numbers.
- [src/hooks/useConfirm.js](src/hooks/useConfirm.js) — opens `ConfirmModal` instead of `window.confirm`.
- [src/utils/format.js](src/utils/format.js) — `formatUSD`, `formatRate`, `formatKRW` display formatters.
- [src/utils/validate.js](src/utils/validate.js) — `normalizeDateRangeChange` / `getDateRangeLimits` for the start/end date-range filters used across list pages.

### Enum options

Select, radio, and filter options for enums come from the backend's `GET /api/enums/{group}` (`[{value, label}]`), through the feature's `api/enumsApi.js` (see `pages/contract/api/enumsApi.js`, `pages/companies/api/enumsApi.js`). A copy in `constants.js` is only a fallback for when the request fails. If a needed enum is not served by `/api/enums`, add the group on the backend (see `../hw-back/AGENTS.md` → Conventions) instead of hardcoding labels.

## Deployment

Dev deploy, Docker whitelist, and production flow: `../AGENTS.md`. Frontend-specific: the dev container builds with `npm run build -- --mode ${FRONTEND_BUILD_MODE}` (`staging` on the dev server, see Environment Config) and serves `dist/` via nginx (`nginx.conf`, SPA fallback to `index.html`). A build error fails the deploy, so the dev deploy doubles as the build check.

## Agent skills

### Issue tracker

Issues are tracked in this repo's GitHub Issues (`gh` CLI). See `docs/agents/issue-tracker.md`.

### Triage labels

Default five-role vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

The glossary is shared with the backend and lives at `../hw-back/GLOSSARY.md` (there is no `GLOSSARY.md` in this repo). Use its terms in UI text and names, and update it whenever a feature is added or changed (rules: `../AGENTS.md` → 도메인 문서). Frontend ADRs go in `docs/adr/`. See `docs/agents/domain.md`.
