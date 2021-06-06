FROM node:lts-alpine AS BUILD_IMAGE

RUN apk add git yarn

WORKDIR ./build

RUN ls
COPY package*.json yarn.lock ./

RUN yarn install

COPY . .

RUN yarn build

# Only transfer what we need
FROM node:lts-alpine

WORKDIR ./app

# copy from build image
COPY --from=BUILD_IMAGE ./build/*.json ./
COPY --from=BUILD_IMAGE ./build/dist ./dist
COPY --from=BUILD_IMAGE ./build/node_modules ./node_modules

CMD ["yarn", "start"]
