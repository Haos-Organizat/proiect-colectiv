# UniConnect frontend

React 19 + Vite + TypeScript + Tailwind v4, shadcn-style components, Phosphor icons, React Hook Form + Zod.
Design rules: [`brand_guidelines.md`](../brand_guidelines.md). Backend contract: [`docs/api-contract.md`](../docs/api-contract.md).

## Run it

```bash
cd frontend
npm install
cp .env.example .env.local   # then pick mock or real mode below
npm run dev                  # http://localhost:5173
```

### Mock mode (no backend needed)

In `frontend/.env.local`:

```
VITE_USE_MOCKS=true
```

Every `/api` call is answered in the browser by `src/api/mock/` with seed events and photos from `public/mock/events/`. Purchases, new accounts and organizer events are saved in `localStorage`, so they survive a reload. A strip at the top of the page reminds you that mock mode is on.

Demo accounts (mock mode only):

| Role      | Email                       | Password     |
| :-------- | :-------------------------- | :----------- |
| Student   | `student@uniconnect.test`   | `student123` |
| Organizer | `organizer@uniconnect.test` | `student123` |

You can also register a new account; tick "I organize events" to get an organizer account.
To wipe mock data, run `ucResetMocks()` in the browser console. To see loading skeletons, slow the mock down with `localStorage.setItem('uc-mock-latency', '3000')` and reload (remove the key to go back to normal).

### Real mode (with the Flask API)

Set `VITE_USE_MOCKS=false` (or remove it) and run the full stack from the repo root with `just dev`. Requests go to `/api/v1/...`, which Vite proxies to Flask on port 5000. Restart `npm run dev` after changing `.env.local`.

## Pages

| Path                         | Page                                  | Access                       |
| :--------------------------- | :------------------------------------ | :--------------------------- |
| `/`                          | Home                                  | everyone                     |
| `/events`                    | Event list, search, category filter   | everyone                     |
| `/events/:slug`              | Event detail and ticket purchase      | everyone, buying needs login |
| `/login`, `/register`        | Auth                                  | logged out                   |
| `/account/tickets`           | My tickets with QR codes              | logged in                    |
| `/organizer`                 | Organizer dashboard (sales per event) | organizers                   |
| `/organizer/events/new`      | Create event                          | organizers                   |
| `/organizer/events/:id/edit` | Edit, publish or cancel event         | organizers                   |

## For the backend team

Everything the frontend calls is in [`docs/api-contract.md`](../docs/api-contract.md): endpoints, request and response shapes, error format, and side effects (emails, QR payloads). The mock in `src/api/mock/server.ts` behaves like that contract, so it is a working reference. Shared types live in `src/types/api.ts`, validation rules in `src/types/schemas.ts`.

## Where things live

```text
src/api/client.ts       request(): the only place that calls fetch, switches to mocks
src/api/endpoints.ts    one function per backend endpoint
src/api/mock/           fake backend + seed data for VITE_USE_MOCKS=true
src/components/ui/      Button, Field + Input/Select/Textarea/Checkbox, Badge
src/components/         Header, footer, EventCard, TicketCard, page states
src/pages/              one file per screen, organizer screens in pages/organizer/
src/types/              API types and Zod form schemas
```

## Rules of thumb

- Fetch only through `src/api/endpoints.ts`, with relative `/api` paths. Never hardcode a host.
- Forms use React Hook Form + a Zod schema from `src/types/schemas.ts`, wrapped in `<Field>` so errors show inline and are announced.
- Inputs stay at 16px or larger, or iOS zooms the page. Use the custom `Select`, `DatePicker` and `TimeSelect`, never native pickers.
- Every page renders `<Seo title description />` (`src/components/Seo.tsx`); private pages add `noindex`. Event pages also output schema.org Event data.
- While data loads, show a content-shaped skeleton from `src/components/Skeletons.tsx`, not a spinner.
- Before a PR: `npm run lint`, `npx tsc -b`, `npm run build`.
