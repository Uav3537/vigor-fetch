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
- 🕒 **Execution timeline** — with `settings.debug`, `requestVerbose()` returns a typed record of every step a request went through: each attempt's response, every retry decision and why, which middleware ran or threw, and how it ended — nested engines included
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
// -> [{ success: true, data: Response, error: null }, { success: false, data: null, error: TypeError }]
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
vigor.guards           // each module's error type guard
```

Every module follows the same shape: an **immutable builder** with `.settings()`, `.middlewares()`, a terminal `.request()` / `.requestVerbose()` pair, and a `.cast<T>()` escape hatch for the result type.

- `.request()` returns the result directly and **throws** on final failure.
- `.requestVerbose()` never throws — it returns `{ success: true, data, error: null, timeline }` or `{ success: false, data: null, error, timeline }`. `timeline` is recorded only with `settings.debug` on. See [Timeline](#timeline). `vigor.fetch`'s envelope also carries `status` and `response` — see [Status and response](#status-and-response).
- `.cast<T>()` overrides the inferred result type with `T`. It can be called before or after any other configuration method — whichever `.cast<T>()` call happens *last* in the chain wins, and it always takes priority over the naturally-inferred type.
- The result type includes what `settings.default` returns, since a fallback can become the result.
- `.request<R>()` / `.requestVerbose<R>()` take an optional type argument meaning "ignore the inference, it's `R`" — taken as-is, unchecked, for that call only. (`.cast<T>()` does the same on the builder, so it carries through `middlewares` too.)
- To name the inferred result type itself, use `VigorResultOf<typeof builder>` — `ReturnType<typeof builder.request>` can't see it, since `R` is a free override.

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

### `vigor.guards`

Each module's error type guard, namespaced the same way (see [typed errors](#typed-errors)):

```ts
vigor.guards.retry(err)   // same as isVigorRetryError(err)
vigor.guards.parse(err)   // isVigorParseError
vigor.guards.fetch(err)   // isVigorFetchError
vigor.guards.all(err)     // isVigorAllError
```

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
| `options(mode, obj)` | Sets extra native `RequestInit` fields other than `method`/`headers`/`body`/`signal` (e.g. `credentials`, `mode`, `cache`). `"merge"` shallow-merges onto the previous options |
| `settings(fn \| config)` | Configures fetch-level settings (below) |
| `middlewares(fn \| config)` | Configures the fetch middleware pipeline (below) |
| `retry(fn \| config \| VigorRetry)` | Configures the **internal retry engine** used to send the request. Replaces the previous engine config; a config object is applied on top of the retry defaults |
| `parse(fn \| config \| VigorParse)` | Configures the **internal parse engine** used to interpret the request or response. Replaces the previous engine config; a config object is applied on top of the parse defaults. Its result type (`.cast<T>()`, `raw`, middlewares, `default`) becomes the request's result type |
| `apiMap<M>()` | Attaches a type-level API map: the matched route's `response` becomes the result type (see [apiMap / route](#apimap--route)) |
| `route(key, params?)` | Sets method and path from an API map route, filling its `:name` segments |
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

`.` and `..` segments still work as relative steps, but by default (`settings.confinePath`) never out of the origin: with `vigor.fetch("https://api.example.com/api/v1")`, `.path("users", "..", "posts")` goes to `/api/v1/posts`, while `.path("users", "../../../internal")` — say, a user-supplied id — fails with `VigorFetchError("PATH_ESCAPED")` without sending anything. The origin's path is the boundary (`/api/v1` allows `/api/v1/...`, not `/api/v1x`). `.settings(s => s.confinePath(false))` turns the check off.

### apiMap / route

Describe your API once as a type, and every request built from it gets its route's response type — no `.cast<T>()` per call:

```ts
type Api = {
  "GET /users":         { response: User[] }
  "POST /users":        { response: User }
  "GET /users/me":      { response: Me }
  "GET /users/:id":     { response: User }
  "DELETE /users/:id":  { response: null }
}

const api = vigor.fetch("https://api.example.com").apiMap<Api>()

await api.path("users").request()                             // User[]
await api.path("users", id).request()                         // User
await api.path("users", "me").request()                       // Me
await api.path("users").body("overwrite", newUser).request()  // User (POST: a body is set)
await api.path("users", id).method("DELETE").request()        // null
await api.path("nope").request()                              // unknown (no route matched)

