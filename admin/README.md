# Cross-Roads Reborn — Admin Panel

A single-page admin interface for the Cross-Roads Reborn Discord bot,
built with **Nuxt 3**, **Apollo Client**, and **GraphQL**.

---

## Authentication

Login is done via **Discord OAuth2**. After clicking "Login with Discord" on
the `/login` page you are redirected to Discord, then back to `/auth/callback`
where a signed JWT is stored in `localStorage`.

Roles are enforced both on the API server (GraphQL resolvers) and the frontend:

| Role        | Read | Write (mutations) |
|-------------|:----:|:-----------------:|
| Developer   |  ✔   |         ✔         |
| Moderator   |  ✔   |         ✗         |

---

## Environment Variables

Create a `.env` file inside `admin/` (or set these in your hosting provider):

```env
# URL of the running API server (defaults to localhost:3001)
NUXT_PUBLIC_API_BASE_URL=http://localhost:3001
```

The main bot also needs these set in its own `.env`:

```env
DISCORD_CLIENT_ID=...
DISCORD_CLIENT_SECRET=...
DISCORD_REDIRECT_URI=http://localhost:3001/auth/discord/callback
JWT_SECRET=...
ADMIN_FRONTEND_URL=http://localhost:3000
```

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

### 2. Start the admin dev server

Still from the **project root**:

```powershell
npm run admin:dev
```

The admin panel will be available at `http://localhost:3000`.

---

## Production Build

```powershell
npm run admin:build
```

Output is placed in `admin/.output/`. Start the production server with:

```powershell
node admin/.output/server/index.mjs
```

---

## Pages

| Route | Description |
|-------|-------------|
| `/login` | Discord OAuth login screen |
| `/auth/callback` | Handles the OAuth redirect and JWT storage |
| `/` | Dashboard — stats, status grid, language distribution |
| `/users` | Searchable, paginated user list |
| `/users/[id]` | Detailed user profile with admin action modals |

---

## Stack

- **Nuxt 3** (SPA mode) — routing and SSR framework
- **Apollo Client** + `@vue/apollo-composable` — GraphQL data fetching
- **Radix Vue** — accessible headless UI primitives (used in `BaseModal`)
- **SCSS** — custom design tokens and component styles (no Tailwind)
- **Lucide Vue Next** — icon set
