# use node 8 (latest version so far)
FROM node:8.9.0

MAINTAINER Kartikay Gupta <kartikayg@gmail.com>

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

# copy all file from src/ dir to /app in container
COPY . .

RUN npm run build

# expose port 6000
EXPOSE 6000

CMD ["/app/prod_start.sh"]