await api.route("GET /users/:id", { id: 1 }).request()        // User — key autocompletes
```

- Keys are `"<METHOD> /<path>"`. A `:name` segment matches any one segment; a static segment needs that exact literal. When several routes match, the most specific wins segment by segment from the left (`/users/me` beats `/users/:id`), like a router.
- The request's method is the one set with `.method()`, or — as at runtime — `POST` with a body and `GET` without.
- Path arguments are matched the way the URL is built: `.path("users/1")` is two segments, `null`/`undefined` are dropped, numbers become their digits. A non-literal argument (`id: string`) only matches a `:name` segment.
- Routes are relative to the path set before `.apiMap()`, so a shared prefix goes first: `vigor.fetch(origin).path("v1").apiMap<Api>()`. The origin's own pathname isn't part of the match.
- No match falls back to the parse engine's type (`unknown` by default). `.cast<T>()` still wins over the map, and a `raw` parse still gives the `Response`.
- `route(key, params)` sets the method and appends the route's path with `:name` segments filled from `params` (encoded like any path segment). Unknown keys, missing or extra params, and a `GET`/`HEAD` route on a request that already has a body are type errors.
- It's purely a type: `apiMap()` changes nothing at runtime, and responses aren't validated.

#### Route descriptions

A route can describe more than its response. Every key is optional:

```ts
type Api = {
  "GET /users/:id": {
    params:    { id: number }                       // .route()'s param types
    responses: {
      200: User
      304: null
      404: { error: "not_found" }
      "4xx": ApiError                                // every other 4xx
      "5xx": { message: string }
    }
  }
  "POST /users": {
    body:      { name: string }                      // the body the request must carry
    responses: { 201: User, 422: { fields: Record<string, string> } }
  }
  "GET /search": {
    query:     { q: string, page?: number }          // what .query() must add up to
    response:  User[]                                // shorthand for responses: { "2xx": User[] }
  }
}
```

- **`responses`** maps statuses to the parsed body: an exact status (`404`, or `"404"`) or a whole class (`"2xx"`–`"5xx"`) for its statuses not listed on their own. The **success** statuses — `2xx` and `304`, as at runtime — are what the request resolves to: `request()` gives their union (`User | null` above). The others type [`FETCH_FAILED`](#typed-errors)'s `data.parsed`.
- **`response`** is shorthand for `responses: { "2xx": ... }`. Undeclared success statuses aren't modeled, so a route that declares none falls back to the parse engine's type.
- **`params`** types `.route()`'s values: `api.route("GET /users/:id", { id: "1" })` is an error above.
- **`body`** and **`query`** are checked **when the request is sent**, so the order you build it in doesn't matter: `request()`/`requestVerbose()` don't compile when the body doesn't match (or is missing — unless the declared type allows `undefined`), or when the `.query()` objects, added together, miss a key, have an unknown one, or a value of the wrong type. A route without `body`/`query` accepts anything there. The compiler error names the route and the problem:

  ```
  The 'this' context of type 'VigorFetch<...>' is not assignable to method's 'this' of type
  'VigorApiRequestIssue<"GET /search", "unknown query key \"pgae\"", { q: string; page?: number }, { readonly q: "x"; readonly pgae: 1 }>'
  ```

  The check is on `this`, so it's only computed where `request()`/`requestVerbose()` is called. One consequence: calling them on a `VigorFetch<T>` with a still-generic `T` (inside a generic helper) doesn't compile — take a concrete builder, or `VigorFetch<any>`.

#### Status and response

`vigor.fetch`'s `requestVerbose()` envelope carries the `status` and `response` the result was parsed from:

```ts
const res = await api.route("GET /users/:id", { id: 1 }).requestVerbose()
if (res.success) {
  res.status    // 200 | 304
  res.response  // Response
  if (res.status === 200) res.data  // User
  else res.data                     // null
}
```

- With an API map, there's one success member per declared status, each with that status's data run through the middlewares — so narrowing `status` narrows `data`. Without one, `status` is a `number`.
- A result recovered from a failure — by `onError`'s `setResult` or `settings.default` — has no response: `status` and `response` are `null` (those members only exist when one of the two is set). On a failure they're `null` too; the failed response is on the error (`FETCH_FAILED`'s `data`).
- `.cast<T>()` and `requestVerbose<R>()` replace every success's `data`, but keep `status` — and the failure types.

### headers / body / options

```ts
vigor.fetch("/api")
  .headers("merge", { Authorization: "Bearer token" })
  .body("overwrite", { username: "john" })
  .options("merge", { credentials: "include" })
