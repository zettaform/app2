# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Clear npm cache and install dependencies
RUN npm cache clean --force && \
    npm ci --no-audit --no-fund

# Copy source code
COPY . .

# Build the React app
RUN npm run build

# Remove dev dependencies after build to reduce image size
RUN npm prune --production --no-audit --no-fund

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S app -u 1001

# Change ownership of app directory
RUN chown -R app:nodejs /app
USER app

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node --version || exit 1

# Start the server with centralized environment configuration
CMD ["node", "server.js"]
