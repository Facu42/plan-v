FROM node:24-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA
ENV PORT=3001
EXPOSE 3001
# API default. Worker: override CMD to `npx tsx server/jobs/worker-main.ts` and set WORKER_SEPARATE=1 on the API.
# APP_MODE must be staging|production at runtime. Missing secrets abort startup.
CMD ["npx", "tsx", "server/index.ts"]
