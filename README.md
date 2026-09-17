# vigor-fetch

**A composable, lightweight network workflow toolkit built on native Fetch.**

Vigor gives you an immutable, chainable API for building robust network logic: retry with configurable backoff, content-aware response parsing, and concurrency-limited task running — all composed together, or used standalone.

---

## Features

- 🧩 **Immutable, fluent builders** — every call returns a new instance; nothing is mutated in place
- 🔁 **Two-level retry** — per-attempt retry/backoff *and* whole-pipeline restart, each independently configurable
- 🌐 **Smart fetch layer** — automatic `429 Retry-After` handling, configurable "never retry" status codes
- 🔌 **Content-aware parsing** — auto-detects `Content-Type`, with a sniffing fallback and custom strategies
- ⚡ **Bounded concurrency runner** — run many tasks with a concurrency cap, batch-level hooks, and per-task hooks
- 🪝 **Two middleware modes** — `"fluent"` (return a value) or `"intercept"` (get an explicit control API)
- 🧬 **Type-level result override** — `.cast<T>()` on every module, when you know better than inference does
- 🧠 **TypeScript-first** — config shape is inferred and carried through the whole chain

---

## Installation

```bash
npm install vigor-fetch
```

## Import

```ts
import vigor from "vigor-fetch";
// or
import { vigor } from "vigor-fetch";
```

Both work — `vigor` is exported as both the default and a named export. Every internal class (`VigorFetch`, `VigorRetry`, `VigorParse`, `VigorAll`, their settings/middleware/strategy/algorithm builders, and error classes) is also exported by name if you want to construct them directly instead of going through `vigor.*`.

---

## Quick start

### Fetch

```ts
import vigor from "vigor-fetch";

const data = await vigor
  .fetch("https://api.example.com")
  .path("v1", "users")
  .query({ page: 1, limit: 10 })
  .request();
// -> GET https://api.example.com/v1/users?page=1&limit=10
```

### Retry (standalone)

```ts
const data = await vigor
  .retry(async (signal) => {
    return await db.select("...");
  })
  .request();
```

### Parse (standalone)

```ts
const response = await fetch("https://api.example.com");

const data = await vigor
  .parse(response)
  .request();
```

### Concurrency

```ts
const results = await vigor
  .all(
    () => fetch("/api/1"),
    () => fetch("/api/2")
  )
  .request();
```

---

## The `vigor` object

```ts
vigor.fetch(origin?)   // -> VigorFetch, origin pre-set if given
vigor.retry(task?)     // -> VigorRetry, target pre-set if given
vigor.parse(request|response?) // -> VigorParse, target pre-set if given
vigor.all(...tasks)    // -> VigorAll, target pre-set if any tasks given
vigor.use(plugin, options?)
vigor.builders         // direct access to each module's sub-builders
```

Every module follows the same shape: an **immutable builder** with `.settings()`, `.middlewares()`, a terminal `.request()` / `.requestVerbose()` pair, and a `.cast<T>()` escape hatch for the result type.

- `.request()` returns the result directly and **throws** on final failure.
- `.requestVerbose()` never throws — it returns `{ success: true, data, error: null }` or `{ success: false, data: null, error }`.
- `.cast<T>()` overrides the inferred result type with `T`. It can be called before or after any other configuration method — whichever `.cast<T>()` call happens *last* in the chain wins, and it always takes priority over the naturally-inferred type.

### `vigor.builders`

Every sub-builder used internally by `.settings()`/`.middlewares()`/etc. is also reachable directly, if you'd rather construct a reusable config object outside of a chain:

```ts
vigor.builders.fetch.settings()      // -> VigorFetchPolicySettings
vigor.builders.fetch.middlewares()   // -> VigorFetchPolicyMiddlewares

vigor.builders.retry.settings()      // -> VigorRetryPolicySettings
vigor.builders.retry.middlewares()   // -> VigorRetryPolicyMiddlewares
vigor.builders.retry.algorithms()    // -> VigorRetryPolicyAlgorithms
vigor.builders.retry.algorithm.constant()
vigor.builders.retry.algorithm.linear()
vigor.builders.retry.algorithm.backoff()
vigor.builders.retry.algorithm.custom()

vigor.builders.parse.settings()      // -> VigorParsePolicySettings
vigor.builders.parse.middlewares()   // -> VigorParsePolicyMiddlewares
vigor.builders.parse.strategies()    // -> VigorParsePolicyStrategies

vigor.builders.all.settings()        // -> VigorAllPolicySettings
vigor.builders.all.middlewares()     // -> VigorAllPolicyMiddlewares
```

