# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY packages/ ./packages/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build arguments for environment variables
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

# Build frontend and backend
RUN pnpm --filter frontend build
RUN pnpm --filter backend build

# Verify build outputs exist
RUN ls -la /app/packages/frontend/dist/ || echo "Frontend dist not found!"
RUN ls -la /app/packages/backend/dist/ || echo "Backend dist not found!"

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/frontend/package.json ./packages/frontend/
COPY packages/backend/package.json ./packages/backend/

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile

# Copy built applications
COPY --from=builder /app/packages/frontend/dist ./packages/frontend/dist
COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

# Expose port
EXPOSE 8080

# Start the application
CMD ["node", "packages/backend/dist/index.js"]
