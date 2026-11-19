/**
 * Type tests for how an API map's types flow through the pipeline.
 *
 * The map describes the raw response body — what the parse strategies
 * produce. Everything that runs after that at runtime applies on top of it,
 * in order:
 *
 *   map data (per status)
 *     → parse engine: after / onResult middlewares, | its default, | its onError recovery
 *     → fetch: .cast<T>() replaces it, then after / onResult middlewares, | default, | onError recovery
 *
 * A failed response's `parsed` goes through the same parse engine at runtime,
 * so its type is the map's failure data through the parse engine's pipeline.
 * Run with `npm run test:types`.
 */
import vigor, { isVigorFetchError } from "../src/index"

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
type Expect<T extends true> = T

type User = { id: number, name: string }
type Api = {
    "/users": { GET: { response: User[] } }
    "/users/:id": {
        GET: { responses: { 200: User, 202: { queued: true }, 404: { error: "not_found" } } }
    }
}

const api = vigor.fetch("https://api.example.com").apiMap<Api>()
const users = api.path("append", "users")
const user = api.route("GET /users/:id", { id: 1 })

// ============================================================================
// fetch-level middlewares see the map data and transform it
// ============================================================================

users.middlewares(m => m.after("intercept", ctx => {
    const check: Expect<Equal<typeof ctx.result, User[]>> = true
    return ctx
}))
users.middlewares(m => m.onResult("fluent", r => {
    const check: Expect<Equal<typeof r, User[]>> = true
    return r
}))
const f1 = await users.middlewares(m => m.onResult("fluent", r => r.map(u => u.name))).request()
export type F1 = Expect<Equal<typeof f1, string[]>>
// Chained onResult steps compose.
const f2 = await users
    .middlewares(m => m.onResult("fluent", r => r.length).onResult("fluent", n => n > 0))
    .request()
export type F2 = Expect<Equal<typeof f2, boolean>>
// Middlewares registered before .apiMap() / the path see the map too, since types are computed on the finished builder.
const f3 = await vigor.fetch("https://api.example.com")
    .middlewares(m => m.after("intercept", ctx => ctx))
    .apiMap<Api>()
    .path("append", "users")
    .request()
export type F3 = Expect<Equal<typeof f3, User[]>>

// default / onError recovery join the result.
const f4 = await users.settings({ default: () => "fb" as const }).request()
export type F4 = Expect<Equal<typeof f4, User[] | "fb">>
const f5 = await users.middlewares(m => m.onResult("fluent", r => r.length)).settings({ default: () => null }).request()
export type F5 = Expect<Equal<typeof f5, number | null>>

// Fetch-level cast replaces the map data before fetch middlewares.
const f6 = await users.cast<"c">().middlewares(m => m.onResult("fluent", r => {
    const check: Expect<Equal<typeof r, "c">> = true
    return [r] as const
})).request()
export type F6 = Expect<Equal<typeof f6, readonly ["c"]>>

// ============================================================================
// requestVerbose: each status's data is followed through the pipeline
// ============================================================================

export async function perStatus() {
    // Without a transforming step, `status` narrows `data`.
    const plain = await user.middlewares(m => m.after("intercept", ctx => ctx)).requestVerbose()
    if (plain.success && plain.status === 200) {
        const data: Expect<Equal<typeof plain.data, User>> = true
    }
    if (plain.success && plain.status === 202) {
        const data: Expect<Equal<typeof plain.data, { queued: true }>> = true
    }
    // A fluent callback's return type is inferred once, from every status's
    // data together: TypeScript can't re-run it per status, so the
    // correlation is lost after it (a known limitation).
    const v = await user.middlewares(m => m.onResult("fluent", r => ({ wrapped: r }))).requestVerbose()
    if (v.success && v.status === 200) {
        const data: Expect<Equal<typeof v.data, { wrapped: User | { queued: true } }>> = true
    }
    const d = await user.settings({ default: () => 0 as const }).requestVerbose()
    if (d.success && d.status === null) {
        // Recovered: no response, the default's type.
        const data: Expect<Equal<typeof d.data, 0>> = true
    }
}

// ============================================================================
// parse engine middlewares run on the map data too
// ============================================================================