This is equivalent to `new VigorFetchPolicySettings()` etc., just namespaced under `vigor` for discoverability.

---

## `vigor.fetch`

### Methods

| Method | Description |
|---|---|
| `method(str)` | Forces the HTTP method. Default: `POST` if a body is set, otherwise `GET` |
| `origin(str)` | Sets the base URL (absolute) or a path relative to the current page |
| `path(...strs)` | Appends path segments |
| `query(...objs)` | Adds query-parameter objects (each call appends another object to the list) |
| `hash(str)` | Sets the URL fragment, replacing any previous value |
| `headers(mode, obj)` | Sets headers. `mode`: `"overwrite"` (discard previous) or `"merge"` (`Object.assign`-style) |
| `body(mode, obj)` | Sets the body. `"overwrite"` replaces it entirely; `"merge"` shallow-merges when both old and new body are plain objects, otherwise replaces |
| `options(mode, obj)` | Sets extra native `RequestInit` fields other than `method`/`headers`/`body`/`signal` (e.g. `credentials`, `mode`, `cache`) |
| `settings(fn \| config)` | Configures fetch-level settings (below) |
| `middlewares(fn \| config)` | Configures the fetch middleware pipeline (below) |
| `retry(fn \| config \| VigorRetry)` | Configures the **internal retry engine** used to send the request |
| `parse(fn \| config \| VigorParse)` | Configures the **internal parse engine** used to interpret the request or response |
| `cast<T>()` | Overrides the inferred result type with `T` |
| `request()` | Executes and returns the parsed result, throwing on failure |
| `requestVerbose()` | Executes and returns `{ success, data, error }` |

> `path()`, `query()`, `headers()` in merge mode, etc. are all additive per call — chain them incrementally rather than passing everything in one call.

### origin / path / query / hash

```ts
vigor.fetch("https://api.example.com/", "/api")
  .path("v1", "users")
  .query({ page: 1 })
  .hash("section-2")
// -> https://api.example.com/api/v1/users?page=1#section-2
```

`origin()` only accepts one argument — pass origin + first path segments as separate calls, or fold extra segments into `path()`.

Path segments are percent-encoded, so values like `"a b"` or `"x?y"` can never leak into the query or fragment. A `/` inside a segment still separates path levels: `.path("v1/users", "a b")` → `/v1/users/a%20b`. Pass segments **unencoded** — an already-encoded `%20` would be encoded again.

### headers / body / options

```ts
vigor.fetch("/api")
  .headers("merge", { Authorization: "Bearer token" })
  .body("overwrite", { username: "john" })
  .options("merge", { credentials: "include" })
```

Body is auto-normalized based on type (string, `Blob`, `ArrayBuffer`/typed array/`DataView`, `ReadableStream`, `URLSearchParams`, `FormData`, or plain object → JSON), and a matching `Content-Type` header is set automatically unless you've already set one via `.headers()` (header names are compared case-insensitively). `body("overwrite", null)` removes a previously set body.

> A `ReadableStream` body can only be sent once, so a retried or restarted request with a stream body will fail — use a replayable body type if you rely on retries.

### settings

```ts
.settings(s => s
  .unretryStatus(400, 401, 403, 404, 405, 413, 422)
  .retryHeaders("retry-after", "x-ratelimit-reset")
  .maxRestarts(3)
  .default(ctx => ({ fallback: true }))
)
```

| Method | Description | Default |
|---|---|---|
| `retryHeaders(...strs)` | Response headers checked for a `429`/`503` retry delay | `["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"]` |
| `unretryStatus(...nums)` | HTTP status codes that are never retried, regardless of the retry engine's attempt budget | `[400, 401, 403, 404, 405, 413, 422]` |
| `redirect(bool)` | On a `3xx` response with a `Location` header, navigates the page via `window.location.href` | `true` |
| `maxRestarts(num)` | Max number of full pipeline restarts (see `onError` below) | `3` |
| `default(fn)` | Fallback value/factory used only if the request ultimately fails and no restart/override happened | throws |

