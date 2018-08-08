FROM node:6.12-alpine
WORKDIR /usr/src/app
COPY package.json package-lock.json ./
RUN npm install --production

COPY . .
EXPOSE 3000
CMD ["npm", "start"]
