# Nepal Heritage Trails - Quick Setup

Use this guide after you remove `node_modules` and share the project.

## 1) Backend setup

```bash
cd backend
cp .env.example .env
# edit .env and set DATABASE_URL + other secrets
npm install
```

`npm install` runs `prisma generate` automatically (via `postinstall`).

### Prisma commands

Run these from `backend/`:

```bash
# Regenerate Prisma client
npm run prisma:generate

# Apply existing migrations to DB (recommended on shared/fresh DB)
npm run prisma:deploy

# Create and apply a new migration during development
npm run prisma:migrate -- --name your_migration_name

# Open Prisma Studio
npm run prisma:studio
```

Note: `prisma init` is only needed if `prisma/` does not exist. This repo already has `prisma/` and migrations.

If you still need it in a brand-new backend:

```bash
npx prisma init
```

### Start backend

```bash
npm run dev
```

## 2) Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

## 3) Typical run order

1. Start backend (`backend/npm run dev`)
2. Start frontend (`frontend/npm run dev`)
3. Open the frontend URL shown in terminal (usually `http://localhost:3000`)