`retryHeaders` and `unretryStatus` **replace** the whole list (in both the builder and the config-object form), so you can also remove defaults — e.g. `.settings({ unretryStatus: [] })` makes every failure status retryable. To extend the defaults instead, spread `VigorFetchPolicySettingsBase.unretryStatus`.

On any non-`unretryStatus` failure response, the internal retry engine retries per its own `settings`/`algorithms` (defaults: 5 attempts, 20s timeout, exponential-ish backoff jitter — see `vigor.retry` below). On a `429` or `503`, Vigor reads `retryHeaders` off the response and uses the first usable value as the next delay automatically. Delta seconds (`Retry-After: 120`), Unix epoch seconds/milliseconds (`X-RateLimit-Reset: 1735689600`), and HTTP dates are all understood.

### redirect

With `settings.redirect` left `true`, a `3xx` response that carries a `Location` header navigates the browser to it:

```ts
await vigor
  .fetch("/api/session")
  .options("merge", { redirect: "manual" }) // otherwise fetch follows 3xx itself
  .request();
// 302 Location: /login  ->  window.location.href = "https://app.example.com/login"
```

- A relative `Location` is resolved against the responding URL.
- Navigation isn't instant, so the call still settles: it fails with `VigorFetchError("REDIRECTED")`, whose `data` holds `{ url, status, response }`. That attempt is never retried.
- **Without `window.location` (Node, workers, SSR) it does nothing and behaves exactly like `redirect(false)`** — the `3xx` falls through to the normal failure path (`FETCH_FAILED`, retried per your retry config).
- Native `fetch` follows redirects on its own by default, so a `3xx` only reaches Vigor when you pass `redirect: "manual"` (or `"error"`) through `.options()`. Note that in browsers `"manual"` yields an opaque response with no readable `Location`, so same-origin navigation of this kind is mostly useful where the response is readable (e.g. a proxy under your control, or a non-browser runtime with a `window` shim).
- Statuses without a `Location` (e.g. `304 Not Modified`) are left alone.

### interceptors (`middlewares`)

Every stage takes a mode as the first argument: `"fluent"` (return a plain value) or `"intercept"` (receive an explicit API object and return the context).

```ts
.middlewares(m => m
  .before("intercept", async (ctx, api) => {
    api.setHeaders({ ...ctx.options.headers, "X-Trace": crypto.randomUUID() });
    return ctx;
  })
  .onError("intercept", async (ctx, api) => {
    if (ctx.error instanceof SomeRecoverableError) api.proceedRestart();
    return ctx;
  })
)
```

| Stage | Runs | Intercept API |
|---|---|---|
| `before` | Before the request is sent | `throwError`, `setOptions`, `setHeaders`, `setBody` |
| `after` | After the response is parsed | `setResult`, `throwError` |
| `onResult` | Right before returning the final result | `setResult`, `throwError` |
| `onError` | After the request has finally failed | `setResult`, `throwError`, `proceedRestart`, `cancelRestart` |

Fluent-mode signatures: `before`/`after` take `(ctx) => void`, `onResult` takes `(res) => newRes`, `onError` takes `(err) => void`.

In `before`, `ctx.options` already holds the built request (`method`, `headers`, `body`, extra options), so a fluent middleware can also edit it directly — e.g. `ctx.options.headers["X-Trace"] = id`.

An intercept middleware that returns nothing keeps the current context (this applies to every module).

`onError` → `proceedRestart()` re-runs the **entire** fetch pipeline from scratch (up to `settings.maxRestarts` times) — this is separate from, and on top of, the internal retry engine's per-attempt retries.

### retry / parse (nested engines)

```ts
const data = await vigor
  .fetch("/api/users")
  .retry(r => r.settings(s => s.maxAttempts(8)).algorithms(a => a.backoff({ multiplier: 2 })))
  .parse(p => p.strategies(s => s.sniff()))
  .request();
```

Both accept a config object, a builder callback, or an already-built `VigorRetry`/`VigorParse` instance. The target function you'd normally set with `.target()` is ignored here — fetch always supplies its own target (the actual `fetch()` call) and its own `.target()` (`response.clone()` fed through your parse config).

### cast

```ts
const data = await vigor
  .fetch("/api/users")
  .parse(p => p.strategies(s => s.json()))
  .cast<{ id: string; name: string }[]>()
  .request();
// data: { id: string; name: string }[]
```

