/**
 * Type tests for the explicit modes (`path`/`query`: "append" | "replace",
 * `headers`/`body`/`options`: "merge" | "replace"), the `serializers`
 * pipeline and `settings.fetcher`. Run with `npm run test:types`.
 */
import vigor, {
    isVigorFetchError,
    VigorBodySteps,
    VigorFetchPolicySerializers,
    VigorFetchSerializersBase,
    VigorFetchSerializersSchema,
    VigorFetchSerializerStage,
    VigorFetcher,
    VigorHeadersSteps,
    VigorPathSteps,
    VigorQueryEntry,
    VigorQuerySteps,
    VigorSerializedBody,
    VigorSerializeInfo,
    VigorSerializerStep,
    VigorUrlSteps,
    vigorStringifyValue,
} from "../src/index"

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
type Expect<T extends true> = T

declare const str: string
declare const num: number
declare const maybe: string | null
declare const date: Date

const base = vigor.fetch("https://x")
type Base = typeof base

// ============================================================================
// path: "append" | "replace"
// ============================================================================

// Values are stored as given, in order, across calls.
const p1 = base.path("append", "a", 1, true).path("append", "b")
export type P1 = Expect<Equal<typeof p1.config.policy.path, ["a", 1, true, "b"]>>
// null/undefined/Date are kept in the stored list: dropping and stringifying are serializer steps.
const p2 = base.path("append", "a", null, undefined, date)
export type P2 = Expect<Equal<typeof p2.config.policy.path, ["a", null, undefined, Date]>>
// "replace" discards everything set before, however it was set.
const p3 = base.path("append", "a", "b").path("replace", "c")
export type P3 = Expect<Equal<typeof p3.config.policy.path, ["c"]>>
const p4 = base.path("append", "a").path("replace")
export type P4 = Expect<Equal<typeof p4.config.policy.path, []>>
const p5 = base.path("replace", "a").path("append", "b")
export type P5 = Expect<Equal<typeof p5.config.policy.path, ["a", "b"]>>
// Non-literal values stay non-literal.
const p6 = base.path("append", str, num, maybe)
export type P6 = Expect<Equal<typeof p6.config.policy.path, [string, number, string | null]>>
// The default is an empty list.
export type P7 = Expect<Equal<Base["config"]["policy"]["path"], []>>

// @ts-expect-error  the mode is required
base.path("a")
// @ts-expect-error  unknown mode
base.path("prepend", "a")
// @ts-expect-error  "merge" is for objects
base.path("merge", "a")
// @ts-expect-error  objects aren't path values
base.path("append", {})
// @ts-expect-error  arrays aren't path values (spread them)
base.path("append", ["a"])

// ============================================================================
// query: "append" | "replace"
// ============================================================================

const q1 = base.query("append", { a: 1 }).query("append", { b: "x" })
export type Q1 = Expect<Equal<typeof q1.config.policy.query, ({ readonly a: 1 } | { readonly b: "x" })[]>>
const q2 = base.query("append", { a: 1 }).query("replace", { b: 2 })
export type Q2 = Expect<Equal<typeof q2.config.policy.query, { readonly b: 2 }[]>>
// Values a serializer step handles are accepted as stored values.
base.query("append", { a: null, b: undefined, c: date, d: [1, "2", date, null], e: true })

// @ts-expect-error  the mode is required
base.query({ a: 1 })
// @ts-expect-error  unknown mode
base.query("merge", { a: 1 })
// @ts-expect-error  nested objects aren't query values
base.query("append", { a: { b: 1 } })

// ============================================================================
// headers / body / options: "merge" | "replace"
// ============================================================================

const h1 = base.headers("merge", { a: "1" }).headers("merge", { b: "2" })
export type H1 = Expect<Equal<typeof h1.config.policy.headers["a"] | typeof h1.config.policy.headers["b"], "1" | "2">>
const h2 = base.headers("merge", { a: "1" }).headers("replace", { b: "2" })
export type H2 = Expect<Equal<keyof typeof h2.config.policy.headers, "b">>
// @ts-expect-error  "overwrite" was renamed to "replace"
base.headers("overwrite", { a: "1" })
// @ts-expect-error  "append" is for lists
base.headers("append", { a: "1" })
// @ts-expect-error  header values are strings
base.headers("merge", { a: 1 })

const b1 = base.body("replace", { a: 1 }).body("merge", { b: 2 })
export type B1 = Expect<Equal<typeof b1.config.policy.body, { readonly a: 1, readonly b: 2 }>>
const b2 = base.body("replace", { a: 1 }).body("replace", { b: 2 })
export type B2 = Expect<Equal<typeof b2.config.policy.body, { readonly b: 2 }>>
// @ts-expect-error  "overwrite" was renamed to "replace"
base.body("overwrite", { a: 1 })

