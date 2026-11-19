/**
 * Type tests for `.cast<T>()` edge cases on every engine. Run with `npm run test:types`.
 * The basics (last call wins, `never`/`any`/`unknown`/`undefined`) are in edge-cases.ts.
 */
import vigor, { VigorResultOf, isVigorFetchError } from "../src/index"

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
type Expect<T extends true> = T

declare const resp: Response
type User = { id: number, name: string }

// ============================================================================
// retry
// ============================================================================

const retry = vigor.retry(async () => 1 as const)

// A target set after the cast doesn't bring the natural type back.
const r1 = await vigor.retry().cast<"c">().target(async () => 1 as const).request()
export type R1 = Expect<Equal<typeof r1, "c">>
const r2 = await retry.cast<"c">().target(async () => 2 as const).target(async () => 3 as const).request()
export type R2 = Expect<Equal<typeof r2, "c">>

// Exact types are kept: readonly tuples, unions, null, functions, branded types.
const r3 = await retry.cast<readonly [1, 2]>().request()
export type R3 = Expect<Equal<typeof r3, readonly [1, 2]>>
const r4 = await retry.cast<[1, 2]>().request()
export type R4 = Expect<Equal<typeof r4, [1, 2]>>
const r5 = await retry.cast<"a" | 1 | null>().request()
export type R5 = Expect<Equal<typeof r5, "a" | 1 | null>>
const r6 = await retry.cast<null>().request()
export type R6 = Expect<Equal<typeof r6, null>>
const r7 = await retry.cast<(x: number) => string>().request()
export type R7 = Expect<Equal<typeof r7, (x: number) => string>>
type Brand = string & { readonly __brand: "id" }
const r8 = await retry.cast<Brand>().request()
export type R8 = Expect<Equal<typeof r8, Brand>>
const r9 = await retry.cast<{ readonly a: { b?: 1 } }>().request()
export type R9 = Expect<Equal<typeof r9, { readonly a: { b?: 1 } }>>
const r10 = await retry.cast<void>().request()
export type R10 = Expect<Equal<typeof r10, void>>
// A cast object type isn't deep-merged with the previous one.
const r11 = await retry.cast<{ a: { x: 1 } }>().cast<{ a: { y: 2 } }>().request()
export type R11 = Expect<Equal<typeof r11, { a: { y: 2 } }>>
// Casting to a type that looks like the empty sentinel's shape still counts as a cast.
const r12 = await retry.cast<symbol>().request()
export type R12 = Expect<Equal<typeof r12, symbol>>

// `default` joins the cast type; with `never` only `default` is left.
const r13 = await retry.cast<string>().settings({ default: () => 0 as const }).request()
export type R13 = Expect<Equal<typeof r13, string | 0>>
const r14 = await retry.settings({ default: () => 0 as const }).cast<string>().request()
export type R14 = Expect<Equal<typeof r14, string | 0>>
const r15 = await retry.cast<never>().settings({ default: () => 0 as const }).request()
export type R15 = Expect<Equal<typeof r15, 0>>
const r16 = await retry.cast<any>().settings({ default: () => 0 as const }).request()
export type R16 = Expect<Equal<typeof r16, any>>
const r17 = await retry.cast<unknown>().settings({ default: () => 0 as const }).request()
export type R17 = Expect<Equal<typeof r17, unknown>>

// Middlewares see the cast type and transform it.
const r18 = await retry.cast<number>().middlewares(m => m.onResult("fluent", r => {
    const check: Expect<Equal<typeof r, number>> = true
    return String(r)
})).request()
export type R18 = Expect<Equal<typeof r18, string>>
retry.cast<number>().middlewares(m => m.after("intercept", ctx => {
    const check: Expect<Equal<typeof ctx.result, number>> = true
    return ctx
}))
// An `intercept` middleware registered before the cast doesn't freeze the type.
const r19 = await retry.middlewares(m => m.onResult("intercept", ctx => ctx)).cast<"late">().request()
export type R19 = Expect<Equal<typeof r19, "late">>
// A `fluent` one registered before the cast keeps its own return type.
const r20 = await retry.middlewares(m => m.onResult("fluent", () => "own" as const)).cast<"late">().request()
export type R20 = Expect<Equal<typeof r20, "own">>

// requestVerbose(), request<R>() and VigorResultOf.
const r21 = await retry.cast<"c">().requestVerbose()
if (r21.success) {
    const data: Expect<Equal<typeof r21.data, "c">> = true
}
const r22 = await retry.cast<"c">().request<"r">()
export type R22 = Expect<Equal<typeof r22, "r">>
export type R23 = Expect<Equal<VigorResultOf<ReturnType<typeof retry.cast<"c">>>, "c">>

// ============================================================================
// parse
// ============================================================================

const parse = vigor.parse(resp)

const p1 = await parse.cast<User>().request()
export type P1 = Expect<Equal<typeof p1, User>>
// A raw parse gives the target, whichever came first.
const p2 = await parse.cast<User>().settings({ raw: true }).request()
export type P2 = Expect<Equal<typeof p2, Response>>
const p3 = await parse.settings({ raw: true }).cast<User>().request()
export type P3 = Expect<Equal<typeof p3, Response>>
// Turning raw back off brings the cast back.
const p4 = await parse.cast<User>().settings({ raw: true }).settings({ raw: false }).request()
export type P4 = Expect<Equal<typeof p4, User>>
// Strategies set after the cast don't change it.
const p5 = await parse.cast<User>().strategies(s => s.text()).request()
export type P5 = Expect<Equal<typeof p5, User>>
const p6 = await parse.cast<User>().middlewares(m => m.onResult("fluent", u => u.name)).request()
export type P6 = Expect<Equal<typeof p6, string>>

