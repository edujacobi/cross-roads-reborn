# Cross-Roads Reborn — Web Interface

A single-page web interface for the Cross-Roads Reborn Discord bot,
built with **Nuxt 3**, **Apollo Client**, and **GraphQL**.

---

## Authentication

Login is done via **Discord OAuth2**. After clicking "Login with Discord" on
the `/login` page you are redirected to Discord, then back to `/auth/callback`
where a signed JWT is stored in `localStorage`.

Roles are enforced both on the API server (GraphQL resolvers) and the frontend for Admin actions:

| Role      | Read | Write (mutations) |
|-----------|:----:|:-----------------:|
| Developer |  ✔  |        ✔         |
| Moderator |  ✔  |        ✔         |
| Helper    |  ✔  |        ✗         |

---

## Current status

The web interface is an active player-facing client as well as an admin tool.
It covers account and user management, the main game loops, gangs, casino
games, investments, and admin operations. The Discord bot and its API are
still required; replacing and deprecating the bot commands remains unfinished.

| Area              | Current coverage                                                                                                                                     |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------|
| Player features   | Account profile and settings, rankings, gangs, items and shops, jobs, bar, hospital, prison, scavenging, robberies, investments, casino, and updates |
| Admin features    | Dashboard, user search and actions, VIP management, events, season controls, and audit log                                                           |
| Remaining roadmap | Deprecate Discord bot commands after the web interface covers the required workflows                                                                 |

The app runs in Nuxt SPA mode and reads game data from the bot's GraphQL API.
The API server must be running for login and data-backed features to work.

---

## Environment Variables

The Nuxt scripts load `web-interface/.env.dev` and
`web-interface/.env.prod`. These files are local configuration; create them
manually and set the API URL:

```env
# web-interface/.env.dev — used by `npm run web:dev`
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

```env
# web-interface/.env.prod — used by `npm --prefix web-interface run generate`
NUXT_PUBLIC_API_BASE_URL=https://graphql.ejacobi.com.br
```

These scripts pass the corresponding file to Nuxt with `--dotenv`; they do not
use `web-interface/.env`.

The main bot also needs these set in its own `.env`:

```env
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=http://localhost:3001/auth/discord/callback
JWT_SECRET=...
FRONTEND_URL=http://localhost:3000
```

### Production domain

```env
# Bot/API server
DISCORD_REDIRECT_URI=https://crossroads.ejacobi.com.br/auth/discord/callback
FRONTEND_URL=https://crossroads.ejacobi.com.br
```

Add `https://crossroads.ejacobi.com.br/auth/discord/callback` to the OAuth2
redirect URLs in the Discord Developer Portal. The hosted frontend must be
able to reach the API at the configured API URL, and the API's `FRONTEND_URL`
must match the deployed site.

---

## Development

> Both the **bot/API server** and the **admin dev server** must be running
> simultaneously for the full experience.

### 1. Start the bot (which also starts the API server)

From the **project root**:

```powershell
npm run dev
```

The API server will be available at `http://localhost:3001`.

### 2. Start the web interface dev server

Still from the **project root**:

```powershell
npm run web:dev
```

The web interface will be available at `http://localhost:3000`.

---

## Production deployment

The production site is hosted as static files on CPanel. Generate the site:

```powershell
npm --prefix web-interface run generate
```

This uses `web-interface/.env.prod` and writes the deployable static site to
`web-interface/.output/public`. Upload the contents of that directory to the
CPanel document root. The published site still needs to reach the separately
running GraphQL/API server at the URL configured by
`NUXT_PUBLIC_API_BASE_URL`.

The generated output includes a hidden `.htaccess` file with cache rules. In
CPanel File Manager, enable **Show Hidden Files (dotfiles)** when uploading. If
the document root already has an `.htaccess`, merge these rules instead of
overwriting the existing file.

For local server-build checks, run:

```powershell
npm run web:build
```

This produces a Nuxt build in `web-interface/.output`; it is not the static
artifact used for the CPanel deployment.

## Available routes

| Routes                                                                                  | Features                                                     |
|-----------------------------------------------------------------------------------------|--------------------------------------------------------------|
| `/login`, `/auth/callback`                                                              | Discord login and OAuth callback                             |
| `/`, `/me`, `/rankings`, `/updates`                                                     | Dashboard, own profile, leaderboards, and updates            |
| `/users`, `/users/[id]`                                                                 | User search, profiles, history, and role-appropriate actions |
| `/gangs`, `/gangs/[id]`                                                                 | Gang creation, details, and management                       |
| `/casino`, `/casino/[game]`                                                             | Casino games and multiplayer sessions                        |
| `/items`, `/shop`, `/specialshop`, `/jobs`                                              | Item catalog, shops, and jobs                                |
| `/bar`, `/hospital`, `/prison`, `/cemetery`                                             | Player status and related actions                            |
| `/rob`, `/scavenge`, `/investments`                                                     | Robberies, scavenging, and investments                       |
| `/admin/dashboard`, `/admin/vips`, `/admin/events`, `/admin/season`, `/admin/audit-log` | Administrative dashboards and controls                       |

---

## Stack

- **Nuxt 3** with **Vue 3 Composition API** (SPA mode)
- **Apollo Client** + `@vue/apollo-composable` — GraphQL data fetching
- **Radix Vue** — accessible headless UI primitives (used in `BaseModal`)
- **SCSS** — custom design tokens and component styles (no Tailwind)
- **Lucide Vue Next** — icon set

## Motion and accessibility

- Shared motion uses SCSS and native Vue/Nuxt transitions; no animation library is required.
- The operating system's reduced-motion preference overrides the pause control and disables the control while active.
  Essential status text and controls remain available without animation.
- Decorative ambient effects pause while the tab is hidden. Pointer-following effects are limited to fine-pointer
  devices.
- Keep future animations short, transform/opacity based, and opt-in for decorative surfaces. Avoid animating layout or
  applying staggered entrances to frequently updated data.
