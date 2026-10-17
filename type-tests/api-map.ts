/**
 * Type tests for `.apiMap<M>()` and `.route()`. Run with `npm run test:types`.
 */
import vigor, { isVigorFetchError } from "../src/index"

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
type Expect<T extends true> = T

type User = { id: number, name: string }
type Api = {
    "GET /": { response: "root" }
    "GET /users": { response: User[] }
    "POST /users": { response: User, body: { name: string } }
    "GET /users/me": { response: "me" }
    "GET /users/:id": { response: User }
    "DELETE /users/:id": { response: null }
    "GET /users/:id/posts/:postId": { response: { postId: string } }
    "GET /files/:name/raw": { response: Blob }
    "GET /files/latest/:name": { response: "latest" }
    "PUT /noresponse": {}
}

declare const id: string
declare const num: number
declare const kind: "users" | "nope"

const api = vigor.fetch("https://api.example.com").apiMap<Api>()

// ============================================================================
// .path() matching
// ============================================================================

const m1 = await api.request()
export type M1 = Expect<Equal<typeof m1, "root">>
const m2 = await api.path("users").request()
export type M2 = Expect<Equal<typeof m2, User[]>>
// A parameter matches a literal or a non-literal segment.
const m3 = await api.path("users", id).request()
export type M3 = Expect<Equal<typeof m3, User>>
const m4 = await api.path("users", 1).request()
export type M4 = Expect<Equal<typeof m4, User>>
const m5 = await api.path("users", num).request()
export type M5 = Expect<Equal<typeof m5, User>>
// A static segment beats a parameter, like a router.
const m6 = await api.path("users", "me").request()
export type M6 = Expect<Equal<typeof m6, "me">>
// ...but a non-literal segment only matches parameters.
const m7 = await api.path("users").path(id).request()
export type M7 = Expect<Equal<typeof m7, User>>
// `/` inside an argument separates segments, as at runtime; empty ones are dropped.
const m8 = await api.path("users/1/posts", "p").request()
export type M8 = Expect<Equal<typeof m8, { postId: string }>>
const m9 = await api.path("/users/", "/me/").request()
export type M9 = Expect<Equal<typeof m9, "me">>
// `null`/`undefined` arguments are dropped, as at runtime.
const m10 = await api.path("users", null, undefined).request()
export type M10 = Expect<Equal<typeof m10, User[]>>
// Leftmost static segment wins: `/files/latest/:name` over `/files/:name/raw`.
const m11 = await api.path("files", "latest", "raw").request()
export type M11 = Expect<Equal<typeof m11, "latest">>
const m12 = await api.path("files", "a", "raw").request()
export type M12 = Expect<Equal<typeof m12, Blob>>
// A union segment gives the union of what each alternative resolves to.
const m13 = await api.path(kind).request()
export type M13 = Expect<Equal<typeof m13, User[] | unknown>>
// A route without `response` resolves to `unknown`.
const m14 = await api.path("noresponse").method("PUT").request()
export type M14 = Expect<Equal<typeof m14, unknown>>

// ============================================================================
// method
// ============================================================================

// Without `.method()`: POST with a body, GET without — like at runtime.
const k1 = await api.path("users").body("overwrite", { name: "a" }).request()
export type K1 = Expect<Equal<typeof k1, User>>
const k2 = await api.path("users", 1).method("DELETE").request()
export type K2 = Expect<Equal<typeof k2, null>>
const k3 = await api.method("DELETE").path("users", 1).request()
export type K3 = Expect<Equal<typeof k3, null>>
const k4 = await api.path("users").body("overwrite", { name: "a" }).body("overwrite", null).request()
export type K4 = Expect<Equal<typeof k4, User[]>>

// ============================================================================
// no match / overrides
// ============================================================================

// No matching route: falls back to the parse engine's type (`unknown` by default).
const n1 = await api.path("nope").request()
export type N1 = Expect<Equal<typeof n1, unknown>>
const n2 = await api.path("users", 1, "extra").request()
export type N2 = Expect<Equal<typeof n2, unknown>>
const n3 = await api.path("users").method("PATCH").request()
export type N3 = Expect<Equal<typeof n3, unknown>>
const n4 = await api.path("nope").parse(p => p.cast<{ fallback: true }>()).request()
export type N4 = Expect<Equal<typeof n4, { fallback: true }>>
// A path list of unknown length can't be matched.
declare const segs: string[]
const n5 = await api.path(...segs).request()
export type N5 = Expect<Equal<typeof n5, unknown>>

