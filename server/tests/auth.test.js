import test, { before, after, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret";

let mongod, app, User;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  app = (await import("../src/app.js")).default;
  User = (await import("../src/models/User.js")).default;
});

beforeEach(async () => {
  await User.deleteMany({});
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

const creds = { name: "Test User", email: "test@civiceye.test", password: "secret123" };

test("GET /api/health returns ok", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { status: "ok" });
});

test("register creates a citizen and returns a token", async () => {
  const res = await request(app).post("/api/auth/register").send(creds);
  assert.equal(res.status, 201);
  assert.ok(res.body.token);
  assert.equal(res.body.user.role, "citizen");
  assert.equal(res.body.user.passwordHash, undefined);
});

test("register ignores a client-supplied role (no privilege escalation)", async () => {
  const res = await request(app).post("/api/auth/register").send({ ...creds, role: "admin" });
  assert.equal(res.status, 201);
  assert.equal(res.body.user.role, "citizen");
});

test("register validates input and rejects duplicates", async () => {
  const bad = await request(app).post("/api/auth/register").send({ name: "A", email: "nope", password: "1" });
  assert.equal(bad.status, 400);

  await request(app).post("/api/auth/register").send(creds);
  const dup = await request(app).post("/api/auth/register").send(creds);
  assert.equal(dup.status, 409);
});

test("login succeeds with correct password and fails otherwise", async () => {
  await request(app).post("/api/auth/register").send(creds);

  const ok = await request(app).post("/api/auth/login").send({ email: creds.email, password: creds.password });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);

  const wrong = await request(app).post("/api/auth/login").send({ email: creds.email, password: "wrong-pass" });
  assert.equal(wrong.status, 401);

  const unknown = await request(app).post("/api/auth/login").send({ email: "x@y.z", password: "whatever" });
  assert.equal(unknown.status, 401);
});

test("GET /api/auth/me requires a valid token", async () => {
  const none = await request(app).get("/api/auth/me");
  assert.equal(none.status, 401);

  const bad = await request(app).get("/api/auth/me").set("Authorization", "Bearer not-a-jwt");
  assert.equal(bad.status, 401);

  const { body } = await request(app).post("/api/auth/register").send(creds);
  const me = await request(app).get("/api/auth/me").set("Authorization", `Bearer ${body.token}`);
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, creds.email);
});
