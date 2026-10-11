// Loads demo data from /sample-data into MongoDB. Safe to re-run (it replaces the sample set).
// Usage: npm run seed   (authority accounts)  then  npm run seed:sample
import "dotenv/config";
import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "./models/User.js";
import Issue from "./models/Issue.js";
import Report from "./models/Report.js";

const load = async (name) =>
  JSON.parse(await readFile(new URL(`../../sample-data/${name}.json`, import.meta.url), "utf8"));

await mongoose.connect(process.env.MONGO_URI);

const [users, issues, reports] = await Promise.all([load("users"), load("issues"), load("reports")]);

const passwordHash = await bcrypt.hash("Password123", 10);
const userByEmail = {};
for (const u of users) {
  userByEmail[u.email] = await User.findOneAndUpdate(
    { email: u.email },
    { $set: { ...u, passwordHash } },
    { upsert: true, new: true }
  );
}

const sampleEmails = users.map((u) => u.email);
const sampleUserIds = Object.values(userByEmail).map((u) => u._id);
await Report.deleteMany({ userId: { $in: sampleUserIds } });
await Issue.deleteMany({ summary: { $in: issues.map((i) => i.summary) } });

const issueByKey = {};
for (const { key, ...data } of issues) issueByKey[key] = await Issue.create(data);

for (const { issueKey, userEmail, ...data } of reports) {
  await Report.create({ ...data, issueId: issueByKey[issueKey]._id, userId: userByEmail[userEmail]._id });
}

console.log(
  `Seeded ${users.length} users (${sampleEmails.join(", ")}), ${issues.length} issues, ${reports.length} reports. Password: Password123`
);
await mongoose.disconnect();
