FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
COPY tsconfig*.json ./
COPY apps apps
COPY packages packages
RUN npm install
RUN npm run build -w packages/contracts && npm run build -w packages/common && npm run build -w apps/payment-worker
USER node
EXPOSE 3004
CMD ["npm", "run", "dev", "-w", "apps/payment-worker"]
