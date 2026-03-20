FROM node:22-bookworm-slim

# Install ffmpeg, python3, and venv support
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg python3 python3-venv && \
    rm -rf /var/lib/apt/lists/*

# Enable corepack for pnpm
RUN corepack enable

WORKDIR /app

# Install dependencies (express/canvas/tsx are in devDependencies, so install all)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Set up Demucs for vocal removal (remove these lines to save ~2GB if not needed)
COPY server/setup-demucs.sh server/setup-demucs.sh
RUN bash server/setup-demucs.sh

# Copy source (server + shared only needed, but simpler to copy all)
COPY . .

EXPOSE 3001
CMD ["node", "--import", "tsx", "server/index.ts"]
