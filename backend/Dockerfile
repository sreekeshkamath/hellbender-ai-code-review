# =============================================================================
# Backend Dockerfile - Multi-stage build for development and production
# =============================================================================

# -----------------------------------------------------------------------------
# Base Stage - Common dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Install base dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY src/ ./src/

# -----------------------------------------------------------------------------
# Development Stage - With dev dependencies and hot reload
# -----------------------------------------------------------------------------
FROM base AS development

# Install all dependencies (including dev)
RUN npm ci

# Install dev dependencies
RUN npm install --save-dev nodemon ts-node @types/node typescript ts-jest jest @types/jest supertest

# Expose the port the app runs on
EXPOSE 3001

# Command to run the development server
CMD ["npm", "run", "dev"]

# -----------------------------------------------------------------------------
# Build Stage - Compile TypeScript
# -----------------------------------------------------------------------------
FROM base AS build

# Install all dependencies
RUN npm ci

# Compile TypeScript
RUN npm run build

# -----------------------------------------------------------------------------
# Production Stage - Optimized for production deployment
# -----------------------------------------------------------------------------
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled JavaScript from build stage
COPY --from=build /app/dist/ ./dist/

# Create directories for data
RUN mkdir -p /data/repos /app/temp

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3001

# Expose the port the app runs on
EXPOSE 3001

# Command to run the production server
CMD ["node", "dist/server.js"]
