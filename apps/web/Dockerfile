FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY apps apps
COPY packages packages
RUN npm install
RUN chown -R node:node /app/apps/web
USER node
EXPOSE 5173
CMD ["npm", "run", "dev", "-w", "apps/web"]