const o1 = base.options("merge", { credentials: "include" }).options("replace", { cache: "no-store" })
export type O1 = Expect<Equal<typeof o1.config.policy.extra["cache"], "no-store">>
export type O2 = Expect<Equal<"credentials" extends keyof typeof o1.config.policy.extra ? true : false, false>>
// @ts-expect-error  "overwrite" was renamed to "replace"
base.options("overwrite", { cache: "no-store" })

// ============================================================================
// modes × apiMap
// ============================================================================

type Api = {
    "/users": { GET: { response: "list" } }
    "/users/:id": { GET: { response: "one" } }
    "/posts": { GET: { response: "posts" } }
    "/search": { GET: { request: { query: { q: string, page?: number } }, response: "found" } }
}
const api = base.apiMap<Api>()

// The route is matched on the path the default `path` steps produce.
const a1 = await api.path("append", "users", null, num).request()
export type A1 = Expect<Equal<typeof a1, "one">>
// "replace" re-targets the request, so the route follows it.
const a2 = await api.path("append", "users", str).path("replace", "posts").request()
export type A2 = Expect<Equal<typeof a2, "posts">>
const a3 = await api.route("GET /users/:id", { id: 1 }).path("replace", "users").request()
export type A3 = Expect<Equal<typeof a3, "list">>
// Routes are relative to the path set before `.apiMap()`; replacing it drops that prefix too.
const prefixed = base.path("append", "v1").apiMap<Api>()
const a4 = await prefixed.path("append", "posts").request()
export type A4 = Expect<Equal<typeof a4, "posts">>
const a5 = await prefixed.path("replace", "posts").request()
export type A5 = Expect<Equal<typeof a5, unknown>>

// A query check sees only what is left after "replace".
await api.route("GET /search").query("append", { page: 1 }).query("replace", { q: "x" }).request()
// @ts-expect-error  "replace" dropped `q`
await api.route("GET /search").query("append", { q: "x" }).query("replace", { page: 1 }).request()

// ============================================================================
// serializers
// ============================================================================

// Serializers don't change the builder's type.
const s1 = base.serializers(s => s.path(p => p.dropNullish().stringify()))
export type S1 = Expect<Equal<typeof s1, Base>>
const s2 = base.serializers(new VigorFetchPolicySerializers().url(u => u.confine()))
export type S2 = Expect<Equal<typeof s2, Base>>
const s3 = base.serializers({ url: [VigorUrlSteps.confine()], query: [] })
export type S3 = Expect<Equal<typeof s3, Base>>
// ...and keep the rest of the chain's types.
const s4 = await api.serializers(s => s.query(q => q.stringify())).path("append", "posts").request()
export type S4 = Expect<Equal<typeof s4, "posts">>

// Every chain method, on every stage.
base.serializers(s => s
    .path(p => p.dropNullish().stringify().split().split("|").encode().prefixOrigin())
    .query(q => q.fromOrigin().dropNullish().arrays().arrays("repeat").arrays("comma").arrays("brackets").stringify())
    .url(u => u.hashFromOrigin().confine())
    .body(b => b.text().blob().binary().stream().urlencoded().formData().json())
    .headers(h => h.caseInsensitive().contentType()))
// @ts-expect-error  unknown array format
base.serializers(s => s.query(q => q.arrays("json")))
// @ts-expect-error  steps belong to their own stage
base.serializers(s => s.path(p => p.confine()))
// @ts-expect-error  unknown stage
base.serializers(s => s.hash(h => h))
// @ts-expect-error  the callback must return the chain it was given
base.serializers(s => s.path(p => p.encode().steps))

// custom(): each stage's step signature, with `info` typed.
base.serializers(s => s
    .path(p => p.custom("upper", (segments, info) => {
        const _s: Expect<Equal<typeof segments, unknown[]>> = true
        const _o: Expect<Equal<typeof info.origin, URL>> = true
        return segments.map(v => String(v).toUpperCase())
    }))
    .query(q => q.custom("sorted", entries => {
        const _e: Expect<Equal<typeof entries, VigorQueryEntry[]>> = true
        return [...entries].sort(([a], [b]) => a.localeCompare(b))
    }))
    .url(u => u
        .custom("https", url => { url.protocol = "https:" })
        .custom("copy", url => new URL(url)))
    .body(b => b.custom("csv", body => Array.isArray(body) ? { body: body.join(","), contentType: "text/csv" } : undefined))
    .headers(h => h.custom("ct", (headers, info) => {
        const _c: Expect<Equal<typeof info.contentType, string | null>> = true
        return info.contentType ? { ...headers, "X-Body-Type": info.contentType } : headers
    })))

// @ts-expect-error  a path step returns a list
base.serializers(s => s.path(p => p.custom("bad", segments => segments.join("/"))))
// @ts-expect-error  a query step returns entries
base.serializers(s => s.query(q => q.custom("bad", entries => Object.fromEntries(entries))))
// @ts-expect-error  a url step returns a URL or nothing
base.serializers(s => s.url(u => u.custom("bad", url => url.href)))
// @ts-expect-error  a body step returns `{ body, contentType }` or undefined
base.serializers(s => s.body(b => b.custom("bad", body => String(body))))
// @ts-expect-error  a headers step returns string values
base.serializers(s => s.headers(h => h.custom("bad", headers => ({ ...headers, n: 1 }))))
// @ts-expect-error  a custom step needs a name
base.serializers(s => s.path(p => p.custom((segments: unknown[]) => segments)))