```

Body is auto-normalized based on type (string, `Blob`, `ArrayBuffer`/typed array/`DataView`, `ReadableStream`, `URLSearchParams`, `FormData`, or plain object → JSON), and a matching `Content-Type` header is set automatically unless you've already set one via `.headers()` (header names are compared case-insensitively). `body("overwrite", null)` removes a previously set body. A body on a `GET`/`HEAD` request fails immediately with `VigorFetchError("BODY_NOT_ALLOWED")` instead of being sent — and when the method and body are set through the builder, it's already a type error (`.method("GET").body(...)` or `.body(...).method("GET")`).

> A `ReadableStream` body can only be sent once, so a request with a stream body is never retried (its first failure is final), and a restarted one will fail — use a replayable body type if you rely on retries.

### settings

```ts
.settings(s => s
  .unretryStatus(400, 401, 403, 404, 409, 422)
  .retryHeaders("retry-after", "x-ratelimit-reset")
  .maxRestarts(3)
  .default(ctx => ({ fallback: true }))
)
```

| Method | Description | Default |
|---|---|---|
| `retryHeaders(...strs)` | Response headers checked for a `429`/`503` retry delay | `["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"]` |
| `unretryStatus(...nums)` | HTTP status codes that are never retried, regardless of the retry engine's attempt budget | every `4xx` except `408`, `421`, `423`, `425`, `429`, plus `501`, `505`, `506`, `508`, `510`, `511` (see below) |
| `maxRetryAfter(num)` | Upper bound (ms) on a server-suggested retry delay from `retryHeaders`; longer values are clamped | `300000` (5 min) |
| `redirect(bool)` | On a redirected response, navigates the page via `window.location.href` (see below) | `false` |
| `confinePath(bool)` | Keeps the request URL inside its origin — same domain, within the origin's path; a request that would leave it (e.g. a `".."` segment) fails with `PATH_ESCAPED` before it's sent | `true` |
| `maxRestarts(num)` | Max number of full pipeline restarts (see `onError` below) | `3` |
| `default(fn)` | Fallback value/factory used only if the request ultimately fails and no restart/override happened | throws |
| `debug(bool)` | Records `requestVerbose()`'s [timeline](#timeline) (the nested retry/parse engines' too) | `false` |

The default `unretryStatus` covers the statuses a retry of the same request can't change: `400`–`407`, `409`–`417`, `422`, `424`, `426`, `428`, `431`, `451`, `501`, `505`, `506`, `508`, `510`, `511`. These stay retryable: `408 Request Timeout`, `421 Misdirected Request`, `423 Locked`, `425 Too Early`, `429 Too Many Requests`, and transient `5xx` (`500`, `502`, `503`, `504`, `507`).

`retryHeaders` and `unretryStatus` **replace** the whole list (in both the builder and the config-object form), so you can also remove defaults — e.g. `.settings({ unretryStatus: [] })` makes every failure status retryable. To extend the defaults instead, spread `VigorFetchPolicySettingsBase.unretryStatus`.

On any non-`unretryStatus` failure response, the internal retry engine retries per its own `settings`/`algorithms` (defaults: 5 attempts, 20s timeout, exponential-ish backoff jitter — see `vigor.retry` below). On a `429` or `503`, Vigor reads `retryHeaders` off the response and uses the first usable value as the next delay automatically. Delta seconds (`Retry-After: 120`), Unix epoch seconds/milliseconds (`X-RateLimit-Reset: 1735689600`), and HTTP dates are all understood. The delay is clamped to `maxRetryAfter`.

The whole response body is read within the attempt, so the retry engine's per-attempt `timeout` also covers a body that stalls mid-transfer, and a body that fails to arrive is retried. (With the parse engine's `raw` setting, the body is left unread for you to stream.)

### redirect

With `settings.redirect(true)`, a redirected response navigates the browser to its target:

```ts
await vigor
  .fetch("/api/session")
  .settings({ redirect: true })
  .request();
