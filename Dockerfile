FROM oven/bun:latest

WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

ENV HOST=0.0.0.0
EXPOSE 3000
CMD ["sh", "-c", "bun run preview -- --host $HOST --port ${PORT:-3000}"]
