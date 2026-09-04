FROM node:20-alpine

WORKDIR /app

# Copy server package manifest to root /app and install dependencies
COPY server/package*.json ./
RUN npm ci

# Copy full application source code and clean nested node_modules
COPY . .
RUN rm -rf server/node_modules client/node_modules

ENV NODE_ENV=production
ARG SERVICE_ENTRY
ENV SERVICE_ENTRYPOINT=$SERVICE_ENTRY

CMD ["sh", "-c", "node ${SERVICE_ENTRYPOINT}"]
