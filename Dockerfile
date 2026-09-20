FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENV PORT=3001
EXPOSE 3001
# APP_MODE must be staging|production at runtime. Missing secrets abort startup.
CMD ["npx", "tsx", "server/index.ts"]
