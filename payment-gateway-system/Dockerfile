FROM node:12.19.0-alpine3.9 AS build
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# remove development dependencies
RUN npm prune --production

##
FROM node:12.19.0-alpine3.9
# Liquibase runs on bash and needs jre
RUN apk add --no-cache bash openjdk8-jre-base

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/.env.* .
COPY --from=build /usr/src/app/dist ./dist
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/config ./config

CMD ["node", "dist/main"]
