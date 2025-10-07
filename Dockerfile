# Use the official Node.js 18 image
FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Set CI environment variable to avoid interactive prompts
ENV CI=true

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
RUN pnpm prisma generate

# Expose port
EXPOSE 3000

# Start the application
CMD ["pnpm", "dev"]
