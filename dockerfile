# Dockerfile

FROM node:22-bookworm-slim

WORKDIR /app

# install deps
COPY package*.json ./
RUN npm install --production

# copy source
COPY src ./src

# expose port
EXPOSE 4001

# run app
CMD ["node", "src/server.js"]