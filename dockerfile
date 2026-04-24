# Dockerfile

FROM node:18-alpine

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