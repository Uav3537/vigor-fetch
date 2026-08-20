import assert from "node:assert/strict";
import * as esm from "./dist/index.js";
import * as cjs from "./dist/index.cjs";

const { vigor, VigorRetry, VigorFetchError, VigorRetryError } = esm;

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`- ✅ ${name}`);
        passed++;
    } catch (err) {
        console.error(`- ❌ ${name}`);
        console.error(err);
        failed++;
    }
}

await test("ESM module exports are non-empty", async () => {
    assert.ok(Object.keys(esm).length > 0, "ESM export object is empty");
});

await test("CJS module exports are non-empty", async () => {
    assert.ok(Object.keys(cjs).length > 0, "CJS export object is empty");
});

await test("Retry module returning expected result", async () => {
    const random = Math.random();
    const result = await vigor
        .retry(async () => random)
        .request();

    assert.equal(result, random, "retry() did not resolve with the target's return value");
});

await test("Retry module retries on failure and eventually succeeds", async () => {
    let attempts = 0;

    const result = await vigor
        .retry(async () => {
            attempts++;
            if (attempts < 3) throw new Error("not yet");
            return "ok";
        })
        .settings({ maxAttempts: 5 })
        .algorithms((a) => a.constant({ interval: 0, jitter: 0 }))
        .request();

    assert.equal(result, "ok", "retry() did not return the eventual successful result");
    assert.equal(attempts, 3, "retry() did not retry the expected number of times");
});

await test("Retry module throws VigorRetryError with RETRY_EXHAUSTED after maxAttempts", async () => {
    await assert.rejects(
        () =>
            vigor
                .retry(async () => {
                    throw new Error("always fails");
                })
                .settings({ maxAttempts: 2 })
                .algorithms((a) => a.constant({ interval: 0, jitter: 0 }))
                .request(),
        (err) => {
            assert.ok(err instanceof VigorRetryError, "error is not a VigorRetryError");
            assert.equal(err.code, "RETRY_EXHAUSTED", "error code is not RETRY_EXHAUSTED");
            return true;
        }
    );
});

await test("Fetch module can fetch a real endpoint and parse JSON", async () => {
    const result = await vigor
        .fetch("https://jsonplaceholder.typicode.com/todos/1")
        .request();

    assert.equal(typeof result, "object", "fetch() did not resolve with a parsed object");
    assert.ok("id" in result, "parsed response is missing expected shape");
});

await test("CJS build's vigor works the same as ESM's", async () => {
    const random = Math.random();
    const result = await cjs.vigor
        .retry(async () => random)
        .request();

    assert.equal(result, random, "CJS retry() did not resolve with the target's return value");
});

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
    throw new Error(`${failed} test(s) failed`);
}