// 302 Location: /login (followed by fetch)  ->  window.location.href = "https://app.example.com/login"
```

- With the native default `redirect: "follow"`, the target is the final URL `fetch` landed on (`response.redirected`).
- With `.options("merge", { redirect: "manual" })` in a runtime where the `3xx` is readable, the target is its `Location` header, resolved against the responding URL.
- Navigation isn't instant, so the call still settles: it fails with `VigorFetchError("REDIRECTED")`, whose `data` holds `{ url, status, response }`. That attempt is never retried.
- **Without `window.location` (Node, workers, SSR) it does nothing and behaves exactly like `redirect(false)`.**

Independently of this setting, a `3xx` (or browser `opaqueredirect`) that reaches Vigor because you chose `redirect: "manual"` fails with `FETCH_FAILED` and is **not retried**, since a retry would get the same redirect. `304 Not Modified` is treated as a result, not a failure (it parses to `null`).

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

**The returned context replaces `ctx`** — at runtime and in the types. Return values are only checked for being context-shaped; what you change is what carries on:

- Returning `ctx` (sync or `async`) changes nothing, so the types stay those of the finished builder — a middleware registered before `.cast()`, `.apiMap()` or `.target()` doesn't freeze the result at that point.
- Every key you change is overwritten from then on: `({ ...ctx, record: { traceId } })` in `before` types `ctx.record` in every later stage, and `({ ...ctx, result: x })` in `after`/`onResult` makes `x` the result (and what the next `onResult` receives). A fluent `onResult`'s return value — awaited — overwrites `result` the same way.
- Keys the runtime sets itself are reset where it sets them: `result` (and fetch's `response`) at the start of `after`, so changing `result` in `before` has no effect. A `result` changed in `onError` joins the result type as what a recovered request (`setResult`) resolves to.
- Each stage's context is its own: `retryIf`/`onRetry`/`onError` see what their stage's earlier middlewares changed, not `before`'s/`after`'s, since those may not have run.

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

Both accept a config object, a builder callback, or an already-built `VigorRetry`/`VigorParse` instance. The target you'd normally set with `.target()` is ignored here — fetch always supplies its own: the actual `fetch()` call for the retry engine, and the response for the parse engine (a `response.clone()` for the best-effort parse of a failed response's body, see `FETCH_FAILED`).

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
| `debug(bool)` | Records `requestVerbose()`'s [timeline](#timeline) | `false` |

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

Each computed delay is perturbed by `±jitter` ms. For `linear`/`backoff`/`custom`, the jitter fits inside `[minDelay, maxDelay]`: it's capped at half that range, and the delay is clamped to `[minDelay + jitter, maxDelay - jitter]` before jitter is applied, so the final delay never leaves `[minDelay, maxDelay]`. `constant` has no bounds; its interval is only raised to at least `jitter`, so the delay never goes negative.

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
| `after` | After the target settles successfully | `throwError` |
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
| `debug(bool)` | Records `requestVerbose()`'s [timeline](#timeline) | `false` |

### strategies

Strategies form an ordered list that's tried in sequence until one succeeds. If you never configure any, Vigor defaults to content-type detection.

The body is read **once**, into raw bytes, and every strategy parses those same bytes — nothing is cloned, and a failed strategy consumes nothing. Formats are decoded directly from the bytes (`JSON.parse`, `TextDecoder`, a hand-written `x-www-form-urlencoded` parser, ...); only `multipart/form-data` goes through the platform's `formData()`. The bytes are cached per `Request|Response` object, so a restart or a second parse of the same object reuses them.

```ts
.strategies(s => s.sniff())
```

| Method | Behavior |
|---|---|
| `contentType(replace?)` | Parses based on the request|response's `Content-Type` header (JSON / XML / form-urlencoded / octet-stream / image / audio / video / multipart / text). An empty body (e.g. `204 No Content`) resolves to `null`; a body without `Content-Type` is read as text; a `Content-Type` it doesn't know (`application/pdf`, `application/zip`, `application/x-ndjson`, ...) becomes a `Blob` of that type, so a response that arrived fine never fails to parse just for its type |
| `sniff(replace?)` | Tries JSON, then form data (only for a form `Content-Type`), then text (only if the bytes are valid in the declared charset), then falls back to a `Blob` |
| `json(replace?)` | Always parses as JSON (always UTF-8, per the JSON spec) |
| `text(replace?)` | Always parses as text, in the `Content-Type`'s `charset` (UTF-8 when absent or unsupported) |
| `arrayBuffer(replace?)` | Always parses as `ArrayBuffer` |
| `blob(replace?)` | Always parses as `Blob` |
| `bytes(replace?)` | Always parses as `Uint8Array` |
| `formData(replace?)` | Always parses as `FormData` (`x-www-form-urlencoded` or `multipart/form-data`; any other `Content-Type` fails) |
| `custom(func, replace?)` | Uses a custom `(body: VigorParseBody) => any \| Promise<any>` — see below |

A custom strategy receives the already-read body, not the `Request|Response`:

```ts
type VigorParseBody = {
  bytes: Uint8Array            // the raw body, empty when there is none
  contentType: string | null   // the Content-Type header
  status: number | null        // null when parsing a Request
  headers: Headers
  source: Request | Response   // its body is already consumed
}

