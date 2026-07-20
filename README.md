# vigor-fetch

**A composable, lightweight network workflow toolkit built on native Fetch.**

Vigor gives you an immutable, chainable API for building robust network logic: retry with configurable backoff, content-aware response parsing, and concurrency-limited task running — all composed together, or used standalone.

---

## Features

- 🧩 **Immutable, fluent builders** — every call returns a new instance; nothing is mutated in place
- 🔁 **Two-level retry** — per-attempt retry/backoff *and* whole-pipeline restart, each independently configurable
- 🌐 **Smart fetch layer** — automatic `429 Retry-After` handling, configurable "never retry" status codes
- 🔌 **Content-aware parsing** — auto-detects `Content-Type`, with a sniffing fallback and custom strategies
- ⚡ **Bounded concurrency runner** — run many tasks with a concurrency cap and per-task hooks
- 🪝 **Two middleware modes** — `"fluent"` (return a value) or `"intercept"` (get an explicit control API)
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
vigor.parse(response?) // -> VigorParse, target pre-set if given
vigor.all(...tasks)    // -> VigorAll, target pre-set if any tasks given
vigor.use(plugin, options?)
```

Every module follows the same shape: an **immutable builder** with `.settings()`, `.middlewares()`, and a terminal `.request()` / `.requestVerbose()` pair.

- `.request()` returns the result directly and **throws** on final failure.
- `.requestVerbose()` never throws — it returns `{ success: true, data, error: null }` or `{ success: false, data: null, error }`.

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
| `parse(fn \| config \| VigorParse)` | Configures the **internal parse engine** used to interpret the response |
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

### headers / body / options

```ts
vigor.fetch("/api")
  .headers("merge", { Authorization: "Bearer token" })
  .body("overwrite", { username: "john" })
  .options("merge", { credentials: "include" })
```

Body is auto-normalized based on type (string, `Blob`, `ArrayBuffer`, `URLSearchParams`, `FormData`, or plain object → JSON), and a matching `Content-Type` header is set automatically unless you've already set one via `.headers()`.

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
| `retryHeaders(...strs)` | Response headers checked for a `429` retry delay | `["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"]` |
| `unretryStatus(...nums)` | HTTP status codes that are never retried, regardless of the retry engine's attempt budget | `[400, 401, 403, 404, 405, 413, 422]` |
| `maxRestarts(num)` | Max number of full pipeline restarts (see `onError` below) | `3` |
| `default(fn)` | Fallback value/factory used only if the request ultimately fails and no restart/override happened | throws |

On any non-`unretryStatus` failure response, the internal retry engine retries per its own `settings`/`algorithms` (defaults: 5 attempts, 20s timeout, exponential-ish backoff jitter — see `vigor.retry` below). On a `429`, Vigor reads `retryHeaders` off the response and uses that value (seconds or an HTTP date) as the next delay automatically.

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

---

## `vigor.retry`

### Methods

| Method | Description |
|---|---|
| `target(fn)` | Sets the function to run: `(signal: AbortSignal) => any \| Promise<any>` |
| `abortSignals(...sigs)` | Attaches external `AbortSignal`s that cancel the current attempt when aborted |
| `settings(fn \| config)` | General retry settings (below) |
| `middlewares(fn \| config)` | Middleware pipeline (below) |
| `algorithms(fn)` | Selects and configures the delay algorithm (below) |
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
| `timeout(ms)` | Timeout per individual attempt | `20000` |

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
| `target(response)` | Sets the `Response` to parse |
| `settings(fn \| config)` | General settings (below) |
| `middlewares(fn \| config)` | Middleware pipeline (below) |
| `strategies(fn \| config)` | Configures the ordered fallback chain of parsing strategies |
| `request()` / `requestVerbose()` | Executes |

### settings

| Method | Description | Default |
|---|---|---|
| `raw(bool)` | When `true`, skips parsing entirely and returns the raw `Response` object | `false` |
| `default(fn)` | Fallback value/factory when parsing ultimately fails | throws |
| `maxRestarts(num)` | Max full pipeline restarts | `3` |

### strategies

Strategies form an ordered list that's tried in sequence until one succeeds (each attempt but the last clones the response first, so a failed strategy doesn't consume the body). If you never configure any, Vigor defaults to content-type detection.

```ts
.strategies(s => s.sniff())
```

| Method | Behavior |
|---|---|
| `contentType(replace?)` | Parses based on the response's `Content-Type` header (JSON / XML / form-urlencoded / octet-stream / image / audio / video / multipart / text) |
| `sniff(replace?)` | Tries `json → formData → text → blob` in order until one parses |
| `json(replace?)` | Always parses as JSON |
| `text(replace?)` | Always parses as text |
| `arrayBuffer(replace?)` | Always parses as `ArrayBuffer` |
| `blob(replace?)` | Always parses as `Blob` |
| `bytes(replace?)` | Always parses as `Uint8Array` |
| `formData(replace?)` | Always parses as `FormData` |
| `custom(func, replace?)` | Uses a custom `(response: Response) => Promise<any>` |

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

Runs a fixed list of zero-argument tasks with bounded concurrency.

### Methods

| Method | Description |
|---|---|
| `target(...funcs)` | Sets the task list — each is `() => unknown \| Promise<unknown>` |
| `settings(fn \| config)` | Concurrency settings (below) |
| `middlewares(fn \| config)` | Per-task hooks (below) |
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
| `onlySuccess(bool)` | When `true`, filters the final array down to only tasks whose middleware chain resolved successfully | `false` |

> Unlike `vigor.retry`/`vigor.fetch`/`vigor.parse`, `vigor.all` has no `default`/fallback setting, and per-task failures don't throw the whole call by themselves — a task that fails (and whose `onError` middleware doesn't call `setResult`) simply contributes its error value into the results array (or is dropped, if `onlySuccess` is on). The only thing that makes `.request()` throw is an **empty** task list.

### hooks (`middlewares`)

Unlike the other modules, `all`'s per-task hooks are plain functions — there's no `"fluent"`/`"intercept"` mode split.

| Stage | Signature | Runs |
|---|---|---|
| `before(fn)` | `(ctx) => void \| Promise<void>` | Before each task is invoked |
| `after(fn)` | `(ctx) => void \| Promise<void>` | After a task settles successfully |
| `onError(fn)` | `(ctx, { setResult }) => void \| Promise<void>` | When an individual task throws |

```ts
.middlewares(m => m
  .onError(async (ctx, api) => {
    console.error(ctx.error);
    api.setResult(null); // recover instead of letting this task register as failed
  })
)
```

---

## Plugins

```ts
export type VigorPlugin<O> = {
  options: O // type-only anchor for inferring O — not used at runtime
  func: (v: typeof vigor, options: O) => void
}

