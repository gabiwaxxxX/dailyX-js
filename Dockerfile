# Use an official Node.js runtime as a parent image
FROM --platform=linux/amd64 node:20

# RUN apt-get update && apt-get install curl gnupg -y \
#     && curl --location --silent https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
#     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
#     && apt-get update \
#     && apt-get install google-chrome-stable -y --no-install-recommends \
#     && rm -rf /var/lib/apt/lists/*

RUN apt-get update && apt-get install gnupg wget -y && \
    wget --quiet --output-document=- https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /etc/apt/trusted.gpg.d/google-archive.gpg && \
    sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' && \
    apt-get update && \
    apt-get install google-chrome-stable -y --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

# Set the working directory to /app
WORKDIR /app
# Copy the package.json and package-lock.json files to the container
COPY package*.json ./

# Install dependencies
RUN npm install
COPY ./src ./src
COPY nodemon.json ./
COPY tsconfig.json ./
RUN npm run build

COPY ./CookieConsent ./CookieConsent

# Copy the rest of the application code to the container
# COPY ./build ./build


# Set the environment variable to production

# Build the TypeScript code
# RUN npm run build

# Start the application
# CMD ["npm", "start:dev"]
