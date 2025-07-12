import fastify from "fastify";
import type { FastifyRequest, FastifyReply } from "fastify";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

let server: ReturnType<typeof fastify>;


beforeAll(async () => {
  server = fastify();
  server.get("/", async (_request: FastifyRequest, _reply: FastifyReply) => {
    return { status: "ok" };
  });
  server.get("/ping", async (_request: FastifyRequest, _reply: FastifyReply) => {
    return "pong\n";
  });
  await server.listen({ port: 0, host: "127.0.0.1" });
});

afterAll(async () => {
  await server.close();
});

describe("backend server", () => {
  it("GET / should return status ok", async () => {
    const res = await server.inject({ method: "GET", url: "/" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });

  it("GET /ping should return pong", async () => {
    const res = await server.inject({ method: "GET", url: "/ping" });
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe("pong\n");
  });
});