vigor.use(plugin, options?)
```

`vigor.use(plugin, options)` simply invokes `plugin.func(vigor, options)` — a lightweight hook for setup-time side effects (e.g. registering shared config, wiring up logging) rather than a full plugin/extension system.

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

Or avoid try/catch entirely with `requestVerbose()`:

```ts
const res = await vigor.fetch("/api/users").requestVerbose();
if (!res.success) {
  // res.error is typed, res.data is null
}
```

| Module | Error codes |
|---|---|
| `VigorFetchError` | `VALUE_REQUIRED`, `INVALID_BODY`, `INVALID_PROTOCOL`, `FETCH_FAILED`, `RESTART_EXHAUSTED` |
| `VigorRetryError` | `VALUE_REQUIRED`, `RETRY_EXHAUSTED`, `RESTART_EXHAUSTED`, `TIMED_OUT` |
| `VigorParseError` | `VALUE_REQUIRED`, `INVALID_CONTENT_TYPE`, `PARSER_NOT_FOUND`, `PARSER_ALL_FAILED`, `RESTART_EXHAUSTED` |
| `VigorAllError` | `EMPTY_TARGET` |

`FETCH_FAILED`'s `data` includes `parsed`: Vigor best-effort parses the failed response's body (using your configured parse strategies) before throwing, so you can inspect an API's error payload without re-fetching. If parsing that body also fails, `parsed` is simply `undefined`.

---

## TypeScript notes

- Every builder is **immutable** — `.settings(...)`, `.path(...)`, etc. all return a *new* instance with the change merged in; the original is untouched.
- Array-valued config (`path`, `query`, parse `strategies`, etc.) **concatenates** across calls by default; object-valued config deep-merges. A handful of methods (`hash`, `headers("overwrite", ...)`, `body("overwrite", ...)`, `options("overwrite", ...)`, `retry(...)`, `parse(...)`, `algorithms(...)`) force a full **replace** instead, since merging wouldn't make sense there.
- Config shape is tracked through the whole chain via TypeScript generics, so `.settings()`/`.middlewares()` callbacks and `.request()`'s inferred return type stay accurate as you chain.