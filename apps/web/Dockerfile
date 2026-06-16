FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY apps apps
RUN npm install
USER node
EXPOSE 5173
CMD ["npm", "run", "dev", "-w", "apps/web"]
