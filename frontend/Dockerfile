FROM node:18-alpine

WORKDIR /app

# Accept backend URL as build argument
ARG REACT_APP_BACKEND_URL=http://localhost:8001
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

# Copy package files
COPY package.json .
COPY package-lock.json* .

# Install dependencies
RUN npm ci

# Copy frontend source
COPY src ./src
COPY public ./public
COPY *.js* ./
COPY *.config.* ./
COPY tsconfig.json* ./

# Build the app with backend URL
RUN npm run build

# Serve with node
RUN npm install -g serve
EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
