# base image
FROM node:alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm ci

# Install ffmpeg and npm dependencies
RUN apk add --no-cache ffmpeg

# Bundle app source
COPY . .

# Expose ports
EXPOSE 3000

# Start MongoDB and the application
CMD npm start
