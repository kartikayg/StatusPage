# use node 8 (latest version so far)
FROM node:8.9.0

MAINTAINER Kartikay Gupta <kartikayg@gmail.com>

# instead of NODE_ENV, using this b/c passing NODE_ENV as production interfere
# with npm install. If node_env is production, it doesn't install dev dependencies
# but we need them to build the project
ARG nodeEnv
ARG PORT
ARG ORG_TIMEZONE
ARG COMPANY_NAME
ARG API_GATEWAY_URI
ARG API_GATEWAY_HTTP_URI

# create app directory in container
RUN mkdir -p /app

# set /app directory as default working directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json package-lock.json /app/

#  install dependencies and don’t generate a lock lockfile
RUN npm install --no-package-lock --quiet

ENV NODE_ENV $nodeEnv
ENV PORT $PORT
ENV ORG_TIMEZONE $ORG_TIMEZONE
ENV COMPANY_NAME $COMPANY_NAME
ENV API_GATEWAY_URI $API_GATEWAY_URI
ENV API_GATEWAY_HTTP_URI $API_GATEWAY_HTTP_URI

# copy all file from src/ dir to /app in container
COPY . .

RUN npm run build

# expose port 6050
EXPOSE 7050

CMD ["node", "/app/dist/server.js"]