Without `.cast()`, the result type falls back to whatever your `parse()` config naturally infers (`unknown` if unconfigured). `.cast()` overrides that regardless of where in the chain it's called.

---

## `vigor.retry`

### Methods

| Method | Description |
|---|---|
| `target(fn)` | Sets the function to run: `(signal: AbortSignal) => any \| Promise<any>` |
| `abortSignals(...sigs)` | Attaches external `AbortSignal`s. Aborting cancels the current attempt (or the pending retry delay) and stops retrying |
| `settings(fn \| config)` | General retry settings (below) |
| `middlewares(fn \| config)` | Middleware pipeline (below) |
| `algorithms(fn)` | Selects and configures the delay algorithm (below) |
| `cast<T>()` | Overrides the inferred result type with `T` |
| `request()` / `requestVerbose()` | Executes |

```ts
const controller = new AbortController();

await vigor
  .retry(async (signal) => fetch("/api", { signal }))
  .abortSignals(controller.signal)
  .settings(s => s.maxAttempts(5).timeout(5000))
  .request();
```

### settings

| Method | Description | Default |
|---|---|---|
| `default(fn)` | Fallback value/factory when the target ultimately fails | throws |
| `maxAttempts(num)` | Max attempts before giving up on this run | `5` |
| `maxRestarts(num)` | Max full pipeline restarts (see `onError`) | `3` |
| `timeout(ms)` | Timeout per individual attempt. `0` or `Infinity` disables it | `20000` |

### algorithms

Delay algorithm is a **replace**, not merge — switching algorithms discards the previous one's config.

```ts
.algorithms(a => a.backoff({ initial: 1000, multiplier: 1.7 }))
```

| Algorithm | Fields (with defaults) |
|---|---|
| `constant(cfg?)` | `interval` (`2000`), `jitter` (`1000`) |
| `linear(cfg?)` | `initial` (`500`), `increment` (`1000`), `minDelay` (`0`), `maxDelay` (`10000`), `jitter` (`1000`) |
| `backoff(cfg?)` | `initial` (`0`), `multiplier` (`1.7`), `unit` (`1000`), `minDelay` (`500`), `maxDelay` (`10000`), `jitter` (`800`) |
| `custom(cfg?)` | `target: (attempt) => number` (required), `minDelay` (`500`), `maxDelay` (`10000`), `jitter` (`800`) |

Each computed delay is clamped to `[minDelay, maxDelay]` (except `constant`, which has no bounds) and then perturbed by `±jitter` ms.

```ts
.algorithms(a => a.custom({
  target: (attempt) => attempt * 3000
}))
```

### interceptors (`middlewares`)

```ts
.middlewares(m => m
  .retryIf("intercept", async (ctx, api) => {
    if (ctx.error instanceof TypeError) api.proceedRetry();
    else api.cancelRetry();
    return ctx;
  })
  .onRetry("intercept", async (ctx, api) => {
    api.setDelay(5000);
    return ctx;
  })
)
```

| Stage | Runs | Intercept API |
|---|---|---|
| `before` | Before each attempt | `throwError`, `abort`, `breakRetry` |
| `after` | After the target settles successfully | `setResult`, `throwError` |
| `onResult` | Right before returning the attempt's result | `setResult`, `throwError` |
| `retryIf` | After a failed attempt, decides whether to retry | `proceedRetry`, `cancelRetry` |
| `onRetry` | Right before the retry delay is awaited | `throwError`, `setDelay` |
| `onError` | After attempts are exhausted (or `breakRetry` was called) | `setResult`, `throwError`, `proceedRestart`, `cancelRestart` |

Fluent-mode signatures: `before`/`after` take `(ctx) => void`, `onResult` takes `(res) => newRes`, `retryIf` takes `(err) => boolean`, `onRetry`/`onError` take `(err) => void`.

There are two independent resilience layers here:
- **`retryIf`/`onRetry`** loop through attempts (bounded by `settings.maxAttempts`) without ever fully failing.
- **`onError`** fires once attempts are exhausted; calling `api.proceedRestart()` there resets the attempt counter and starts over (bounded by `settings.maxRestarts`).

---

## `vigor.parse`

### Methods

