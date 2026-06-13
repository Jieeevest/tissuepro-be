FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock ./
RUN apk add --no-cache openssl && bun install --frozen-lockfile

COPY prisma ./prisma
RUN bunx prisma generate

COPY . .

EXPOSE 5176

CMD ["bun", "run", "start"]