// An `intercept` parse middleware that returns ctx changes nothing.
const p1 = await users.parse(p => p.middlewares(m => m.onResult("intercept", ctx => ctx))).request()
export type P1 = Expect<Equal<typeof p1, User[]>>

// A `fluent` parse onResult replaces the result with its return type, as it does at runtime.
const p2 = await users.parse(p => p.middlewares(m => m.onResult("fluent", r => ({ wrapped: r })))).request()
export type P2 = Expect<Equal<typeof p2, { wrapped: unknown }>>
const p3 = await users.parse(p => p.middlewares(m => m.onResult("fluent", () => "parsed" as const))).request()
export type P3 = Expect<Equal<typeof p3, "parsed">>

// The parse engine's callbacks are typed when `.parse()` is called, before the map is known: `r` is `unknown`.
users.parse(p => p.middlewares(m => m.onResult("fluent", r => {
    const check: Expect<Equal<typeof r, unknown>> = true
    return r
})))
// ...so returning it unchanged gives `unknown`; an `intercept` returning ctx keeps the map's type (P1).
const p2b = await users.parse(p => p.middlewares(m => m.onResult("fluent", r => r))).request()
export type P2b = Expect<Equal<typeof p2b, unknown>>

// The parse engine's default joins the map data.
const p4 = await users.parse(p => p.settings({ default: () => "parse-fb" as const })).request()
export type P4 = Expect<Equal<typeof p4, User[] | "parse-fb">>

// An onError recovery adds what its context's `result` is typed as. `setResult`'s
// value itself isn't tracked (as with every engine's `setResult`), so here it stays the map's.
const p4b = await users.parse(p => p.middlewares(m => m.onError("intercept", (ctx, api) => {
    api.setResult("recovered")
    return ctx
}))).request()
export type P4b = Expect<Equal<typeof p4b, User[]>>
// Without the map's route, nothing changes: the parse engine's own type.
const p4c = await api.path("append", "nope").parse(p => p.settings({ default: () => "parse-fb" as const })).request()
export type P4c = Expect<Equal<typeof p4c, unknown>>
const p4d = await api.path("append", "nope").parse(p => p.cast<"inner">().middlewares(m => m.onResult("fluent", r => [r] as const))).request()
export type P4d = Expect<Equal<typeof p4d, readonly ["inner"]>>

// Parse layer first, then fetch layer.
const p5 = await users
    .parse(p => p.middlewares(m => m.onResult("fluent", () => 1 as const)))
    .middlewares(m => m.onResult("fluent", r => {
        const check: Expect<Equal<typeof r, 1>> = true
        return [r] as const
    }))
    .request()
export type P5 = Expect<Equal<typeof p5, readonly [1]>>

// A fetch-level cast still replaces everything the parse engine produced.
const p6 = await users.parse(p => p.middlewares(m => m.onResult("fluent", () => 1 as const))).cast<"c">().request()
export type P6 = Expect<Equal<typeof p6, "c">>

// A raw parse ignores the map: the Response, through the parse middlewares.
const p7 = await users.parse(p => p.settings({ raw: true })).request()
export type P7 = Expect<Equal<typeof p7, Response>>

// ============================================================================
// failures: `parsed` is the map's failure data through the parse engine
// ============================================================================

export async function failures() {
    const v = await user.requestVerbose()
    if (!v.success && isVigorFetchError(v.error, "FETCH_FAILED") && v.error.data.status === 404) {
        const parsed: Expect<Equal<typeof v.error.data.parsed, { error: "not_found" } | undefined>> = true
    }
    // Fetch-level middlewares don't touch a failed response's `parsed`.
    const fm = await user.middlewares(m => m.onResult("fluent", () => 1 as const)).requestVerbose()
    if (!fm.success && isVigorFetchError(fm.error, "FETCH_FAILED") && fm.error.data.status === 404) {
        const parsed: Expect<Equal<typeof fm.error.data.parsed, { error: "not_found" } | undefined>> = true
    }
    // The parse engine does run on it.
    const pm = await user.parse(p => p.middlewares(m => m.onResult("fluent", () => "p" as const))).requestVerbose()
    if (!pm.success && isVigorFetchError(pm.error, "FETCH_FAILED") && pm.error.data.status === 404) {
        const parsed: Expect<Equal<typeof pm.error.data.parsed, "p" | undefined>> = true
    }
}