// ============================================================================
// fetch
// ============================================================================

const fetch = vigor.fetch("https://x")

// The fetch-level cast wins over the parse engine's cast and over raw.
const f1 = await fetch.parse(p => p.cast<"inner">()).cast<"outer">().request()
export type F1 = Expect<Equal<typeof f1, "outer">>
const f2 = await fetch.cast<"outer">().parse(p => p.cast<"inner">()).request()
export type F2 = Expect<Equal<typeof f2, "outer">>
const f3 = await fetch.parse(p => p.settings({ raw: true })).cast<"outer">().request()
export type F3 = Expect<Equal<typeof f3, "outer">>
// Inside the parse engine, raw wins over its cast.
const f4 = await fetch.parse(p => p.cast<"inner">().settings({ raw: true })).request()
export type F4 = Expect<Equal<typeof f4, Response>>
// A later parse() call without a cast keeps the earlier inner cast.
const f5 = await fetch.parse(p => p.cast<"inner">()).parse({ policy: { settings: { maxRestarts: 1 } } }).request()
export type F5 = Expect<Equal<typeof f5, "inner">>
// A VigorParse instance replaces the whole engine, cast included.
const f6 = await fetch.parse(p => p.cast<"inner">()).parse(vigor.parse().cast<"instance">()).request()
export type F6 = Expect<Equal<typeof f6, "instance">>
const f7 = await fetch.parse(p => p.cast<"inner">()).parse(vigor.parse()).request()
export type F7 = Expect<Equal<typeof f7, unknown>>

// Building the request after the cast doesn't touch it.
const f8 = await fetch.cast<"c">().path("append", "a").query("append", { q: 1 }).method("PUT").body("replace", { a: 1 }).headers("merge", { h: "v" }).request()
export type F8 = Expect<Equal<typeof f8, "c">>

// Fetch-level middlewares and default.
const f9 = await fetch.cast<number>().middlewares(m => m.onResult("fluent", n => {
    const check: Expect<Equal<typeof n, number>> = true
    return n > 0
})).request()
export type F9 = Expect<Equal<typeof f9, boolean>>
const f10 = await fetch.cast<number>().settings({ default: () => "fb" as const }).request()
export type F10 = Expect<Equal<typeof f10, number | "fb">>

// requestVerbose: `data` is the cast type on every success.
export async function fetchVerbose() {
    const v = await fetch.cast<"c">().requestVerbose()
    if (v.success) {
        const data: Expect<Equal<typeof v.data, "c">> = true
    } else if (isVigorFetchError(v.error, "FETCH_FAILED")) {
        // No API map: failures stay untyped.
        const parsed: Expect<Equal<typeof v.error.data.parsed, unknown>> = true
    }
}

// ============================================================================
// fetch + apiMap
// ============================================================================

type Api = {
    "/users": {
        GET: { response: User[] }
        POST: { request: { body: { name: string } }, responses: { 201: User, 422: { fields: string[] } } }
    }
}
const api = fetch.apiMap<Api>()

// A cast set before the map still wins.
const a1 = await fetch.cast<"c">().apiMap<Api>().path("append", "users").request()
export type A1 = Expect<Equal<typeof a1, "c">>
// A matched route wins over the parse engine's cast (it only fills in where nothing matches).
const a2 = await api.path("append", "users").parse(p => p.cast<"inner">()).request()
export type A2 = Expect<Equal<typeof a2, User[]>>
// A cast doesn't skip the request checks.
// @ts-expect-error  the body doesn't match the route
await api.route("POST /users").body("replace", { nope: 1 }).cast<"c">().request()
// ...and per-status narrowing collapses to the cast type.
export async function apiVerbose() {
    const v = await api.route("POST /users").body("replace", { name: "a" }).cast<"c">().requestVerbose()
    if (v.success) {
        const data: Expect<Equal<typeof v.data, "c">> = true
    } else if (isVigorFetchError(v.error, "FETCH_FAILED") && v.error.data.status === 422) {
        const parsed: Expect<Equal<typeof v.error.data.parsed, { fields: string[] } | undefined>> = true
    }
}

// strict: a fetch-level cast opts out; the parse engine's cast doesn't.
const strict = fetch.apiMap<Api>({ strict: true })
const s1 = await strict.path("append", "nope").cast<"c">().request()
export type S1 = Expect<Equal<typeof s1, "c">>
// @ts-expect-error  only a fetch-level cast opts out
await strict.path("append", "nope").parse(p => p.cast<"inner">()).request()

// ============================================================================
// all
// ============================================================================

const all = vigor.all(() => 1 as const, () => "a" as const)

const l1 = await all.cast<"c">().request()
export type L1 = Expect<Equal<typeof l1, "c">>
// The cast wins over onlySuccess's shape, in either order.
const l2 = await all.settings({ onlySuccess: true }).cast<"c">().request()
export type L2 = Expect<Equal<typeof l2, "c">>
const l3 = await all.cast<"c">().settings({ onlySuccess: true }).request()
export type L3 = Expect<Equal<typeof l3, "c">>
// Adding tasks after the cast doesn't change it.
const l4 = await all.cast<"c">().target(() => true).request()
export type L4 = Expect<Equal<typeof l4, "c">>
const l5 = await all.cast<number[]>().middlewares(m => m.onResult("fluent", r => r.length)).request()
export type L5 = Expect<Equal<typeof l5, number>>
