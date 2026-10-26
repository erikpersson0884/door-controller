FROM node:20-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY server ./server
COPY public ./public
CMD ["node", "server/server.js"]