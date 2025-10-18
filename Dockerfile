# Dockerfile for backend service (packages/backend)
# Uses Node 20 on Debian slim. Installs build tools for better-sqlite3.

FROM node:20-slim

# Install system deps needed for native modules (better-sqlite3)
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy only manifests first to leverage Docker layer caching
COPY package.json package-lock.json ./
COPY packages/backend/package.json packages/backend/package.json
COPY packages/frontend/package.json packages/frontend/package.json

# Install workspace dependencies (including devDeps, required for src-node at runtime)
RUN npm ci

# Copy the rest of the repository
COPY . .

# Ensure the default SQLite data directory exists
RUN mkdir -p packages/backend/data \
  && chown -R node:node /app

# Switch to non-root user provided by the base image
USER node

# Set working directory to backend to match CWD-dependent DB/migrations paths
WORKDIR /app/packages/backend

# Expose default HTTP port
EXPOSE 3000

# Persist database by default; you can bind mount a host dir to this path
VOLUME ["/app/packages/backend/data"]

# Start the backend (uses src-node --transpile-only src/nest/main.src)
CMD ["npm", "run", "start"]
