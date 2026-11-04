FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/package.json
COPY backend/package.json backend/package.json
COPY sample-app/package.json sample-app/package.json
RUN npm ci
COPY backend backend
ENV DATABASE_URL=postgresql://devops:devops@db:5432/devops_command_center?schema=public
RUN npm run db:generate --workspace backend
RUN npm run build --workspace backend
EXPOSE 4000
CMD ["npm", "run", "start", "--workspace", "backend"]
