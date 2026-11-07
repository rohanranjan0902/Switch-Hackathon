import assert from "node:assert/strict";
import test from "node:test";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";

test("logs endpoint validates severity query parameters", async () => {
  const io = new Server();
  const httpServer = createServer(createApp(io));
  io.attach(httpServer);

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(0, "127.0.0.1", resolve);
  });

  const address = httpServer.address();
  assert(address && typeof address !== "string");
  const baseUrl = `http://127.0.0.1:${address.port}/api/logs`;

  try {
    const validResponse = await fetch(`${baseUrl}?level=HIGH`);
    const validBody = (await validResponse.json()) as {
      data: Array<{ level: string }>;
    };
    assert.equal(validResponse.status, 200);
    assert.ok(validBody.data.length > 0);
    assert.ok(validBody.data.every((log) => log.level === "HIGH"));

    const invalidResponse = await fetch(`${baseUrl}?level=UNKNOWN`);
    const invalidBody = (await invalidResponse.json()) as {
      error: { code: string };
    };
    assert.equal(invalidResponse.status, 400);
    assert.equal(invalidBody.error.code, "VALIDATION_ERROR");
  } finally {
    await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    await new Promise<void>((resolve) => io.close(() => resolve()));
  }
});