.strategies(s => s.custom(({ bytes }) => new TextDecoder().decode(bytes).split("\n")))
```

`readVigorParseBody(requestOrResponse)` is exported too, if you need the same read-once bytes outside a strategy.

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

`proceedRestart()` re-parses the same cached bytes, so a restart never hits an already-consumed body.

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
| `onlySuccess(bool)` | When `true`, the result is just the successful tasks' values (a failed task not recovered by `onErrorEach` is left out) instead of one outcome per task | `false` |
| `timeout(ms)` | Per-task timeout. A task exceeding it fails with `VigorAllError("TIMED_OUT")` (recoverable via `onErrorEach`). `0` or `Infinity` disables it | disabled |
| `failFast(bool)` | When `true`, the first task failure not recovered by `onErrorEach` aborts the remaining tasks and makes the batch fail with that error | `false` |
| `debug(bool)` | Records `requestVerbose()`'s [timeline](#timeline) | `false` |

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

> Unlike `vigor.retry`/`vigor.fetch`/`vigor.parse`, `vigor.all` has no `default`/fallback setting and no batch-level `onError`. By default the batch only fails on an **empty** task list (`EMPTY_TARGET`), an external abort, a `failFast` stop, an `onErrorEach` hook throwing, or a batch-level `before`/`after`/`onResult` middleware throwing. Per-task failures are otherwise handled by `onErrorEach` (below).

**Result shape:** with `onlySuccess` off (the default), the result has **one outcome per task**, in order, shaped like `requestVerbose()`'s envelope — `{ success: true, data, error: null }` when the task returned (or `onErrorEach` recovered it), `{ success: false, data: null, error }` when it failed. So a thrown error can never pass for a returned value (and a task that *returns* an `Error` is a success):

```ts
const [user, posts] = await vigor.all(() => getUser(), () => getPosts()).request();
if (user.success) user.data;               // what getUser returned
else if (isVigorAllError(user.error, "TIMED_OUT")) user.error.data.index;
else user.error;                           // whatever getUser threw
```

With `onlySuccess(true)`, it's just the successful tasks' values.

**Result typing:** given literal task functions, the default result is a **tuple** with each task's own type — `.target(() => 1 as const, () => "a")` infers `[VigorAllSettled<1>, VigorAllSettled<"a">]`, and narrowing a slot by `success` narrows `data`. With `onlySuccess(true)` the length is only known at runtime, so it's an array of the tasks' result types (`(1 | "a")[]`); a non-literal `boolean` gives the union of both shapes. `.cast<T>()` overrides either case.

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

## Timeline

Every `requestVerbose()` result carries a `timeline`: an ordered list of everything the call went through, on success and on failure alike. Recording is **off by default** — turn it on with the `debug` setting, `.settings(s => s.debug(true))` or `.settings({ debug: true })` (every module has it). Without it, `timeline` is an empty array and no context snapshots are taken, so it costs nothing. It's created fresh for each call and can't be passed in; a restart keeps appending to the same list.

```ts
const res = await vigor.fetch("https://api.example.com/users").settings(s => s.debug(true)).requestVerbose();

