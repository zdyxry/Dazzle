# AGENTS.md — Dazzle

## Build & Dev Commands
- `npm run dev` — Start Vite dev server (port 5173, proxies `/*/api/*` to backend at `127.0.0.1:5001`)
- `npm run build` — Type-check with `tsc` then build with Vite
- `npm run lint` — ESLint for `.ts`/`.tsx` files (zero warnings enforced)
- No test framework is configured.

## Architecture
Dazzle is a React 18 + TypeScript SPA and PWA frontend for [Fava](https://github.com/beancount/fava) (Beancount). It consumes Fava's REST API (`/<ledger>/api/<endpoint>`). There is no backend code in this repo.
- **src/pages/** — Route-level page components (Dashboard, Journal, Assets, etc.)
- **src/components/ui/** — Reusable shadcn/ui-style primitives (Button, Card, Dialog, etc.)
- **src/components/charts/** — ECharts chart wrappers
- **src/lib/api.ts** — All API calls via `fetchApi`/`putApi` helpers; responses unwrap `.data`
- **src/lib/queries.ts** — TanStack React Query hooks wrapping `api.*` calls
- **src/stores/ledger.ts** — Zustand store for current ledger state
- **src/hooks/** — Custom hooks (`useLedger`, `useTheme`)
- **src/types/index.ts** — Shared TypeScript interfaces

## Code Style
- **Imports**: Use `@/*` path alias (maps to `src/*`). Prefer named exports.
- **Styling**: Tailwind CSS + `cn()` utility from `@/lib/utils` (clsx + tailwind-merge). Use CSS variables for theme colors (shadcn/ui convention). Dark mode via `class` strategy.
- **State**: Zustand for global state, TanStack React Query for server state.
- **Components**: Functional components with TypeScript. UI primitives use `cva` (class-variance-authority) + `React.forwardRef`. Radix UI for accessible primitives.
- **TypeScript**: Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`).
- **Formatting**: Locale is `zh-CN` for number/date formatting. Comments may be in Chinese.
