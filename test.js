import assert from "node:assert/strict";
import http from "node:http";
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

await test("Fetch requestVerbose() carries the response's status, null when there is none", async () => {
    const server = http.createServer((req, res) => {
        res.statusCode = req.url === "/created" ? 201 : 404;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ url: req.url }));
    });
    await new Promise((resolve) => server.listen(0, resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
        const ok = await vigor.fetch(origin).path("created").requestVerbose();
        assert.equal(ok.success, true, "request did not succeed");
        assert.equal(ok.status, 201, "status is not the response's");
        assert.ok(ok.response instanceof Response, "response is not the Response");
        assert.deepEqual(ok.data, { url: "/created" }, "data is not the parsed body");

        const failed = await vigor.fetch(origin).path("missing").requestVerbose();
        assert.equal(failed.success, false, "a 404 did not fail");
        assert.equal(failed.status, null, "a failure has a status");
        assert.equal(failed.response, null, "a failure has a response");
        assert.equal(failed.error.data.status, 404, "the failure's status is not on its error");

        const recovered = await vigor.fetch(origin).path("missing").settings({ default: () => "fallback" }).requestVerbose();
        assert.equal(recovered.data, "fallback", "default did not recover");
        assert.equal(recovered.status, null, "a recovered result has a status");
        assert.equal(recovered.response, null, "a recovered result has a response");
    } finally {
        server.close();
    }
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