| Method | Description |
|---|---|
| `target(request\|response)` | Sets the `Request\|Response` to parse |
| `settings(fn \| config)` | General settings (below) |
| `middlewares(fn \| config)` | Middleware pipeline (below) |
| `strategies(fn \| config)` | Configures the ordered fallback chain of parsing strategies |
| `cast<T>()` | Overrides the inferred result type with `T` |
| `request()` / `requestVerbose()` | Executes |

### settings

| Method | Description | Default |
|---|---|---|
| `raw(bool)` | When `true`, skips parsing entirely and returns the raw `Request\|Response` object | `false` |
| `default(fn)` | Fallback value/factory when parsing ultimately fails | throws |
| `maxRestarts(num)` | Max full pipeline restarts | `3` |

### strategies

Strategies form an ordered list that's tried in sequence until one succeeds (each attempt but the last clones the request|response first, so a failed strategy doesn't consume the body). If you never configure any, Vigor defaults to content-type detection.

```ts
.strategies(s => s.sniff())
```

| Method | Behavior |
|---|---|
| `contentType(replace?)` | Parses based on the request|response's `Content-Type` header (JSON / XML / form-urlencoded / octet-stream / image / audio / video / multipart / text). A body-less response (e.g. `204 No Content`) or an empty JSON body resolves to `null`; a response without `Content-Type` is read as text |
| `sniff(replace?)` | Tries `json → formData → text → blob` in order until one parses |
| `json(replace?)` | Always parses as JSON |
| `text(replace?)` | Always parses as text |
| `arrayBuffer(replace?)` | Always parses as `ArrayBuffer` |
| `blob(replace?)` | Always parses as `Blob` |
| `bytes(replace?)` | Always parses as `Uint8Array` |
| `formData(replace?)` | Always parses as `FormData` |
| `custom(func, replace?)` | Uses a custom `(request\|response: Request\|Response) => Promise<any>` |

By default each call **appends** to the chain (they concatenate, so you can layer fallbacks: e.g. `contentType()` then `sniff()` as a last resort). Pass `replace: true` as the trailing argument to replace the whole chain instead.

### interceptors (`middlewares`)

| Stage | Runs | Intercept API |
|---|---|---|
| `before` | Before parsing starts | `throwError` |
| `after` | After a strategy succeeds | `setResult`, `throwError` |
| `onResult` | Right before returning the final result | `setResult`, `throwError` |
| `onError` | When every strategy in the chain failed | `setResult`, `throwError`, `proceedRestart`, `cancelRestart` |

```ts
const data = await vigor
  .parse(response)
  .strategies(s => s.sniff())
  .middlewares(m => m.onError("intercept", async (ctx, api) => {
    api.setResult(null);
    return ctx;
  }))
  .request();
```

---

## `vigor.all`

Runs a fixed list of tasks with bounded concurrency, `Promise.allSettled`-style — an individual task failing never makes the whole batch throw by itself.

### Methods

| Method | Description |
|---|---|
| `target(...funcs)` | Sets the task list — each is `(signal: AbortSignal) => unknown \| Promise<unknown>` |
| `abortSignals(...signals)` | External signals that cancel the remaining tasks and fail the batch with the signal's reason |
| `settings(fn \| config)` | Concurrency settings (below) |
| `middlewares(fn \| config)` | Batch-level and per-task hooks (below) |
| `cast<T>()` | Overrides the inferred result type with `T` |
| `request()` / `requestVerbose()` | Executes |

```ts
const results = await vigor
  .all(
    () => fetch("/api/1"),
    () => fetch("/api/2"),
    () => fetch("/api/3")
  )
  .settings(s => s.concurrency(2).onlySuccess(true))
  .request();
```

### settings

| Method | Description | Default |
|---|---|---|
| `concurrency(num)` | Max number of tasks running at once | `5` |
| `onlySuccess(bool)` | When `true`, filters the final array down to only tasks whose result wasn't recovered as a failure | `false` |
| `timeout(ms)` | Per-task timeout. A task exceeding it fails with `VigorAllError("TIMED_OUT")` (recoverable via `onErrorEach`) | disabled |
| `failFast(bool)` | When `true`, the first task failure not recovered by `onErrorEach` aborts the remaining tasks and makes the batch fail with that error | `false` |

Each task receives an `AbortSignal` that fires on its timeout, on an external `abortSignals` abort, or when `failFast` stops the batch. Pass it along (e.g. to `fetch`) so in-flight work actually stops — a task that ignores it keeps running in the background, but its result is discarded.

