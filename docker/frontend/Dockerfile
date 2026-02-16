# Use official Node.js Alpine image
FROM node:20-alpine

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++ libc6-compat

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY next/package.json next/package-lock.json* ./
RUN npm ci

# Copy the rest of the Next.js source code
COPY next/ ./

# Build the Next.js application
RUN npm run build

# Expose the port Next.js runs on
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "start"]
