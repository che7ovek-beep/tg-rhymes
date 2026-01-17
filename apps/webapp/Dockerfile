FROM node:20-alpine

WORKDIR /app
COPY apps/webapp/package.json ./package.json
COPY apps/webapp/package-lock.json ./package-lock.json
COPY packages/shared /packages/shared
RUN npm ci
COPY apps/webapp ./

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
