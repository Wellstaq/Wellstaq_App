# Wellstaq web

Monorepo for Wellstaq's web front ends. It uses npm workspaces.

| Path | What it is | Deployed at |
| --- | --- | --- |
| [`apps/org`](apps/org) | Organization (B2B) app: marketing site, onboarding and the organization dashboard | `app.wellstaq.com` |
| [`apps/admin`](apps/admin) | Internal super admin console for Wellstaq staff | `admin.wellstaq.com` |
| [`packages/ui`](packages/ui) | Shared design tokens (`theme.css`) and UI primitives (Button, Input, Modal, Drawer and more) | Used by both apps |

The employee mobile app lives in a separate repository (`yemiSage/Wellstaq_Employee`).

## Getting started

```bash
npm ci                 # installs every workspace from the root
npm run dev:org        # http://localhost:3000
npm run dev:admin      # http://localhost:3001
```

Each app reads its own `.env.local`. Copy `apps/<app>/.env.example` to `apps/<app>/.env.local` first.

To try the admin console without a backend, set `ADMIN_PREVIEW_MODE="true"` in `apps/admin/.env.local`. Lists come back empty, counts are zero and changes are refused. Preview mode is ignored in production.

## Quality checks

```bash
npm run check:org      # lint, typecheck, build
npm run check:admin    # lint, typecheck, unit tests, build
```

## Deploying the two subdomains

Create two projects on your host (for example two Vercel projects) from this one repository:

| Project | Root directory | Domain | Required environment |
| --- | --- | --- | --- |
| Organization app | `apps/org` | `app.wellstaq.com` | See `apps/org/.env.example` |
| Admin console | `apps/admin` | `admin.wellstaq.com` | `BACKEND_API_URL` (HTTPS) and, until admin login ships, `APP_ADMIN_API_KEY` |

Each project builds and deploys on its own. A change to `packages/ui` affects both apps, so both should redeploy.

The admin console's session cookies are host-only, so they are never sent to `app.wellstaq.com`. Its pages are marked `noindex` and can't be framed.

## Shared design system

Design tokens live in `packages/ui/src/theme.css` and both apps import it from their `globals.css`. Add new shared components to `packages/ui/src/` and import them as `@wellstaq/ui/<file>`. The organization app's `components/ui/*` files re-export the shared primitives so existing imports keep working.
