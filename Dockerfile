# Build the React frontend
FROM node:24-alpine AS frontend-build

WORKDIR /app/client

COPY client/package*.json ./
RUN npm ci

COPY client/ ./
RUN npm run build


# Production backend image
FROM node:24-alpine AS runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=80

# Install only backend production dependencies
COPY server/package*.json ./server/
RUN cd server && npm ci --omit=dev

# Copy backend source
COPY server/ ./server/

# Copy the compiled React application
COPY --from=frontend-build /app/client/dist ./client/dist

EXPOSE 80

CMD ["node", "server/server.js"]