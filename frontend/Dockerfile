FROM node:18-alpine

WORKDIR /app

# Install system dependencies for html2canvas/canvas
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    libuuid

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies)
RUN npm install

# Update Browserslist
RUN npx update-browserslist-db@latest

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]