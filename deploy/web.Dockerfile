# Multi-stage build pour Next.js standalone — image finale ~150 MB

FROM node:24-alpine AS deps
WORKDIR /app
RUN corepack enable pnpm
COPY web/package.json web/pnpm-lock.yaml* web/pnpm-workspace.yaml ./web/
COPY tokens/package.json ./tokens/
RUN cd web && pnpm install --frozen-lockfile --config.confirmModulesPurge=false --ignore-scripts

FROM node:24-alpine AS builder
WORKDIR /app
RUN corepack enable pnpm
COPY --from=deps /app/web/node_modules ./web/node_modules
COPY tokens ./tokens
COPY web ./web
RUN cd tokens && pnpm install && pnpm build
RUN cd web && pnpm build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
RUN addgroup -S nextjs && adduser -S nextjs -G nextjs
COPY --from=builder --chown=nextjs:nextjs /app/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/web/.next/static ./web/.next/static
COPY --from=builder --chown=nextjs:nextjs /app/web/public ./web/public
USER nextjs
EXPOSE 3000
CMD ["node", "web/server.js"]
