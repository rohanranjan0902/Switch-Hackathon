FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY sample-app/package.json sample-app/package.json
RUN npm ci
COPY frontend frontend
RUN npm run build --workspace frontend
EXPOSE 5173
CMD ["npm", "run", "preview", "--workspace", "frontend", "--", "--host", "0.0.0.0"]
