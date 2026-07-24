/**
 * Firebase Storage rules tests for ArtPraxis stage / project uploads.
 *
 * Requires the Storage emulator (started automatically by rules-unit-testing).
 * Run: npm run test:storage-rules
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { ref, uploadBytes, getDownloadURL, getBytes } from "firebase/storage";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES = readFileSync(resolve(__dirname, "../storage.rules"), "utf8");

/** Tiny valid-ish PNG (1x1) — content is irrelevant; rules check metadata. */
const TINY_PNG = Uint8Array.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
  0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
  0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xfe, 0xd4, 0xef, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45,
  0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
]);

const OVERSIZE = new Uint8Array(16 * 1024 * 1024);

let testEnv;

async function setup() {
  testEnv = await initializeTestEnvironment({
    projectId: "artpraxis-storage-rules-test",
    storage: { rules: RULES, host: "127.0.0.1", port: 9199 },
  });
}

async function teardown() {
  await testEnv?.cleanup();
}

function ownerCtx(uid = "user-a") {
  return testEnv.authenticatedContext(uid);
}

function otherCtx() {
  return testEnv.authenticatedContext("user-b");
}

function anonCtx() {
  return testEnv.unauthenticatedContext();
}

function stagePath(uid, projectId, fileName) {
  return `users/${uid}/projects/${projectId}/stages/${fileName}`;
}

function projectFilePath(uid, projectId, fileName) {
  return `users/${uid}/projects/${projectId}/${fileName}`;
}

async function uploadAs(ctx, path, data, contentType) {
  const storage = ctx.storage();
  const object = ref(storage, path);
  return uploadBytes(object, data, { contentType });
}

async function run(name, fn) {
  try {
    await fn();
    console.log(`  PASS  ${name}`);
  } catch (e) {
    console.error(`  FAIL  ${name}`);
    console.error(e instanceof Error ? e.message : e);
    throw e;
  }
}

async function main() {
  console.log("Starting Storage rules tests…");
  await setup();
  let failed = 0;

  try {
    await run("1. Owner can upload stages/second-wash.png", async () => {
      await assertSucceeds(
        uploadAs(ownerCtx(), stagePath("user-a", "project-1", "second-wash.png"), TINY_PNG, "image/png"),
      );
    });

    await run("2. Owner can upload stages/refinement.png", async () => {
      await assertSucceeds(
        uploadAs(ownerCtx(), stagePath("user-a", "project-1", "refinement.png"), TINY_PNG, "image/png"),
      );
    });

    await run("3. Other user cannot upload to user-a stages path", async () => {
      await assertFails(
        uploadAs(otherCtx(), stagePath("user-a", "project-1", "second-wash.png"), TINY_PNG, "image/png"),
      );
    });

    await run("4. Unauthenticated cannot upload stage images", async () => {
      await assertFails(
        uploadAs(anonCtx(), stagePath("user-a", "project-1", "second-wash.png"), TINY_PNG, "image/png"),
      );
    });

    await run("5. Non-image content-type is rejected for stages", async () => {
      await assertFails(
        uploadAs(
          ownerCtx(),
          stagePath("user-a", "project-1", "not-image.bin"),
          TINY_PNG,
          "application/octet-stream",
        ),
      );
    });

    await run("6. Oversized stage image (>15MB) is rejected", async () => {
      await assertFails(
        uploadAs(ownerCtx(), stagePath("user-a", "project-1", "huge.png"), OVERSIZE, "image/png"),
      );
    });

    await run("7. Owner can read their stage images", async () => {
      const path = stagePath("user-a", "project-1", "readable.png");
      await assertSucceeds(uploadAs(ownerCtx(), path, TINY_PNG, "image/png"));
      const storage = ownerCtx().storage();
      await assertSucceeds(getBytes(ref(storage, path)));
      await assertSucceeds(getDownloadURL(ref(storage, path)));
    });

    await run("8. Other user cannot read owner stage images", async () => {
      const path = stagePath("user-a", "project-1", "private.png");
      await assertSucceeds(uploadAs(ownerCtx(), path, TINY_PNG, "image/png"));
      const storage = otherCtx().storage();
      await assertFails(getBytes(ref(storage, path)));
    });

    await run("9. Existing reference image uploads still work", async () => {
      await assertSucceeds(
        uploadAs(
          ownerCtx(),
          projectFilePath("user-a", "project-1", "reference.jpg"),
          TINY_PNG,
          "image/jpeg",
        ),
      );
    });

    await run("10. Existing master image uploads still work (stages/master.png)", async () => {
      await assertSucceeds(
        uploadAs(ownerCtx(), stagePath("user-a", "project-1", "master.png"), TINY_PNG, "image/png"),
      );
    });
  } catch {
    failed = 1;
  } finally {
    await teardown();
  }

  if (failed) {
    console.error("\nStorage rules tests FAILED");
    process.exit(1);
  }
  console.log("\nAll Storage rules tests passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
