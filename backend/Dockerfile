# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Install build dependencies for better-sqlite3 and dumb-init
RUN apk add --no-cache \
    dumb-init \
    build-base \
    python3 \
    make \
    g++

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Clean npm cache and install dependencies
RUN npm cache clean --force && \
    npm install --production --no-optional --no-audit --no-fund

# Remove build dependencies to reduce image size
RUN apk del build-base python3 make g++

# Copy the rest of the application code
COPY . .

# Create directories for SQLite database and ensure proper permissions
RUN mkdir -p /app/database && \
    chmod 755 /app/database

# Create a non-root user to run the application
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership of the app directory to the nodejs user
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Health check - using /api/health to match Railway configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "const http = require('http'); http.get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Command to run the application
CMD ["npm", "start"] 