```ts
const results = await vigor
  .all(
    (signal) => fetch("/api/1", { signal }),
    (signal) => fetch("/api/2", { signal })
  )
  .abortSignals(controller.signal)
  .settings(s => s.timeout(5000).failFast(true))
  .request();
```

> Unlike `vigor.retry`/`vigor.fetch`/`vigor.parse`, `vigor.all` has no `default`/fallback setting and no batch-level `onError`. By default the batch only fails on an **empty** task list (`EMPTY_TARGET`), an external abort, a `failFast` stop, or an `onErrorEach` hook throwing. Per-task failures are otherwise handled by `onErrorEach` (below).

**Result typing:** when `onlySuccess` is `false` (the default) and `target(...)` is given as literal task functions, the result is inferred as a **tuple** matching each task's own return type — `.target(() => 1 as const, () => "a")` infers `[1, "a"]`, not `unknown[]`. Setting `onlySuccess(true)` filters the array at runtime to an arbitrary length, so the type falls back to a plain array. `.cast<T>()` overrides either case.

### hooks (`middlewares`)

`all` has **two tiers** of hooks: batch-level stages (run once for the whole call, support `"fluent"`/`"intercept"` modes like the other modules) and per-task stages (run once per task, plain callbacks with no mode argument).

| Stage | Level | Runs | API |
|---|---|---|---|
| `before(type, fn)` | Batch | Once, before any task starts | `throwError` (intercept mode) |
| `after(type, fn)` | Batch | Once, after every task has settled | `setResult`, `throwError` (intercept mode) |
| `onResult(type, fn)` | Batch | Once, right before returning the final result | `setResult`, `throwError` (intercept mode) |
| `beforeEach(fn)` | Per-task | Before each individual task is invoked | — |
| `afterEach(fn)` | Per-task | After a task settles successfully | — |
| `onErrorEach(fn)` | Per-task | When an individual task throws (including `TIMED_OUT`) | `setResult` |

