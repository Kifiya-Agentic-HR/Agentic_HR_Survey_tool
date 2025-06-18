# Use an official Node.js runtime as the base image
FROM node:18-alpine

# Set the working directory
WORKDIR /interview-ai

# Declare build arguments for interview_frontend
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_INTERVIEW_BACKEND

# Set environment variables if needed during build
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ENV NEXT_PUBLIC_INTERVIEW_BACKEND=${NEXT_PUBLIC_INTERVIEW_BACKEND}


# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies using NPM
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port that Next.js listens on
EXPOSE 3000

# Start the Next.js application in production mode
CMD ["npm", "run", "start"]
