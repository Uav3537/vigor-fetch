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
        const ok = await vigor.fetch(origin).path("append", "created").requestVerbose();
        assert.equal(ok.success, true, "request did not succeed");
        assert.equal(ok.status, 201, "status is not the response's");
        assert.ok(ok.response instanceof Response, "response is not the Response");
        assert.deepEqual(ok.data, { url: "/created" }, "data is not the parsed body");

        const failed = await vigor.fetch(origin).path("append", "missing").requestVerbose();
        assert.equal(failed.success, false, "a 404 did not fail");
        assert.equal(failed.status, null, "a failure has a status");
        assert.equal(failed.response, null, "a failure has a response");
        assert.equal(failed.error.data.status, 404, "the failure's status is not on its error");

        const recovered = await vigor.fetch(origin).path("append", "missing").settings({ default: () => "fallback" }).requestVerbose();
        assert.equal(recovered.data, "fallback", "default did not recover");
        assert.equal(recovered.status, null, "a recovered result has a status");
        assert.equal(recovered.response, null, "a recovered result has a response");
    } finally {
        server.close();
    }
});

await test("settings.fetcher replaces the global fetch, called with the built URL, init and signal", async () => {
    const calls = [];
    const fetcher = async function (input, init) {
        calls.push({ input, init, self: this });
        return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
    };
    const data = await vigor
        .fetch("https://injected.invalid")
        .path("append", "users")
        .query("append", { page: 1 })
        .body("replace", { name: "a" })
        .settings(s => s.fetcher(fetcher))
        .request();

    assert.deepEqual(data, { ok: true }, "result did not come from the injected fetcher");
    assert.equal(calls.length, 1, "fetcher was not called exactly once");
    assert.equal(calls[0].input, "https://injected.invalid/users?page=1", "fetcher did not get the built URL");
    assert.equal(calls[0].init.method, "POST", "fetcher did not get the method");
    assert.ok(calls[0].init.signal instanceof AbortSignal, "fetcher did not get the attempt's signal");
    assert.equal(calls[0].self, undefined, "fetcher was called with a `this`");
});

await test("settings.fetcher's failures go through the retry engine", async () => {
    let attempts = 0;
    const data = await vigor
        .fetch("https://injected.invalid")
        .settings({ fetcher: async () => {
            attempts++;
            return attempts < 3 ? new Response("busy", { status: 503 }) : new Response("done", { status: 200 });
        } })
        .retry(r => r.algorithms(a => a.constant({ interval: 0, jitter: 0 })))
        .request();

    assert.equal(data, "done", "did not resolve with the eventual response");
    assert.equal(attempts, 3, "503s from the fetcher were not retried");
});

