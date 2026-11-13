#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const requestedPath = process.argv[2] || "apphosting.production.yaml";
const configPath = resolve(process.cwd(), requestedPath);

if (!existsSync(configPath)) {
  console.error(`Production config not found: ${requestedPath}`);
  console.error(
    "Copy apphosting.production.example.yaml to an environment-specific file, replace its placeholders, then pass that file to this check.",
  );
  process.exit(1);
}

const config = readFileSync(configPath, "utf8");
const lines = config.split(/\r?\n/);
const failures = [];

function blockFor(variable) {
  const start = lines.findIndex(
    (line) => line.trim() === `- variable: ${variable}`,
  );
  if (start < 0) return "";
  const relativeEnd = lines
    .slice(start + 1)
    .findIndex((line) => line.trim().startsWith("- variable:"));
  const end = relativeEnd < 0 ? lines.length : start + 1 + relativeEnd;
  return lines.slice(start + 1, end).join("\n");
}

function valueFor(variable) {
  const block = blockFor(variable);
  const match = block.match(/^\s*value:\s*["']?([^\r\n"']+)["']?\s*$/m);
  return match?.[1]?.trim() ?? "";
}

function requirePositiveNumber(variable) {
  const rawValue = valueFor(variable);
  const value = Number(rawValue);
  if (!rawValue || !Number.isFinite(value) || value <= 0) {
    failures.push(`${variable} must be a reviewed number greater than zero.`);
  }
}

if (/CHANGE_ME|REPLACE_ME|example\.com/i.test(config)) {
  failures.push("Placeholder values remain in the production configuration.");
}

if (/staging/i.test(config)) {
  failures.push("A staging identifier remains in the production configuration.");
}

const siteUrl = valueFor("NEXT_PUBLIC_SITE_URL");
if (!/^https:\/\/[^\s/]+(?:\/.*)?$/i.test(siteUrl)) {
  failures.push("NEXT_PUBLIC_SITE_URL must be a real HTTPS production URL.");
}

const projectId = valueFor("NEXT_PUBLIC_FIREBASE_PROJECT_ID");
if (!projectId || /staging|change|example/i.test(projectId)) {
  failures.push("NEXT_PUBLIC_FIREBASE_PROJECT_ID must name the production project.");
}

const secretBlock = blockFor("OPENAI_API_KEY");
if (!/^\s*secret:\s*[^\s]+\s*$/m.test(secretBlock)) {
  failures.push("OPENAI_API_KEY must use a Cloud Secret Manager reference.");
}
if (!/^\s*-\s*RUNTIME\s*$/m.test(secretBlock)) {
  failures.push("OPENAI_API_KEY must be available at runtime.");
}
if (/^\s*value:/m.test(secretBlock)) {
  failures.push("OPENAI_API_KEY must never contain a plaintext value.");
}

requirePositiveNumber("GEN_QUOTA_TUTORIALS_PER_DAY");
requirePositiveNumber("GEN_QUOTA_MAX_CONCURRENT");

if (failures.length > 0) {
  console.error("Production configuration is not launch-ready:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Production configuration passed launch checks: ${requestedPath}`);
