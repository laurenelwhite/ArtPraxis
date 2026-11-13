/**
 * Firebase Firestore rules tests for private ArtPraxis user and lesson data.
 * Run: npm run test:firestore-rules
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  updateDoc,
} from "firebase/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES = readFileSync(resolve(__dirname, "../firestore.rules"), "utf8");
const PROJECT_ID = "artpraxis-firestore-rules-test";

let testEnv;

function ownerCtx(uid = "user-a") {
  return testEnv.authenticatedContext(uid);
}

function otherCtx() {
  return testEnv.authenticatedContext("user-b");
}

function anonCtx() {
  return testEnv.unauthenticatedContext();
}

function projectRef(ctx, uid = "user-a", projectId = "project-1") {
  return doc(ctx.firestore(), `users/${uid}/projects/${projectId}`);
}

function nestedRef(ctx, name, uid = "user-a", projectId = "project-1") {
  return doc(ctx.firestore(), `users/${uid}/projects/${projectId}/${name}/current`);
}

async function run(name, fn) {
  try {
    await testEnv.clearFirestore();
    await fn();
    console.log(`  PASS  ${name}`);
    return 0;
  } catch (error) {
    console.error(`  FAIL  ${name}`);
    console.error(error instanceof Error ? error.message : error);
    return 1;
  }
}

async function main() {
  console.log("Starting Firestore rules tests…");
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules: RULES, host: "127.0.0.1", port: 8080 },
  });

  let failed = 0;
  try {
    failed += await run("1. Owner can create and read a matching project", async () => {
      const ref = projectRef(ownerCtx());
      await assertSucceeds(setDoc(ref, { userId: "user-a", title: "Study" }));
      await assertSucceeds(getDoc(ref));
    });

    failed += await run("2. Anonymous users cannot read or create projects", async () => {
      await assertFails(getDoc(projectRef(anonCtx())));
      await assertFails(
        setDoc(projectRef(anonCtx()), { userId: "user-a", title: "Study" }),
      );
    });

    failed += await run("3. Another user cannot read, update, or delete a project", async () => {
      await assertSucceeds(
        setDoc(projectRef(ownerCtx()), { userId: "user-a", title: "Study" }),
      );
      const ref = projectRef(otherCtx());
      await assertFails(getDoc(ref));
      await assertFails(updateDoc(ref, { title: "Changed" }));
      await assertFails(deleteDoc(ref));
    });

    failed += await run("4. Project ownership cannot be spoofed on create", async () => {
      await assertFails(
        setDoc(projectRef(ownerCtx()), { userId: "user-b", title: "Study" }),
      );
    });

    failed += await run("5. Project ownership cannot be changed on update", async () => {
      const ref = projectRef(ownerCtx());
      await assertSucceeds(setDoc(ref, { userId: "user-a", title: "Study" }));
      await assertFails(updateDoc(ref, { userId: "user-b" }));
    });

    failed += await run("6. Tutorial and progression documents remain owner-only", async () => {
      for (const name of ["tutorial", "progression"]) {
        const ownerRef = nestedRef(ownerCtx(), name);
        await assertSucceeds(setDoc(ownerRef, { ready: true }));
        await assertSucceeds(getDoc(ownerRef));
        await assertFails(getDoc(nestedRef(otherCtx(), name)));
        await assertFails(getDoc(nestedRef(anonCtx(), name)));
      }
    });

    failed += await run("7. Owner can delete nested lesson data and the project root", async () => {
      const root = projectRef(ownerCtx());
      const nested = nestedRef(ownerCtx(), "tutorial");
      await assertSucceeds(setDoc(root, { userId: "user-a", title: "Study" }));
      await assertSucceeds(setDoc(nested, { ready: true }));
      await assertSucceeds(deleteDoc(nested));
      await assertSucceeds(deleteDoc(root));
    });

    failed += await run("8. User profile deletion is denied", async () => {
      const ref = doc(ownerCtx().firestore(), "users/user-a");
      await assertSucceeds(setDoc(ref, { displayName: "Artist" }));
      await assertFails(deleteDoc(ref));
      await assertFails(getDoc(doc(otherCtx().firestore(), "users/user-a")));
    });

    failed += await run("9. Unlisted apiUsage documents are default-denied", async () => {
      const ownerRef = doc(ownerCtx().firestore(), "apiUsage/user-a");
      await assertFails(getDoc(ownerRef));
      await assertFails(setDoc(ownerRef, { count: 1 }));
    });
  } finally {
    await testEnv.cleanup();
  }

  if (failed > 0) process.exit(1);
  console.log("Firestore rules tests passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
