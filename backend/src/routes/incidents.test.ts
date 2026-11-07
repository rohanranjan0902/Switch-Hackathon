import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";

test("POST /api/incidents/:id/investigate starts investigation", async () => {
  const mockIo = {
    emit: () => {},
  } as unknown as import("socket.io").Server;

  const app = createApp(mockIo);
  const server = app.listen(0);
  const port = (server.address() as import("node:net").AddressInfo).port;

  try {
    // 1. Fetch incidents
    const listRes = await fetch(`http://localhost:${port}/api/incidents`);
    assert.equal(listRes.status, 200);
    const listBody = (await listRes.json()) as { data: Array<{ id: string }> };
    const firstIncidentId = listBody.data[0].id;

    // 2. Trigger investigate synchronously with ?sync=true
    const invRes = await fetch(
      `http://localhost:${port}/api/incidents/${firstIncidentId}/investigate?sync=true`,
      { method: "POST" },
    );
    assert.equal(invRes.status, 200);
    const invBody = (await invRes.json()) as {
      data: { status: string; report?: { codeFix?: { patch: string } } };
    };
    assert.equal(invBody.data.status, "SUCCEEDED");
    assert.ok(invBody.data.report?.codeFix?.patch);

    // 3. Check executions endpoint
    const execRes = await fetch(
      `http://localhost:${port}/api/incidents/${firstIncidentId}/executions`,
    );
    assert.equal(execRes.status, 200);
    const execBody = (await execRes.json()) as { data: Array<{ status: string }> };
    assert.equal(execBody.data.length, 1);
    assert.equal(execBody.data[0].status, "SUCCEEDED");

    // 4. Test Approve endpoint
    const approveRes = await fetch(
      `http://localhost:${port}/api/incidents/${firstIncidentId}/approve`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewer: "Incident Commander",
          note: "Verified in test",
        }),
      },
    );
    assert.equal(approveRes.status, 200);
    const approveBody = (await approveRes.json()) as {
      data: { approval: { approved: boolean }; incident: { status: string } };
    };
    assert.equal(approveBody.data.approval.approved, true);
    assert.equal(approveBody.data.incident.status, "RESOLVED");

    // 5. Check GET approval
    const getApprRes = await fetch(
      `http://localhost:${port}/api/incidents/${firstIncidentId}/approval`,
    );
    assert.equal(getApprRes.status, 200);
    const getApprBody = (await getApprRes.json()) as { data: { approved: boolean } };
    assert.equal(getApprBody.data.approved, true);
  } finally {
    server.close();
  }
});

test("POST /api/incidents/:id/approve rejects when no proposed code change exists", async () => {
  const mockIo = { emit: () => {} } as unknown as import("socket.io").Server;
  const app = createApp(mockIo);
  const server = app.listen(0);
  const port = (server.address() as import("node:net").AddressInfo).port;

  try {
    const res = await fetch(`http://localhost:${port}/api/incidents/demo-2844/approve`, {
      method: "POST",
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as { error: { code: string } };
    assert.equal(body.error.code, "NO_PROPOSED_CHANGE");
  } finally {
    server.close();
  }
});

test("POST /api/incidents/:id/investigate returns 404 for unknown incident", async () => {
  const mockIo = { emit: () => {} } as unknown as import("socket.io").Server;
  const app = createApp(mockIo);
  const server = app.listen(0);
  const port = (server.address() as import("node:net").AddressInfo).port;

  try {
    const res = await fetch(
      `http://localhost:${port}/api/incidents/unknown-id/investigate`,
      {
        method: "POST",
      },
    );
    assert.equal(res.status, 404);
  } finally {
    server.close();
  }
});
