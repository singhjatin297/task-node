# Task Manager App

A small full-stack task manager built to practice authentication, API routes, a Go backend, PostgreSQL, and Docker with a Next.js frontend.

## What This Project Does

- redirects users to login or dashboard based on the refresh-token cookie
- logs users in with JWT-based access and refresh tokens
- stores users and tasks in PostgreSQL
- lets authenticated users create, update, list, and soft-delete tasks
- runs locally with Docker Compose

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- PostgreSQL
- Docker Compose
- `jose` for JWT handling

## Project Goal

This project was built as a learning exercise for:

- connecting a Next.js app to a backend service
- understanding Docker images, containers, networks, and volumes
- handling simple authentication with access and refresh tokens

## Environment Variables

Create a `.env` file from `.env.example`.

Required variables:

```env
BACKEND_URL="http://back:8080"
NEXT_LOGIN_ACCESS_SECRET="replace-with-a-long-random-string"
NEXT_LOGIN_REFRESH_SECRET="replace-with-a-different-long-random-string"
```

## Run Locally Without Docker

Install dependencies:

```bash
pnpm install
```

Start the app:

```bash
pnpm dev
```

The app runs on [http://localhost:3002](http://localhost:3002).

## Run With Docker

Build and start the containers:

```bash
docker compose -f Compose.yml up --build
```

Services:

- web: `http://localhost:3004`
- back: `http://localhost:8080`
- redis: `localhost:6379`

If you want a fresh database volume while learning:

```bash
docker compose -f Compose.yml down -v
docker compose -f Compose.yml up --build
```

## API Routes

Main route handlers live in `app/api`:

- `/api/login`
- `/api/logout`
- `/api/refresh`
- `/api/tasks`

## Known Limitations

- `script.ts` is treated as a local scratch/seed script and is ignored from Git
- Docker uses a simple development setup and is not production-hardened

## What I Learned

You can update this section with your own notes. A good README does not need to be fancy. It should clearly answer:

- what the project is
- why you built it
- how to run it
- what stack it uses
- what is incomplete or intentionally simple

## Before Pushing To GitHub

Recommended checks:

```bash
git status
pnpm lint
```

Make sure you are not committing:

- `.env`
- `.next`
- `node_modules`
- local Docker volumes
- temporary seed or scratch files