Per-task hooks receive a context with `index` (the task's position in `target`), `result`, `error`, and `flags.overridden`.

```ts
.middlewares(m => m
  .before("fluent", (ctx) => { console.log("starting batch"); })
  .onResult("intercept", async (ctx, api) => {
    if (ctx.result.length === 0) api.throwError(new Error("nothing succeeded"));
    return ctx;
  })
  .onErrorEach(async (ctx, api) => {
    console.error(ctx.error);
    api.setResult(null); // recover instead of letting this task register as failed
  })
)
```

Batch-level fluent signatures: `before`/`after` take `(ctx) => void`, `onResult` takes `(res) => newRes`. Per-task hooks (`beforeEach`, `afterEach`, `onErrorEach`) are always plain functions — there's no fluent/intercept split for these, since they observe/mutate a single task's context rather than the pipeline's control flow.

---

## Plugins

```ts
export type VigorPlugin<
  O extends Record<string, any> = {},
  Ext extends Record<string, any> = Record<string, any>
> = {
  options: O
  func: (v: VigorInstance, options: O) => Ext
}

vigor.use(plugin, options?)
```

`plugin.func` receives the current `vigor` instance (read-only — plugins never mutate it, e.g. they might read it to wrap an existing method) and returns `Ext`, a set of properties to merge in. `vigor.use()` shallow-clones the instance it's called on (including its nested `builders` groups) and merges `Ext` on top, returning a **new** instance, typed `VigorInstance<Ext>`, while the original stays untouched. Calls chain: `vigor.use(a).use(b)` keeps both plugins' extensions, and `b` receives the instance that already includes `a`'s.

```ts
const loggingPlugin: VigorPlugin<{ prefix?: string }> = {
  options: {},
  func: (v, options) => ({
    fetch: (origin?: string) => v.fetch(origin).middlewares(m => m
      .before("fluent", (ctx) => console.log(options.prefix ?? "[vigor]", ctx.href))
    ),
  }),
};

const myVigor = vigor.use(loggingPlugin, { prefix: "[api]" });
```

---

## Error handling

Every module throws its own error subclass (`VigorFetchError`, `VigorRetryError`, `VigorParseError`, `VigorAllError`) — all extending a common `VigorError` with `.code`, `.data`, `.method`, `.context`, and `.timestamp`.

```ts
try {
  await vigor.fetch("/api/users").request();
} catch (err) {
  if (err instanceof VigorFetchError && err.code === "FETCH_FAILED") {
    console.log(err.data.status, err.data.parsed); // failed response's status + best-effort parsed body
  }
}
```

### typed errors

`requestVerbose()`'s `error` is typed per module, as **a union of that module's errors plus `{}`**:

| Module | `error` type |
|---|---|
| `vigor.retry` | `VigorRetryErrors \| {} \| null \| undefined` |
| `vigor.parse` | `VigorParseErrors \| {} \| null \| undefined` |
| `vigor.all` | `VigorAllErrors \| {} \| null \| undefined` |
| `vigor.fetch` | `VigorFetchErrors \| VigorRetryErrors \| VigorParseErrors \| {} \| null \| undefined` (the nested engines surface their own errors) |

`VigorRetryErrors` & co. are unions with **one member per error code**, so narrowing by `code` also narrows `data` to that code's payload. The `{} | null | undefined` tail is everything Vigor didn't create — an error your own target or middleware threw, an abort reason, a network `TypeError`, or even a bare `throw null`. It's there because those really do reach you: a `cancelRetry()`/`breakRetry()`/abort path returns your error as-is, rather than wrapping it.

Narrow with the exported guards — `isVigorRetryError`, `isVigorParseError`, `isVigorFetchError`, `isVigorAllError`:

```ts
const res = await vigor.retry(task).requestVerbose();
if (!res.success) {
  if (isVigorRetryError(res.error)) {
    res.error.code;                 // "VALUE_REQUIRED" | "RETRY_EXHAUSTED" | "RESTART_EXHAUSTED" | "TIMED_OUT"
    if (res.error.code === "TIMED_OUT") res.error.data.limit;       // number
    if (res.error.code === "RETRY_EXHAUSTED") res.error.data.error; // the last underlying error
  } else {
    res.error; // whatever your task threw
  }
}
```

Prefer the guard over a bare `instanceof`: because of the `{}` member, `instanceof` widens `data` back to every code's payload, while the guard keeps `code` and `data` in sync. And since the tail has no `code`, reading `res.error.code` without narrowing is a compile error — that's the point.

All four modules are typed this way. `request()` throws instead of returning an envelope, so its thrown value stays `unknown` — narrow it with the same guards.

Or avoid try/catch entirely with `requestVerbose()`:

```ts
const res = await vigor.fetch("/api/users").requestVerbose();
if (!res.success) {
  // res.error is typed, res.data is null
}
```

| Module | Error codes |
|---|---|
| `VigorFetchError` | `VALUE_REQUIRED`, `INVALID_BODY`, `INVALID_PROTOCOL`, `FETCH_FAILED`, `RESTART_EXHAUSTED`, `REDIRECTED` |
| `VigorRetryError` | `VALUE_REQUIRED`, `RETRY_EXHAUSTED`, `RESTART_EXHAUSTED`, `TIMED_OUT` |
| `VigorParseError` | `VALUE_REQUIRED`, `INVALID_CONTENT_TYPE`, `PARSER_NOT_FOUND`, `PARSER_ALL_FAILED`, `RESTART_EXHAUSTED` |
| `VigorAllError` | `EMPTY_TARGET`, `TIMED_OUT` |

`FETCH_FAILED`'s `data` includes `parsed`: Vigor best-effort parses the failed response's body (using your configured parse strategies) before throwing, so you can inspect an API's error payload without re-fetching. If parsing that body also fails, `parsed` is simply `undefined`.

---

## TypeScript notes

- Every builder is **immutable** — `.settings(...)`, `.path(...)`, etc. all return a *new* instance with the change merged in; the original is untouched.
- Array-valued config (`path`, `query`, parse `strategies`, etc.) **concatenates** across calls by default; object-valued config deep-merges. A handful of methods (`hash`, `headers("overwrite", ...)`, `body("overwrite", ...)`, `options("overwrite", ...)`, `retry(...)`, `parse(...)`, `algorithms(...)`) force a full **replace** instead, since merging wouldn't make sense there.
- Config shape is tracked through the whole chain via TypeScript generics, so `.settings()`/`.middlewares()` callbacks and `.request()`'s inferred return type stay accurate as you chain.
- `.cast<T>()` is available on every module (`fetch`, `retry`, `parse`, `all`) and always wins over the naturally-inferred type, regardless of where in the chain it's called.