# use node 8 (latest version so far)
FROM node:8.4.0

MAINTAINER Kartikay Gupta <kartikayg@gmail.com>

# create app directory in container
RUN mkdir -p /app

# set /app directory as default working directory
WORKDIR /app

# only copy package.json initially so that `RUN yarn` layer is recreated only
# if there are changes in package.json
# ADD package.json package-lock.json /app/

#  install dependencies and don’t generate a lock lockfile
# RUN npm install --no-package-lock --quiet

# copy all file from current dir to /app in container
COPY . /app/

# expose port 4040
EXPOSE 4040

# cmd to start service
CMD [ "npm", "run", "dev" ]