for (const item of res.timeline) {
  console.log(item.now, item.action, item.content);
}
```

Each item is `{ action, content, now, ctx }`. `now` is a `Date.now()` timestamp (a number, not a `Date`). `ctx` is a snapshot of the context at that moment: a deep copy, so later changes don't reach it, without `timeline` itself (`vigor.all`'s per-task actions snapshot that task's context instead). `action` and `content` are typed together, so narrowing by `action` narrows `content`.

The same list is also `ctx.timeline`, so middlewares can read what has happened so far. The types are exported as `VigorRetryTimeline`, `VigorParseTimeline`, `VigorFetchTimeline` and `VigorAllTimeline`.

### Shared events

| Action | Content |
|---|---|
| `PROCESS_HANDLING` | `{ type, data }` — the run's lifecycle steps (below) |
| `MIDDLEWARE_LOOP_STARTED` | `{ stage, middlewares }` |
| `MIDDLEWARE_RAN` | `{ stage, index, middleware, internal, took, threw, error }` — one middleware ran; `error` is what it threw when `threw` is `true` |
| `MIDDLEWARE_LOOP_ENDED` | `{ stage, middlewares, took }` |
| `MIDDLEWARE_API_CALLED` | `{ stage, index, middleware, internal, method, args }` — an intercept API call, e.g. `setDelay` |
| `REQUEST_END` | `{ success, outcome, took, restarts, error }` — always the last entry (see below) |

A stage with no middlewares records nothing. `took` is in milliseconds. `index` is the middleware's position in its stage, and `internal` is `true` for one Vigor added itself — e.g. the `after`/`retryIf`/`onRetry` middlewares `vigor.fetch` puts on its retry engine to judge responses — so you can tell them from yours.

`REQUEST_END` says how the call ended: `outcome` is `"result"` (the pipeline produced it), `"overridden"` (`onError` called `setResult`), `"default"` (`settings.default` produced it), or `"failed"`. `took` spans the whole call, restarts included, and `restarts` counts them; `error` is what it failed with, `null` on success. Nested engines end their own timelines with one too.

### Per module

| Module | `PROCESS_HANDLING` types | Other actions |
|---|---|---|
| `vigor.retry` | `REQUEST_START`, `REQUEST_ERROR`, `REQUEST_RESTART`, `RETRY_START`, `RETRY_ERROR` | `ATTEMPT_INCREASED`, `TARGET_REQUEST_STARTED`, `TARGET_REQUEST_ENDED`, `RETRY_DECISION`, `RETRY_DELAY` |
| `vigor.parse` | `REQUEST_START`, `REQUEST_ERROR`, `REQUEST_RESTART` | `BODY_READ`, `STRATEGY_STARTED`, `STRATEGY_SUCCEEDED`, `STRATEGY_FAILED` |
| `vigor.fetch` | `REQUEST_START`, `REQUEST_ERROR`, `REQUEST_RESTART` | `BUILT_URL`, `SET_OPTIONS`, `ENGINE_CREATED`, `RETRY_STARTED`, `RESPONSE_RECEIVED`, `RETRY_ENDED`, `PARSE_STARTED`, `PARSE_ENDED` |
| `vigor.all` | `REQUEST_START`, `REQUEST_ERROR` | `TASK_STARTED`, `TASK_ENDED`, `TASK_ERROR` |

In `vigor.retry`, `RETRY_START`/`RETRY_ERROR` are per attempt. `RETRY_ERROR`'s data also says whether the attempt `timedOut` (hit `settings.timeout`) or was `aborted` (an external signal fired). After every failed attempt, `RETRY_DECISION` records `{ attempt, retry, reason }`:

| `reason` | `retry` | Meaning |
|---|---|---|
| `"retry"` | `true` | It will be retried (`RETRY_DELAY` follows) |
| `"cancelled"` | `false` | `retryIf` decided against it — `cancelRetry()` or a fluent `false`; the matching `MIDDLEWARE_API_CALLED` shows which middleware (e.g. fetch's internal one for an `unretryStatus`) |
| `"breakRetry"` | `false` | A middleware called `breakRetry()` |
| `"aborted"` | `false` | An external abort signal fired |
| `"exhausted"` | `false` | No attempts left |

The context's flags mirror this: `ctx.flags.brokeRetry` is set only by `breakRetry()`, `ctx.flags.aborted` by an external abort, and `ctx.flags.timedOut` while the current attempt has timed out.

In `vigor.all`, tasks run concurrently, so their entries interleave; each one carries its task's `index`.

### Nested engines in `vigor.fetch`

With `debug` on in the fetch's settings, its retry and parse engines record too. `RETRY_ENDED` and `PARSE_ENDED` hold the nested engine's **whole timeline**, alongside the engine, `took`, and its `response`/`result` (`VigorDefault` when it failed):

```ts
for (const item of res.timeline) {
  if (item.action === "RETRY_ENDED") item.content.timeline; // VigorRetryTimeline
}
```

Every response an attempt gets is recorded as `RESPONSE_RECEIVED` — `{ attempt, status, statusText, ok, redirected, url }` — before it's judged, so a failing status still shows up there. `PARSE_STARTED`/`PARSE_ENDED` also carry a `source` — `"response"` for the result, or `"failedResponse"` for the best-effort parse of a failed response's body — and the `attempt` whose response they parsed. Those run inside the retry engine, so they appear between `RETRY_STARTED` and `RETRY_ENDED`, in order:

```text
RETRY_STARTED
RESPONSE_RECEIVED  attempt=1 status=503
PARSE_STARTED      failedResponse attempt=1
PARSE_ENDED        failedResponse attempt=1
RESPONSE_RECEIVED  attempt=2 status=200
RETRY_ENDED        (the retry engine's own timeline inside)
PARSE_STARTED      response attempt=2
PARSE_ENDED        response attempt=2
REQUEST_END        success outcome="result"
```

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

vigor.use(plugin, options?)   // options: Partial<O>
```

`plugin.func` receives the current `vigor` instance (read-only — plugins never mutate it, e.g. they might read it to wrap an existing method) and returns `Ext`, a set of properties to merge in. `vigor.use()` shallow-clones the instance it's called on (including its nested `builders` groups) and merges `Ext` on top, returning a **new** instance, typed `VigorInstance<Ext>`, while the original stays untouched. Calls chain: `vigor.use(a).use(b)` keeps both plugins' extensions, and `b` receives the instance that already includes `a`'s. A property in `Ext` replaces a same-named one (a built-in like `fetch`, or an earlier plugin's), in the type as well as at runtime.

