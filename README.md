# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

The current development is done for mobile view. Desktop comes later.

## Project structure

- `app/` – application source
  - `assets/` – styles and design tokens
  - `components/` – auto-imported Vue components
  - `composables/` – reusable composables
  - `layouts/` – page layouts
  - `pages/` – file-based routes
  - `middleware/`, `plugins/`, `utils/` – empty for now
- `shared/types/` – types shared by app and server
- `public/` – static files and images
- `server/` – backend (Nitro)
  - `api/` – API routes, file-based (`/api/...`)
  - `data/` – fake data until a database is added
  - `utils/` – auto-imported server helpers and data access
  - `middleware/`, `plugins/` – empty for now

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```
