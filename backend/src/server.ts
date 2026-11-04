import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { env } from "./config/env.js";

const io = new Server({
  cors: { origin: env.FRONTEND_ORIGIN },
});
const app = createApp(io);
const httpServer = createServer(app);
io.attach(httpServer);
io.on("connection", (socket) => {
  console.info(`[socket] client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.info(`[socket] client disconnected: ${socket.id}`);
  });
});

httpServer.listen(env.API_PORT, () => {
  console.info(`[api] listening on http://localhost:${env.API_PORT} (${env.NODE_ENV})`);
  console.info("[api] demo mode enabled; Switch and GitHub actions are not enabled");
});
