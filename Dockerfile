# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Create a directory for environment variables
RUN mkdir /app

# Copy env processing script
COPY --from=build /app/env.sh /app/env.sh
RUN chmod +x /app/env.sh

# Expose port 80
EXPOSE 80

# Start Nginx with environment variable processing
CMD ["/bin/sh", "-c", "/app/env.sh && nginx -g 'daemon off;'"]