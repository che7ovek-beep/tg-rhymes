FROM node:20-alpine

WORKDIR /app
COPY apps/webapp/package.json ./
COPY packages/shared /packages/shared
RUN npm install
COPY apps/webapp ./

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