// `.cast<T>()` wins over the map, and a raw parse gives the Response.
const o1 = await api.path("users").cast<"cast">().request()
export type O1 = Expect<Equal<typeof o1, "cast">>
const o2 = await api.path("users").parse(p => p.settings({ raw: true })).request()
export type O2 = Expect<Equal<typeof o2, Response>>
// The map's response flows through the middlewares and joins `default`.
const o3 = await api.path("users")
    .middlewares(m => m.onResult("fluent", users => users.length))
    .request()
export type O3 = Expect<Equal<typeof o3, number>>
const o4 = await api.path("users", 1).settings({ default: () => null }).request()
export type O4 = Expect<Equal<typeof o4, User | null>>
// A later `.apiMap()` replaces the earlier one.
const o5 = await api.apiMap<{ "GET /users": { response: "other" } }>().path("users").request()
export type O5 = Expect<Equal<typeof o5, "other">>

// ============================================================================
// base path: routes are relative to the path set before `.apiMap()`
// ============================================================================

const v1 = vigor.fetch("https://api.example.com").path("v1").apiMap<Api>()
const b1 = await v1.path("users", 1).request()
export type B1 = Expect<Equal<typeof b1, User>>
const b2 = await vigor.fetch("https://api.example.com").path("api/v2").apiMap<Api>().path("users").request()
export type B2 = Expect<Equal<typeof b2, User[]>>

// ============================================================================
// .route()
// ============================================================================

const r1 = await api.route("GET /users").request()
export type R1 = Expect<Equal<typeof r1, User[]>>
const r2 = await api.route("GET /users/:id", { id: 1 }).request()
export type R2 = Expect<Equal<typeof r2, User>>
const r3 = await api.route("GET /users/:id/posts/:postId", { id, postId: "p" }).request()
export type R3 = Expect<Equal<typeof r3, { postId: string }>>
const r4 = await api.route("DELETE /users/:id", { id: 1 }).request()
export type R4 = Expect<Equal<typeof r4, null>>
const r5 = await v1.route("GET /users/:id", { id: 1 }).request()
export type R5 = Expect<Equal<typeof r5, User>>
const r6 = vigor.fetch("https://x").path("v1").apiMap<Api>().route("GET /users/:id", { id: 7 })
export type R6 = Expect<Equal<typeof r6.config.policy.path, ["v1", "users", "7"]>>
export type R7 = Expect<Equal<typeof r6.config.policy.method, "GET">>

// A literal param resolves like the path it produces: "me" hits the static route.
const r8 = await api.route("GET /users/:id", { id: "me" }).request()
export type R8 = Expect<Equal<typeof r8, "me">>

// @ts-expect-error  extra param
api.route("GET /users/:id", { id: 1, extra: 2 })
// @ts-expect-error  unknown route
api.route("GET /nope")
// @ts-expect-error  missing params
api.route("GET /users/:id")
// @ts-expect-error  wrong param name
api.route("GET /users/:id", { userId: 1 })
// @ts-expect-error  params for a route without any
api.route("GET /users", { id: 1 })
// @ts-expect-error  no API map
vigor.fetch("https://x").route("GET /users")
// @ts-expect-error  a GET route can't carry the body already set
api.body("overwrite", { name: "a" }).route("GET /users")
api.body("overwrite", { name: "a" }).route("POST /users")

// ============================================================================
// map validation
// ============================================================================

// @ts-expect-error  keys must be "<METHOD> /<path>"
vigor.fetch("https://x").apiMap<{ "users": { response: 1 } }>()
// @ts-expect-error
vigor.fetch("https://x").apiMap<{ "FETCH /users": { response: 1 } }>()
// @ts-expect-error  routes must be objects
vigor.fetch("https://x").apiMap<{ "GET /users": 1 }>()

// ============================================================================
// responses per status
// ============================================================================