// The config-object form takes step lists per stage, checked per stage.
base.serializers({ path: [VigorPathSteps.dropNullish(), { name: "id", func: segments => segments }] })
// @ts-expect-error  a url step isn't a path step
base.serializers({ path: [VigorUrlSteps.confine()] })
// @ts-expect-error  unknown stage
base.serializers({ hash: [] })
// @ts-expect-error  a step needs a name
base.serializers({ path: [{ func: (segments: unknown[]) => segments }] })

// Exported pieces.
export type E1 = Expect<Equal<VigorFetchSerializerStage, "path" | "query" | "url" | "body" | "headers">>
export type E2 = Expect<Equal<typeof VigorFetchSerializersBase, VigorFetchSerializersSchema>>
export type E3 = Expect<Equal<VigorSerializeInfo["origin"], URL>>
export type E4 = Expect<Equal<VigorSerializedBody, { body: BodyInit, contentType: string | null }>>
export type E5 = Expect<Equal<ReturnType<typeof VigorQuerySteps.arrays>, VigorSerializerStep<(entries: VigorQueryEntry[], info: VigorSerializeInfo) => VigorQueryEntry[]>>>
export type E6 = Expect<Equal<ReturnType<typeof vigorStringifyValue>, string>>
export type E7 = Expect<Equal<ReturnType<typeof vigor.builders.fetch.serializers>, VigorFetchPolicySerializers>>
const steps: readonly string[] = [VigorBodySteps.json().name, VigorHeadersSteps.contentType().name, VigorPathSteps.split("/").name]

// ============================================================================
// errors and timeline
// ============================================================================

export async function errors() {
    const res = await base.path("append", "a").requestVerbose()
    if (!res.success) {
        if (isVigorFetchError(res.error, "SERIALIZE_FAILED")) {
            const stage: string = res.error.data.stage
            const received: unknown = res.error.data.received
        }
        // The guard's callback reaches it too.
        const stage = isVigorFetchError(res.error, "SERIALIZE_FAILED", e => e.data.stage)
        const _stage: Expect<Equal<typeof stage, string | undefined>> = true
    }
    for (const entry of res.timeline) {
        if (entry.action === "SERIALIZED") {
            const _st: Expect<Equal<typeof entry.content.stage, VigorFetchSerializerStage>> = true
            const _steps: Expect<Equal<typeof entry.content.steps, string[]>> = true
        }
    }
}

// ============================================================================
// settings.fetcher
// ============================================================================

export type F1 = Expect<Equal<VigorFetcher, (input: string, init: RequestInit) => Promise<Response>>>
base.settings(s => s.fetcher(fetch))
base.settings({ fetcher: (input: string, init: RequestInit) => fetch(input, init) })
// An unannotated function in the config-object form gets its parameter types from the schema.
base.settings({ fetcher: (input, init) => {
    type _I = Expect<Equal<typeof input, string>>
    type _N = Expect<Equal<typeof init, RequestInit>>
    return fetch(input, init)
} })
base.settings({ debug: true, fetcher: (input, init) => fetch(input, init) })
base.settings({ default: (ctx) => {
    type _M = Expect<Equal<typeof ctx.policy.origin, "https://x">>
    return 1
} })
vigor.retry(async () => 1).settings({ maxAttempts: 2, default: (ctx) => {
    type _R = Expect<Equal<Awaited<ReturnType<typeof ctx.policy.target>>, number>>
    return 0
} })
vigor.parse().settings({ default: (ctx) => ctx })
// ...and still rejects keys the schema doesn't have, next to such a function.
// @ts-expect-error  typo
base.settings({ fetcher: (input, init) => fetch(input, init), debgu: true })
// @ts-expect-error  typo
vigor.retry(async () => 1).settings({ default: (ctx) => 0, maxAtempts: 2 })
base.settings(s => s.fetcher((input, init) => fetch(input, init)))
// Fewer parameters are fine.
base.settings({ fetcher: async () => new Response() })
// Unset is the default.
export type F2 = Expect<Equal<Base["config"]["policy"]["settings"]["fetcher"] extends Function ? true : false, false>>
// @ts-expect-error  must resolve to a Response
base.settings({ fetcher: async () => "x" })
// @ts-expect-error  must return a Promise
base.settings({ fetcher: () => new Response() })
// @ts-expect-error  the URL is a string, not a URL object
base.settings({ fetcher: (input: URL) => fetch(input) })
// @ts-expect-error  `confinePath` moved to the `url` serializer
base.settings({ confinePath: false })
