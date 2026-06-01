FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY frontend/package.json ./
COPY frontend/package-lock.json* ./

# Install dependencies
RUN npm ci

# Copy frontend source
COPY frontend/src ./src
COPY frontend/public ./public
COPY frontend/*.js* ./
COPY frontend/*.config.* ./
COPY frontend/tsconfig.json* ./

# Build the app
RUN npm run build

# Serve with node
RUN npm install -g serve
EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