type Item = { id: number, name: string }
type Api2 = {
    "GET /items/:id": {
        params: { id: number }
        responses: { 200: Item, 304: null, 404: { error: "not_found" }, "4xx": { error: string }, "5xx": { message: string } }
    }
    "POST /items": { body: { name: string, tags?: string[] }, responses: { 201: Item, "422": { fields: Record<string, string> } } }
    "PUT /items/:id": { body?: { name: string }, response: Item }
    "GET /search": { query: { q: string, page?: number }, response: Item[] }
    "GET /mixed": { responses: { 200: "ok", "2xx": "other" } }
    "GET /errors-only": { responses: { 404: "missing" } }
}
const api2 = vigor.fetch("https://api.example.com").apiMap<Api2>()

// `request()` resolves to the union of the success statuses' bodies.
const s1 = await api2.route("GET /items/:id", { id: 1 }).request()
export type S1 = Expect<Equal<typeof s1, Item | null>>
// `response` is shorthand for `"2xx"`; an exact status beats its class.
const s2 = await api2.path("mixed").request()
export type S2 = Expect<Equal<typeof s2, "ok" | "other">>
// A route with no success statuses falls back to the parse engine's type.
const s3 = await api2.path("errors-only").request()
export type S3 = Expect<Equal<typeof s3, unknown>>

// `requestVerbose()`: narrowing `status` narrows `data`.
export async function verboseStatus() {
    const v = await api2.route("GET /items/:id", { id: 1 }).requestVerbose()
    if (!v.success) {
        const nulls: Expect<Equal<[typeof v.status, typeof v.response], [null, null]>> = true
        return
    }
    const statuses: Expect<Equal<typeof v.status, 200 | 304>> = true
    const response: Expect<Equal<typeof v.response, Response>> = true
    if (v.status === 200) {
        const data: Expect<Equal<typeof v.data, Item>> = true
    } else {
        const data: Expect<Equal<typeof v.data, null>> = true
    }

    const m = await api2.path("mixed").requestVerbose()
    if (m.success && m.status === 201) {
        const data: Expect<Equal<typeof m.data, "other">> = true
    }
    if (m.success && m.status === 200) {
        const data: Expect<Equal<typeof m.data, "ok">> = true
    }

    // Each status's data goes through the middlewares.
    const t = await api2.route("GET /items/:id", { id: 1 })
        .middlewares(mw => mw.onResult("fluent", item => item === null ? "cached" as const : item.name))
        .requestVerbose()
    if (t.success) {
        const data: Expect<Equal<typeof t.data, "cached" | string>> = true
    }

    // An explicit type argument types every success's `data`, keeping `status`.
    const x = await api2.route("GET /items/:id", { id: 1 }).requestVerbose<"x">()
    if (x.success) {
        const data: Expect<Equal<typeof x.data, "x">> = true
        const status: Expect<Equal<typeof x.status, 200 | 304>> = true
    }

    // Without a map, `status` is a plain number.
    const plain = await vigor.fetch("https://x").requestVerbose()
    if (plain.success) {
        const status: Expect<Equal<typeof plain.status, number>> = true
    }
}

// A recovered success (`settings.default`, `onError`'s `setResult`) has no response.
export async function recovered() {
    const d = await api2.route("GET /items/:id", { id: 1 }).settings({ default: () => "fallback" as const }).requestVerbose()
    if (d.success && d.status === null) {
        const data: Expect<Equal<typeof d.data, "fallback">> = true
        const response: Expect<Equal<typeof d.response, null>> = true
    }
    // Neither set: a success always has a response.
    const n = await api2.route("GET /items/:id", { id: 1 }).requestVerbose()
    type NoRecovered = Extract<typeof n, { success: true, status: null }>
    const none: Expect<Equal<NoRecovered, never>> = true
}

// ============================================================================
// FETCH_FAILED per status
// ============================================================================

export async function failedStatus() {
    const f = await api2.route("GET /items/:id", { id: 1 }).requestVerbose()
    if (f.success || !isVigorFetchError(f.error, "FETCH_FAILED")) return
    const data = f.error.data
    if (data.status === 404) {
        const parsed: Expect<Equal<typeof data.parsed, { error: "not_found" } | undefined>> = true
    } else if (data.status === 400 || data.status === 499) {
        const parsed: Expect<Equal<typeof data.parsed, { error: string } | undefined>> = true
    } else if (data.status === 503) {
        const parsed: Expect<Equal<typeof data.parsed, { message: string } | undefined>> = true
    } else if (data.status === 302) {
        // Not declared: `parsed` is unknown.
        const parsed: Expect<Equal<typeof data.parsed, unknown>> = true
    }
    // The success statuses aren't failures.
    const no200: Expect<Equal<Extract<typeof data.status, 200 | 304>, never>> = true
    const response: Response = data.response
}

