FROM node:lts-alpine

# Install ffmpeg
RUN apk add --no-cache ffmpeg

WORKDIR /usr/src/app
COPY package.json .
RUN npm install
COPY . ./
RUN npm run build

CMD [ "npm", "start" ]