`plugin.options` holds the plugin's defaults: `func` receives them with the `options` passed to `use()` shallow-merged on top, so `use(plugin)` alone works and `func` always gets a complete `O`.

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
| `vigor.fetch` | `VigorFetchErrors \| {} \| null \| undefined` (the nested engines' failures included, see below) |

`VigorRetryErrors` & co. are unions with **one member per error code**, so narrowing by `code` also narrows `data` to that code's payload. The `{} | null | undefined` tail is everything Vigor didn't create — an error your own target or middleware threw, an abort reason, a network `TypeError`, or even a bare `throw null`. It's there because those really do reach you: a `cancelRetry()`/`breakRetry()`/abort path returns your error as-is, rather than wrapping it.

Narrow with the exported guards — `isVigorRetryError`, `isVigorParseError`, `isVigorFetchError`, `isVigorAllError` (or `vigor.guards.*`):

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

Pass one or more codes to check the code too — the error is narrowed to just those codes, so `data` is that code's payload right away (works on a `catch` binding as well):

```ts
const res = await vigor.fetch("/api/users").requestVerbose();
if (!res.success) {
  if (isVigorFetchError(res.error, "FETCH_FAILED")) {
    res.error.data.status;     // number
    res.error.data.parsed;     // the error body, best-effort parsed
  } else if (isVigorFetchError(res.error, "RETRY_EXHAUSTED", "TIMED_OUT")) {
    res.error.code;            // "RETRY_EXHAUSTED" | "TIMED_OUT"
  }
}

try { await vigor.fetch("/api/users").request() }
catch (e) { if (isVigorFetchError(e, "INVALID_PROTOCOL")) e.data.origin }
```

`error.context` is the run context at the time of the error, and its type depends on the code — some errors are raised where no run exists:

| Module | `context` may be `undefined` | `context` is always `undefined` |
|---|---|---|
| fetch | `VALUE_REQUIRED` (also raised by `.route()` while building) | — |
| retry | `VALUE_REQUIRED` (also raised by the `custom` algorithm) | — |
| parse | `PARSER_ALL_FAILED` (also raised by `VigorParseSniffStrategy`) | `INVALID_CONTENT_TYPE`, `PARSER_NOT_FOUND` (raised inside strategies; the built-in ones no longer raise `PARSER_NOT_FOUND`) |
| all | — | `TIMED_OUT` (per task — see `data.index`) |

Every other code always has one, so after `isVigorFetchError(e, "FETCH_FAILED")`, `e.context.href` needs no check.

On a `requestVerbose()` error, `context` is typed with **that request's own config** — the guards keep it rather than widening to a generic type:

```ts
const res = await vigor.fetch("https://api.example.com").path("users").requestVerbose();
if (!res.success && isVigorFetchError(res.error, "FETCH_FAILED")) {
  res.error.context.policy.origin;  // "https://api.example.com"
  res.error.context.policy.path;    // ["users"]
}
```

A thrown value (`catch (e)` around `request()`) carries no type, so there the guards give the generic `VigorFetchContextSchema<any>` — use `requestVerbose()` when you want the typed context. The context types (`VigorFetchContextSchema` & co.) are exported.

Prefer the guard over a bare `instanceof`: because of the `{}` member, `instanceof` widens `data` back to every code's payload, while the guard keeps `code` and `data` in sync. And since the tail has no `code`, reading `res.error.code` without narrowing is a compile error — that's the point.

All four modules are typed this way. `request()` throws instead of returning an envelope, so its thrown value stays `unknown` — narrow it with the same guards.

Or avoid try/catch entirely with `requestVerbose()`:

```ts
const res = await vigor.fetch("/api/users").requestVerbose();
if (!res.success) {
  // res.error is typed, res.data is null
}
// res.timeline is there either way
```

| Module | Error codes |
|---|---|
| `VigorFetchError` | `VALUE_REQUIRED`, `INVALID_BODY`, `BODY_NOT_ALLOWED`, `INVALID_PROTOCOL`, `PATH_ESCAPED`, `FETCH_FAILED`, `RESTART_EXHAUSTED`, `REDIRECTED`, plus every `VigorRetryError` and `VigorParseError` code |
| `VigorRetryError` | `VALUE_REQUIRED`, `RETRY_EXHAUSTED`, `RESTART_EXHAUSTED`, `TIMED_OUT` |
| `VigorParseError` | `VALUE_REQUIRED`, `INVALID_CONTENT_TYPE`, `PARSER_NOT_FOUND`, `PARSER_ALL_FAILED`, `RESTART_EXHAUSTED` |
| `VigorAllError` | `EMPTY_TARGET`, `TIMED_OUT` |

`vigor.fetch` only ever fails with `VigorFetchError` (or something you threw): when its nested retry or parse engine fails, the error is re-raised as a `VigorFetchError` with the same `code` and `data`, the original kept as `cause`. So a request that ran out of attempts fails with `VigorFetchError("RETRY_EXHAUSTED")` — its `data.error` holding the last attempt's error, e.g. a `FETCH_FAILED` or a `TIMED_OUT` — and a body no strategy could parse with e.g. `VigorFetchError("PARSER_NOT_FOUND")`. `onError` and `settings.default` see the same error.

`FETCH_FAILED`'s `data` includes `parsed`: Vigor best-effort parses the failed response's body (using your configured parse strategies) before throwing, so you can inspect an API's error payload without re-fetching. If parsing that body also fails, `parsed` is simply `undefined`.

With an [API map](#route-descriptions) route that declares failure `responses`, `FETCH_FAILED`'s `data` has one member per status, so narrowing `data.status` narrows `data.parsed` — to the declared body `| undefined`, or `unknown` for a status the route doesn't cover. `RETRY_EXHAUSTED`/`RESTART_EXHAUSTED`'s `data.error` is typed as the same request's errors, so the last attempt's failure stays typed one level down:

```ts
const res = await api.route("POST /users").body("overwrite", { name: "a" }).requestVerbose()
if (!res.success) {
  const err = isVigorFetchError(res.error, "RETRY_EXHAUSTED") ? res.error.data.error : res.error
  if (isVigorFetchError(err, "FETCH_FAILED") && err.data.status === 422) {
    err.data.parsed  // { fields: Record<string, string> } | undefined
  }
}
```

`.cast<T>()` only replaces the success type — the failure types stay. A `raw` parse makes `parsed` the `Response`, so it keeps the plain `{ status: number, ..., parsed: unknown }` shape.

`PARSER_ALL_FAILED` keeps why each strategy failed: `data.tried[i]` names a strategy and `data.errors[i]` is what it threw, the message lists them (`All parsers failed: strategy#0 (SyntaxError: ...)`), and `cause` is the last one — so a malformed JSON body still carries its `SyntaxError`, with or without `settings.debug`.

---

## TypeScript notes

- Every builder is **immutable** — `.settings(...)`, `.path(...)`, etc. all return a *new* instance with the change merged in; the original is untouched.
- Array-valued config (`path`, `query`, parse `strategies`, etc.) **concatenates** across calls by default; object-valued config deep-merges. A handful of methods (`hash`, `headers("overwrite", ...)`, `body("overwrite", ...)`, `options("overwrite", ...)`, `retry(...)`, `parse(...)`, `algorithms(...)`, fetch's `retryHeaders`/`unretryStatus`) force a full **replace** instead, since merging wouldn't make sense there. The config's type follows the same rules, so it always matches what's stored at runtime.
- Config objects are checked for unknown keys at any depth: `.settings({ maxAttempts: 3, timeot: 5 })` is a type error.
- To store or pass around a configured builder, type it with `any`: `VigorRetry<any>`, `VigorFetch<any>`, etc. The bare `VigorRetry` is the unconfigured instance's type.
- To narrow `requestVerbose()`'s `error`, use the `isVigor*Error` guards (or `vigor.guards.*`): they narrow `code` and `data` together. The sentinels `VigorDefault`/`VigorEmpty` (and `isVigorDefault`/`isVigorEmpty`) are exported for checking an unset `ctx.result` in middlewares.
- Config shape is tracked through the whole chain via TypeScript generics, so `.settings()`/`.middlewares()` callbacks and `.request()`'s inferred return type stay accurate as you chain.
- `.cast<T>()` is available on every module (`fetch`, `retry`, `parse`, `all`) and always wins over the naturally-inferred type, regardless of where in the chain it's called.