// A retried-out request keeps the typed failure on `data.error`.
export async function failedThroughRetry() {
    const f = await api2.route("POST /items").body("overwrite", { name: "a" }).requestVerbose()
    if (f.success || !isVigorFetchError(f.error, "RETRY_EXHAUSTED")) return
    const last = f.error.data.error
    if (isVigorFetchError(last, "FETCH_FAILED") && last.data.status === 422) {
        const parsed: Expect<Equal<typeof last.data.parsed, { fields: Record<string, string> } | undefined>> = true
    }
}

// `.cast<T>()` only replaces the success type; the failures stay typed.
export async function castKeepsFailures() {
    const c = await api2.route("GET /items/:id", { id: 1 }).cast<"cast">().requestVerbose()
    if (c.success) {
        const data: Expect<Equal<typeof c.data, "cast">> = true
    } else if (isVigorFetchError(c.error, "FETCH_FAILED") && c.error.data.status === 404) {
        const parsed: Expect<Equal<typeof c.error.data.parsed, { error: "not_found" } | undefined>> = true
    }
}

// A raw parse's `parsed` is a `Response`, so failures keep the plain shape.
export async function rawFailures() {
    const r = await api2.route("GET /items/:id", { id: 1 }).parse(p => p.settings({ raw: true })).requestVerbose()
    if (!r.success && isVigorFetchError(r.error, "FETCH_FAILED")) {
        const data: Expect<Equal<typeof r.error.data, { status: number, statusText: string, response: Response, url: string, parsed: unknown }>> = true
    }
}

// ============================================================================
// params / body / query checks
// ============================================================================

// Declared params type `.route()`'s values.
api2.route("GET /items/:id", { id: 1 })
// @ts-expect-error  `id` is declared as a number
api2.route("GET /items/:id", { id: "1" })

// body: checked when the request is sent, whatever order it was built in.
await api2.route("POST /items").body("overwrite", { name: "a" }).request()
await api2.body("overwrite", { name: "a", tags: ["x", "y"] }).route("POST /items").request()
await api2.route("POST /items").body("overwrite", { name: "a" }).body("merge", { tags: [] }).requestVerbose()
// @ts-expect-error  wrong body
await api2.route("POST /items").body("overwrite", { nmae: "a" }).request()
// @ts-expect-error  wrong body, via requestVerbose too
await api2.route("POST /items").body("overwrite", { name: 1 }).requestVerbose()
// @ts-expect-error  the route requires a body
await api2.route("POST /items").request()
// An optional body may be left out.
await api2.route("PUT /items/:id", { id: 1 }).request()
await api2.route("PUT /items/:id", { id: 1 }).body("overwrite", { name: "b" }).request()

// query: every `.query()` object adds up.
await api2.route("GET /search").query({ q: "x" }).request()
await api2.route("GET /search").query({ q: "x" }).query({ page: 2 }).request()
// @ts-expect-error  missing `q`
await api2.route("GET /search").query({ page: 2 }).request()
// @ts-expect-error  unknown key
await api2.route("GET /search").query({ q: "x", pgae: 2 }).request()
// @ts-expect-error  wrong value type
await api2.route("GET /search").query({ q: "x", page: "2" }).request()

// Routes without `body`/`query`, and requests without a map, aren't checked.
await api2.path("mixed").query({ anything: 1 }).request()
await vigor.fetch("https://x").body("overwrite", { any: 1 }).request()

// ============================================================================
// responses validation
// ============================================================================

// @ts-expect-error  `responses` keys must be statuses or status classes
vigor.fetch("https://x").apiMap<{ "GET /a": { responses: { ok: 1 } } }>()
vigor.fetch("https://x").apiMap<{ "GET /a": { responses: { 200: 1, "404": 2, "5xx": 3 } } }>()
