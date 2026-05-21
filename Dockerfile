FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

ENV HOST=0.0.0.0
EXPOSE 3000
CMD ["sh", "-c", "npm run preview -- --host $HOST --port ${PORT:-3000}"]
