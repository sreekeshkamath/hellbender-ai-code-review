# =============================================================================
# Frontend Dockerfile - Multi-stage build for development and production
# =============================================================================

# -----------------------------------------------------------------------------
# Base Stage - Install dependencies
# -----------------------------------------------------------------------------
FROM node:20-alpine AS base

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# -----------------------------------------------------------------------------
# Development Stage - Vite dev server with hot reload
# -----------------------------------------------------------------------------
FROM base AS development

# Expose the port Vite runs on
EXPOSE 5173

# Command to run the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# -----------------------------------------------------------------------------
# Build Stage - Production build
# -----------------------------------------------------------------------------
FROM base AS build

# Build the production bundle
RUN npm run build

# -----------------------------------------------------------------------------
# Production Stage - Nginx serving static files
# -----------------------------------------------------------------------------
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built assets from build stage
COPY --from=build /app/dist/ /usr/share/nginx/html/

# Expose port 80 (default nginx port)
EXPOSE 80

# Command to start nginx
CMD ["nginx", "-g", "daemon off;"]
