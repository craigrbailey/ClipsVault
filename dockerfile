# Base image
FROM node:14

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Install MongoDB
FROM mongo
COPY setup.sh /docker-entrypoint-initdb.d/
RUN apt-get install -y gnupg2
RUN wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | apt-key add -
RUN echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/4.4 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-4.4.list
RUN apt-get update && apt-get install -y mongodb-org

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install application dependencies
RUN npm install

# Copy the rest of the application code to the container
COPY . .

# Expose the port on which your application runs (replace 3000 with your application's port if needed)
EXPOSE 3000

# Start the application
CMD [ "npm", "start" ]