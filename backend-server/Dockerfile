# Use the official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json (if available)
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create directory for SQLite database
RUN mkdir -p /app/data

# Expose the port the app runs on
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Command to run the application
CMD ["npm", "start"] 