# ---------- Base ----------
FROM node:22-alpine AS base

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable \
  && corepack prepare pnpm@10.20.0 --activate


# ---------- Development ----------
FROM base AS development

ENV NODE_ENV=development

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma generate

EXPOSE 8000

CMD ["pnpm", "run", "start:dev"]


# ---------- Builder ----------
FROM base AS builder

ENV NODE_ENV=production

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile --prod=false


COPY . .

# Prisma generate does not need a real database connection
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN pnpm prisma generate

RUN pnpm run build

# Remove dev dependencies
RUN pnpm prune --prod


# ---------- Production ----------
FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl libc6-compat \
  && addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nestjs

ENV NODE_ENV=production

# Application
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Production dependencies
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules

# Package metadata
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json

# Prisma schema + migrations
COPY --from=builder --chown=nestjs:nodejs /app/prisma.config.ts ./prisma.config.ts
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Generated Prisma client

USER nestjs

EXPOSE 8000

# Run migrations, seed database, then start NestJS
CMD ["sh", "-c", "npm run prisma:migrate:deploy && node dist/prisma/seed && node dist/src/main.js"]