import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Issue from "../src/models/Issue.js";
import Report from "../src/models/Report.js";

const point = { type: "Point", coordinates: [80.27, 13.08] };

test("User: requires name, email and passwordHash; defaults role to citizen", () => {
  const bad = new User({}).validateSync();
  assert.ok(bad.errors.name && bad.errors.email && bad.errors.passwordHash);

  const ok = new User({ name: "A", email: "A@Example.com ", passwordHash: "x" });
  assert.equal(ok.validateSync(), undefined);
  assert.equal(ok.role, "citizen");
  assert.equal(ok.email, "a@example.com"); // lowercased + trimmed
});

test("User: rejects unknown role and department", () => {
  const err = new User({ name: "A", email: "a@b.c", passwordHash: "x", role: "root", department: "Space" }).validateSync();
  assert.ok(err.errors.role && err.errors.department);
});

test("Issue: category is required and restricted to known values", () => {
  assert.ok(new Issue({ location: { coordinates: [1, 2] } }).validateSync().errors.category);
  assert.ok(new Issue({ category: "ufo", location: { coordinates: [1, 2] } }).validateSync().errors.category);
});

test("Issue: severity must be 1-5, defaults are applied", () => {
  assert.ok(new Issue({ category: "pothole", location: point, severity: 6 }).validateSync().errors.severity);
  const issue = new Issue({ category: "pothole", location: point });
  assert.equal(issue.validateSync(), undefined);
  assert.equal(issue.status, "open");
  assert.equal(issue.priorityLabel, "LOW");
  assert.equal(issue.reportCount, 1);
});

test("Report: requires userId and coordinates", () => {
  const err = new Report({}).validateSync();
  assert.ok(err.errors.userId);
  assert.ok(err.errors["location.coordinates"]);
  const ok = new Report({ userId: new mongoose.Types.ObjectId(), location: point });
  assert.equal(ok.validateSync(), undefined);
});
