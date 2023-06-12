# Use the official MongoDB image as base
FROM mongo:latest as mongo

# Use the official Node.js image as base
FROM node:latest

# Install ffmpeg in the node image
RUN apt-get update && \
    apt-get upgrade -y && \
    apt-get install -y ffmpeg && \
    apt-get clean

# Create a directory in the Docker image where your app will be placed
RUN mkdir -p /usr/src/app /usr/src/app/uploads /usr/src/app/trash /usr/src/app/logs /usr/src/app/encoding

# Set this as the default directory
WORKDIR /usr/src/app

# Copy package.json file from your source code to the Docker image
COPY package.json /usr/src/app

# Install dependencies - use this step to install your application's dependencies
RUN npm install

# Copy the rest of your application's source code from your host to your image filesystem.
COPY . /usr/src/app

# Run setup.sh
RUN chmod +x ./setup.sh && ./setup.sh

# Declare the recordings and its subdirectory as volumes
VOLUME [ "/usr/src/app/recordings", "/usr/src/app/recordings/clips" ]

# Expose the port your app runs in
EXPOSE 3000

# The command that starts your app
CMD [ "node", "your-app.js" ]
