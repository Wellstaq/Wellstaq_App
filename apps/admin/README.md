# Wellstaq admin console

Internal console for Wellstaq staff at `admin.wellstaq.com`. Next.js 15 (App Router), Tailwind CSS v4 and the shared `@wellstaq/ui` design system, so it looks and behaves like the organization app.

## What admins can do

| Section | Route | Capabilities |
| --- | --- | --- |
| Overview | `/` | Platform totals, newest organizations, upcoming platform events |
| Organizations | `/organizations`, `/organizations/[id]` | Search and filter organizations; view profile, branches, employees, departments, clubs and events; suspend or reactivate an organization; suspend, reactivate or send a password reset to an employee |
| Individual users | `/individuals` | B2C users without an organization: search, view, suspend, reactivate, send a password reset |
| Platform events | `/events`, `/events/[id]` | Create, edit, cancel and delete events for everyone, individual users only, all employees, or chosen organizations |
| Support | `/support` | Tickets from Contact Support; change their status (uses the live `/app-admin/support/tickets` endpoint) |
| Admin team | `/team` | Invite admins, change roles, remove access (super admins only) |
| Audit log | `/audit-log` | Read-only history of every admin action |

**Privacy boundary:** the console never requests or shows wellbeing scores, pulse check-ins, event participant identities, club member lists or messages. Only totals are shown. The backend must enforce this too; see the contract.

## How it talks to the backend

```
Browser  →  /api/admin/*  (same-origin proxy in this app)  →  ${BACKEND_API_URL}/app-admin/*
```

- Tokens are stored only in httpOnly, SameSite=Strict cookies. Browser JavaScript never sees them.
- The proxy can only reach the `/app-admin` namespace, rejects unsafe paths and cross-origin writes, and refreshes expired access tokens server side.
- `services/admin-api.ts` lists every call. `types/admin.ts` holds every response shape.

The full backend contract, written for the backend developer, is in [`docs/ADMIN_API_CONTRACT.md`](docs/ADMIN_API_CONTRACT.md). No admin endpoints exist yet except support tickets; every screen shows its error state until its endpoint is live.

## Local development

```bash
cp .env.example .env.local
npm run dev            # http://localhost:3001
```

Set `ADMIN_PREVIEW_MODE="true"` to walk through every screen without a backend (empty lists, writes refused).

## Checks

```bash
npm run check          # lint, typecheck, unit tests, production build
```
