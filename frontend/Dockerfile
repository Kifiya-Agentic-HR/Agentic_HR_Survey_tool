# frontend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# Build arguments for backend connection details
ARG HOST
ARG GATEWAY_PORT
ARG FRONTEND_PORT

# Environment variables for Next.js
ENV NEXT_PUBLIC_HOST=${HOST}
ENV NEXT_PUBLIC_GATEWAY_PORT=${GATEWAY_PORT}
ENV NEXT_PUBLIC_FRONTEND_PORT=${FRONTEND_PORT}

# Copy package.json and lock file
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port the app will run on
EXPOSE ${FRONTEND_PORT}

# Start the Next.js application in development mode
CMD ["sh", "-c", "npm run dev -- -p $FRONTEND_PORT"]