# ------------------------
# Stage 1: Dependencies
# ------------------------
FROM node:lts-alpine AS deps

WORKDIR /app

# Enable corepack and install PNPM
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy lockfile and manifest
COPY pnpm-lock.yaml package.json ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# ------------------------
# Stage 2: Build
# ------------------------
FROM node:lts-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install NestJS CLI globally (only used during build)
# Set global bin path for pnpm global installs
ENV PNPM_HOME="/root/.local/share/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN pnpm add -g @nestjs/cli

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=deps /app/package.json ./package.json

# Copy source files
COPY . .

# Build the target app
ARG APP_NAME=tel-bot
RUN pnpm build

# ------------------------
# Stage 3: Runtime
# ------------------------
FROM node:lts-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

# Copy .env.production env file (optional)
COPY .env.production .env
# Expose default port
#EXPOSE 3000

# Start app
CMD ["node", "dist/apps/tel-bot/main.js"]
