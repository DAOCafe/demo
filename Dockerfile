# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for Vite environment variables (baked in at build time)
ARG VITE_PINATA_JWT
ARG VITE_PINATA_GATEWAY
ARG VITE_TENDERLY_API_URL
ARG VITE_TENDERLY_API_KEY

# Build the app
RUN npm run build

# Production stage - lightweight nginx to serve static files
FROM nginx:alpine AS production

# Copy built static files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
