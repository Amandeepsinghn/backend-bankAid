FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# drizzle-kit is a regular dependency (not devDependency) specifically so `npm run db:migrate`
# can run in this same image as the platform's release/pre-deploy command.
COPY package.json package-lock.json ./
RUN npm ci

COPY --from=build /app/dist ./dist
COPY drizzle ./drizzle
COPY drizzle.config.ts ./

EXPOSE 8000
CMD ["node", "dist/server.js"]