await test("A guard's callback reaches the error wrapped by RETRY_EXHAUSTED", async () => {
    const server = http.createServer((req, res) => {
        res.statusCode = 503;
        res.setHeader("content-type", "application/json");
        res.end(JSON.stringify({ reason: "down" }));
    });
    await new Promise((resolve) => server.listen(0, resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
        const res = await vigor.fetch(origin)
            .retry((r) => r.settings({ maxAttempts: 2 }).algorithms((a) => a.constant({ interval: 0, jitter: 0 })))
            .requestVerbose();
        assert.equal(res.success, false, "a 503 did not fail");

        // Without a callback the guard only checks the error itself.
        assert.equal(vigor.guards.fetch(res.error, "RETRY_EXHAUSTED"), true, "the outer error is not RETRY_EXHAUSTED");
        assert.equal(vigor.guards.fetch(res.error, "FETCH_FAILED"), false, "the plain guard matched a wrapped error");

        // With one, it searches inside and hands over the match.
        let seen;
        const status = vigor.guards.fetch(res.error, "FETCH_FAILED", (failed) => { seen = failed; return failed.data.status; });
        assert.ok(seen instanceof VigorFetchError && seen.code === "FETCH_FAILED", "the callback did not get the wrapped error");
        assert.equal(status, 503, "the guard did not return the callback's result");
        assert.deepEqual(seen.data.parsed, { reason: "down" }, "the found error lost its parsed body");
        assert.equal(seen, res.error.data.error, "the callback did not get the wrapped error itself");

        assert.equal(vigor.guards.fetch(res.error, "RETRY_EXHAUSTED", (e) => e), res.error, "the error itself is not checked first");
        assert.equal(vigor.guards.fetch(res.error, ["REDIRECTED", "FETCH_FAILED"], (e) => e.code), "FETCH_FAILED", "an array of codes did not match");
        let called = false;
        assert.equal(vigor.guards.fetch(res.error, "REDIRECTED", () => { called = true; }), undefined, "a missing code did not give undefined");
        assert.equal(vigor.guards.fetch(new Error("plain"), "FETCH_FAILED", () => { called = true; }), undefined, "a plain error matched");
        assert.equal(vigor.guards.fetch(null, "FETCH_FAILED", () => { called = true; }), undefined, "null matched");
        assert.equal(called, false, "the callback ran without a match");
        assert.equal(vigor.guards.fetch, esm.isVigorFetchError, "guards.fetch is not the exported guard");
    } finally {
        server.close();
    }
});

/** A fetcher that records what it was sent and answers 200 with an empty JSON object. */
function recorder() {
    const calls = [];
    const fetcher = async (input, init) => {
        calls.push({ input, init });
        return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    };
    return { calls, fetcher };
}

await test("path/query: \"append\" adds, \"replace\" discards what was set before", async () => {
    const { calls, fetcher } = recorder();
    await vigor.fetch("https://x.invalid/api")
        .settings({ fetcher })
        .path("append", "v1", "users").path("replace", "v2", 7)
        .query("append", { a: 1 }).query("replace", { b: 2 })
        .request();
    assert.equal(calls[0].input, "https://x.invalid/api/v2/7?b=2");
});

await test("default serializers keep the previous URL rules", async () => {
    const { calls, fetcher } = recorder();
    const date = new Date(0);
    await vigor.fetch("https://x.invalid/api?v=1#top")
        .settings({ fetcher })
        .path("append", "a b/c", null, date)
        .query("append", { list: [1, 2], skip: undefined, at: date })
        .request();
    assert.equal(calls[0].input, `https://x.invalid/api/a%20b/c/${encodeURIComponent(date.toISOString())}?v=1&list=1&list=2&at=${encodeURIComponent(date.toISOString())}#top`);
});

await test("default serializers still confine the path, and dropping `confine` turns it off", async () => {
    const { calls, fetcher } = recorder();
    await assert.rejects(
        () => vigor.fetch("https://x.invalid/api").settings({ fetcher }).path("append", "..", "internal").request(),
        (err) => err.code === "PATH_ESCAPED"
    );
    await vigor.fetch("https://x.invalid/api").settings({ fetcher })
        .serializers(s => s.url(u => u.hashFromOrigin()))
        .path("append", "..", "internal")
        .request();
    assert.equal(calls[0].input, "https://x.invalid/internal");
});

await test("a replaced stage runs exactly the steps given", async () => {
    const { calls, fetcher } = recorder();
    await vigor.fetch("https://x.invalid")
        .settings({ fetcher })
        .serializers(s => s
            .query(q => q.dropNullish().arrays("comma"))
            .headers(h => h.custom("trace", headers => ({ ...headers, "X-Trace": "1" }))))
        .query("append", { ids: [1, 2, 3], gone: null })
        .headers("merge", { a: "1", A: "2" })
        .body("replace", { x: 1 })
        .request();
    assert.equal(calls[0].input, "https://x.invalid/?ids=1%2C2%2C3");
    // No `caseInsensitive`/`contentType` steps: both keys stay, no Content-Type is added.
    assert.deepEqual(calls[0].init.headers, { a: "1", A: "2", "X-Trace": "1" });
});

await test("a stage that leaves non-strings fails with SERIALIZE_FAILED", async () => {
    const { fetcher } = recorder();
    await assert.rejects(
        () => vigor.fetch("https://x.invalid").settings({ fetcher })
            .serializers(s => s.path(p => p.dropNullish()))
            .path("append", 1)
            .request(),
        (err) => err.code === "SERIALIZE_FAILED" && err.data.stage === "path"
    );
});

await test("with debug, the timeline records each stage's steps and output", async () => {
    const { fetcher } = recorder();
    const res = await vigor.fetch("https://x.invalid").settings({ fetcher, debug: true }).path("append", "a").requestVerbose();
    const path = res.timeline.find(e => e.action === "SERIALIZED" && e.content.stage === "path");
    assert.deepEqual(path.content.steps, ["dropNullish", "stringify", "split(\"/\")", "encode", "prefixOrigin"]);
    assert.deepEqual(path.content.output, ["a"]);
});

await test("retry()/parse() merge into the current engine config; an instance replaces it", async () => {
    const f = vigor.fetch("https://x.invalid");

    const cb = f.retry(r => r.settings({ maxAttempts: 8 })).retry(r => r.settings({ timeout: 100 }));
    assert.equal(cb.config.policy.retry.policy.settings.maxAttempts, 8, "the second callback lost the first one's setting");
    assert.equal(cb.config.policy.retry.policy.settings.timeout, 100);
    assert.equal(cb.config.policy.retry.policy.settings.maxRestarts, 3, "an unset value lost its default");

    const obj = f.retry({ policy: { settings: { maxAttempts: 8 } } }).retry(r => r.settings({ timeout: 100 }));
    assert.equal(obj.config.policy.retry.policy.settings.maxAttempts, 8, "the callback did not start from the object's config");

    const algo = f.retry(r => r.algorithms(a => a.linear())).retry({ policy: { algorithms: { _tag: "constant", interval: 0, jitter: 0 } } });
    assert.equal(algo.config.policy.retry.policy.algorithms._tag, "constant", "the algorithm was not replaced");

    const inst = f.retry(r => r.settings({ maxAttempts: 8 })).retry(new VigorRetry());
    assert.equal(inst.config.policy.retry.policy.settings.maxAttempts, 5, "an instance did not replace the engine");

    const parsed = f.parse(p => p.settings({ raw: true })).parse(p => p.settings({ maxRestarts: 1 }));
    assert.equal(parsed.config.policy.parse.policy.settings.raw, true, "the second parse callback lost the first one's setting");
    assert.equal(parsed.config.policy.parse.policy.settings.maxRestarts, 1);

    // The merged retry config is the one used.
    let attempts = 0;
    await assert.rejects(
        () => f.settings({ fetcher: async () => { attempts++; return new Response("x", { status: 503 }); } })
            .retry(r => r.settings({ maxAttempts: 2 }))
            .retry(r => r.algorithms(a => a.constant({ interval: 0, jitter: 0 })))
            .request(),
        (err) => err.code === "RETRY_EXHAUSTED"
    );
    assert.equal(attempts, 2, "maxAttempts from the first retry() call was not used");
});

await test("A fluent onError recovers with the value it returns, and leaves the failure on undefined", async () => {
    const failing = () => vigor.retry(async () => { throw new Error("boom") }).settings({ maxAttempts: 1 });

    const recovered = await failing().middlewares(m => m.onError("fluent", () => "fallback")).requestVerbose();
    assert.equal(recovered.success, true, "a returned value did not recover");
    assert.equal(recovered.data, "fallback", "the recovered result is not the returned value");

    const asyncRecovered = await failing().middlewares(m => m.onError("fluent", async () => 0)).request();
    assert.equal(asyncRecovered, 0, "an awaited (falsy) value did not recover");

    const nullRecovered = await failing().middlewares(m => m.onError("fluent", () => null)).request();
    assert.equal(nullRecovered, null, "null did not recover");

    const seen = [];
    const observed = await failing().middlewares(m => m.onError("fluent", (err) => { seen.push(err) })).requestVerbose();
    assert.equal(observed.success, false, "returning nothing recovered");
    assert.equal(seen.length, 1, "the fluent onError did not run");

    // A later fluent onError returning nothing doesn't undo an earlier recovery.
    const kept = await failing().middlewares(m => m.onError("fluent", () => "first").onError("fluent", () => undefined)).request();
    assert.equal(kept, "first", "a later undefined undid the recovery");

    // The recovery wins over `default`, like setResult does.
    const overDefault = await failing().settings({ default: () => "default" }).middlewares(m => m.onError("fluent", () => "fluent")).request();
    assert.equal(overDefault, "fluent", "default won over the fluent recovery");

    // The parse engine too.
    const parsed = await vigor.parse(new Response("not json", { headers: { "content-type": "application/json" } }))
        .middlewares(m => m.onError("fluent", () => "parse-fallback"))
        .request();
    assert.equal(parsed, "parse-fallback", "the parse engine's fluent onError did not recover");
});

await test("A fetch's fluent onError recovers a failed request: no status, no response", async () => {
    const server = http.createServer((req, res) => {
        res.statusCode = 500;
        res.end("down");
    });
    await new Promise((resolve) => server.listen(0, resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    try {
        const base = vigor.fetch(origin).retry({ policy: { settings: { maxAttempts: 1 } } });
        const recovered = await base.middlewares(m => m.onError("fluent", (err) => err.code === "RETRY_EXHAUSTED" ? { offline: true } : undefined)).requestVerbose();
        assert.equal(recovered.success, true, "the fetch was not recovered");
        assert.deepEqual(recovered.data, { offline: true }, "the recovered result is not the returned value");
        assert.equal(recovered.status, null, "a recovered result has a status");
        assert.equal(recovered.response, null, "a recovered result has a response");

        const observed = await base.middlewares(m => m.onError("fluent", () => undefined)).requestVerbose();
        assert.equal(observed.success, false, "undefined recovered the fetch");
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