// ============================================================================
// recovery: only what can recover adds a `status: null` success
// ============================================================================

export async function recovery() {
    // A fluent onError only observes: every success has a response.
    const fluent = await user.middlewares(m => m.onError("fluent", e => { void e })).requestVerbose()
    if (fluent.success) {
        const status: Expect<Equal<typeof fluent.status, 200 | 202>> = true
    }
    // ...on the parse engine too.
    const parseFluent = await user.parse(p => p.middlewares(m => m.onError("fluent", e => { void e }))).requestVerbose()
    if (parseFluent.success) {
        const status: Expect<Equal<typeof parseFluent.status, 200 | 202>> = true
    }
    // An intercept onError can `setResult`: a recovered success has no response.
    const intercept = await user.middlewares(m => m.onError("intercept", ctx => ctx)).requestVerbose()
    if (intercept.success) {
        const status: Expect<Equal<typeof intercept.status, 200 | 202 | null>> = true
    }
    // A fluent one next to an intercept one still counts the intercept one.
    const mixed = await user.middlewares(m => m.onError("fluent", e => { void e }).onError("intercept", ctx => ctx)).requestVerbose()
    if (mixed.success) {
        const status: Expect<Equal<typeof mixed.status, 200 | 202 | null>> = true
    }
    // `default` recovers too.
    const withDefault = await user.middlewares(m => m.onError("fluent", e => { void e })).settings({ default: () => 0 as const }).requestVerbose()
    if (withDefault.success) {
        const status: Expect<Equal<typeof withDefault.status, 200 | 202 | null>> = true
    }
    // request() isn't affected either way.
    const plain = await user.middlewares(m => m.onError("fluent", e => { void e })).request()
    const result: Expect<Equal<typeof plain, User | { queued: true }>> = true
}

// ============================================================================
// fluent onError: a returned value recovers with it, `undefined` doesn't
// ============================================================================

export async function fluentRecovery() {
    // Returning a value: it joins the result, and a recovered success has no status.
    const v = await user.middlewares(m => m.onError("fluent", () => "offline" as const)).requestVerbose()
    if (v.success) {
        const status: Expect<Equal<typeof v.status, 200 | 202 | null>> = true
        if (v.status === null) {
            const data: Expect<Equal<typeof v.data, "offline">> = true
        }
        if (v.status === 200) {
            const data: Expect<Equal<typeof v.data, User>> = true
        }
    }
    // Sometimes returning `undefined`: only the value joins.
    const maybe = await user.middlewares(m => m.onError("fluent", (e) => e instanceof TypeError ? null : undefined)).request()
    const t1: Expect<Equal<typeof maybe, User | { queued: true } | null>> = true
    // Async.
    const later = await user.middlewares(m => m.onError("fluent", async () => 0 as const)).request()
    const t2: Expect<Equal<typeof later, User | { queued: true } | 0>> = true
    // Several: their union.
    const both = await user.middlewares(m => m.onError("fluent", () => 1 as const).onError("fluent", () => 2 as const)).request()
    const t3: Expect<Equal<typeof both, User | { queued: true } | 1 | 2>> = true
    // The parse engine's fluent onError recovers the parse.
    const parsed = await users.parse(p => p.middlewares(m => m.onError("fluent", () => "parse-fb" as const))).request()
    const t4: Expect<Equal<typeof parsed, User[] | "parse-fb">> = true
}

// The other engines.
const retryRecovered = await vigor.retry(async () => 1 as const).middlewares(m => m.onError("fluent", () => "fb" as const)).request()
export type RetryRecovered = Expect<Equal<typeof retryRecovered, 1 | "fb">>
const retryObserved = await vigor.retry(async () => 1 as const).middlewares(m => m.onError("fluent", e => { void e })).request()
export type RetryObserved = Expect<Equal<typeof retryObserved, 1>>
const parseRecovered = await vigor.parse(new Response()).cast<"ok">().middlewares(m => m.onError("fluent", () => null)).request()
export type ParseRecovered = Expect<Equal<typeof parseRecovered, "ok" | null>>
