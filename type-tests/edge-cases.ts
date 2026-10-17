/**
 * Type-level edge-case tests. Run with `npm run test:types`.
 *
 * Every assertion states the intended type. A known limitation is marked
 * `@ts-expect-error KNOWN(...)` against the intended type, so the file
 * compiles today and tsc flags the marker once the limitation is lifted.
 */
import vigor, {
    VigorDeepMerge,
    VigorDefaultType,
    VigorRetry,
    VigorPlugin,
    VigorRetryPolicyMiddlewares,
    VigorAllSettled,
    VigorResultOf,
    isVigorRetryError,
    isVigorFetchError,
    isVigorParseError,
    isVigorAllError,
    VigorFetchError,
    VigorParseError,
    VigorAllError,
    VigorFetchErrorDatas,
    VigorFetchContextSchema,
    VigorRetryContextSchema,
    VigorParseContextSchema,
    VigorAllContextSchema,
} from "../src/index"

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
type Expect<T extends true> = T

declare const resp: Response
declare const req: Request
declare const bool: boolean

// ============================================================================
// core: VigorDeepMerge
// ============================================================================

export type Core1 = Expect<Equal<VigorDeepMerge<{ a: { x: 1 } }, { a: { y: 2 } }>, { a: { x: 1, y: 2 } }>>
export type Core2 = Expect<Equal<VigorDeepMerge<readonly [1], readonly [2]>, [1, 2]>>
export type Core3 = Expect<Equal<VigorDeepMerge<{ a: 1 }, { a: () => 2 }>, { a: () => 2 }>>
// An `undefined` value keeps the source value, like `_merge` does at runtime.
export type Core4 = Expect<Equal<VigorDeepMerge<{ a: 1 }, { a?: 2 }>["a"], 1 | 2>>
// A `"replace"` strategy leaf replaces instead of merging/concatenating.
export type Core5 = Expect<Equal<VigorDeepMerge<{ a: { x: 1 } }, { a: { y: 2 } }, { a: "replace" }>, { a: { y: 2 } }>>
export type Core6 = Expect<Equal<VigorDeepMerge<{ a: [1] }, { a: [2] }, { a: "replace" }>, { a: [2] }>>
// `any` doesn't spread into a union of both branches.
export type Core7 = Expect<Equal<VigorDeepMerge<any, { a: 1 }>, { a: 1 }>>
// Platform classes are replaced as a whole, not merged member by member.
export type Core8 = Expect<Equal<VigorDeepMerge<{ t: Response }, { t: Request }>, { t: Request }>>

// ============================================================================
// .cast<T>() — the last call always wins
// ============================================================================

const cast1 = await vigor.retry(async () => 1 as const).cast<string>().cast<number>().request()
export type Cast1 = Expect<Equal<typeof cast1, number>>
const cast2 = await vigor.retry(async () => 1 as const).cast<undefined>().request()
export type Cast2 = Expect<Equal<typeof cast2, undefined>>
const cast3 = await vigor.retry(async () => 1 as const).cast<unknown>().request()
export type Cast3 = Expect<Equal<typeof cast3, unknown>>
const cast4 = await vigor.retry(async () => 1 as const).cast<{ a: 1 }>().cast<{ b: 2 }>().request()
export type Cast4 = Expect<Equal<typeof cast4, { b: 2 }>>
const cast5 = await vigor.retry(async () => 1 as const).cast<string[]>().cast<number[]>().request()
export type Cast5 = Expect<Equal<typeof cast5, number[]>>
const cast6 = await vigor.retry(async () => 1 as const).cast<never>().request()
export type Cast6 = Expect<Equal<typeof cast6, never>>
const cast7 = await vigor.retry(async () => 1 as const).cast<any>().request()
export type Cast7 = Expect<Equal<typeof cast7, any>>

// ============================================================================
// retry
// ============================================================================

const retry1 = await vigor.retry(async () => 1 as const).request()
export type Retry1 = Expect<Equal<typeof retry1, 1>>
const retry2 = await vigor.retry().request()
export type Retry2 = Expect<Equal<typeof retry2, never>>
const retry3 = await vigor.retry(() => { throw new Error() }).request()
export type Retry3 = Expect<Equal<typeof retry3, never>>

// `default` can produce the result, so its return type is part of it.
const retry4 = await vigor.retry(async () => 1 as const).settings({ default: () => "fb" as const }).request()
export type Retry4 = Expect<Equal<typeof retry4, 1 | "fb">>
const retry5 = await vigor.retry(async () => 1 as const).settings(s => s.default(async () => null)).request()
export type Retry5 = Expect<Equal<typeof retry5, 1 | null>>

// Unknown config keys are rejected, alone or next to real ones, at any depth.
// @ts-expect-error
vigor.retry(async () => 1).settings({ maxAttemps: 3 })
// @ts-expect-error
vigor.retry(async () => 1).settings({ maxAttempts: 3, timeot: 5 })
// @ts-expect-error
vigor.fetch("https://x").retry({ policy: { settings: { maxAttempts: 3, typo: 1 } } })
// @ts-expect-error
vigor.retry(async () => 1).algorithms(a => a.linear({ initial: 1, intial: 2 }))
vigor.retry(async () => 1).algorithms({ _tag: "constant", interval: 1 })

// Switching algorithms replaces the previous algorithm's config.
const algo = vigor.retry(async () => 1).algorithms(a => a.linear()).algorithms(a => a.constant({ interval: 5 }))
type Algo = typeof algo.config.policy.algorithms
export type Algo1 = Expect<Equal<Algo["_tag"], "constant">>
export type Algo2 = Expect<Equal<Algo["interval"], 5>>
export type Algo3 = Expect<Equal<"increment" extends keyof Algo ? true : false, false>>

// A configured builder needs `VigorRetry<any>`: the bare `VigorRetry` is the
// unconfigured instance type (it's what `new VigorRetry()` must infer).
// @ts-expect-error KNOWN(builder-assignability)
export const retryVar: VigorRetry = vigor.retry(async () => 1).settings({ maxAttempts: 2 })
export const retryVarAny: VigorRetry<any> = vigor.retry(async () => 1).settings({ maxAttempts: 2 })

// ============================================================================
// middleware callbacks: `.middlewares(m => m.onResult("fluent", r => ...))`
// ============================================================================

const base = vigor.retry(async () => 1 as const)

const mw1 = await base.middlewares(m => m.onResult("fluent", r => `${r}` as const)).request()
export type Mw1 = Expect<Equal<typeof mw1, "1">>
const mw2 = await base.middlewares(m => m
    .onResult("fluent", r => `${r}` as const)
    .onResult("fluent", r => [r] as const)
).request()
export type Mw2 = Expect<Equal<typeof mw2, readonly ["1"]>>
const mw3 = await base
    .middlewares(m => m.onResult("fluent", r => `${r}` as const))
    .middlewares(m => m.onResult("fluent", r => [r] as const))
    .request()
export type Mw3 = Expect<Equal<typeof mw3, readonly ["1"]>>
const mw4 = await base.middlewares((m: VigorRetryPolicyMiddlewares<typeof base.config>) => m.onResult("fluent", r => `${r}` as const)).request()
export type Mw4 = Expect<Equal<typeof mw4, "1">>
const mw5 = await base.middlewares(m => m.onResult("intercept", (ctx, api) => ctx)).request()
export type Mw5 = Expect<Equal<typeof mw5, 1>>

// The parameter itself is typed, in every module and in settings callbacks.
base.middlewares(m => m.onResult("fluent", r => {
    const check: Expect<Equal<typeof r, 1>> = true
    return r
}))
base.middlewares(m => m.before("intercept", (ctx, api) => {
    const check: Expect<Equal<typeof ctx.result, VigorDefaultType>> = true
    return ctx
}))
vigor.fetch("https://x").cast<{ a: 1 }>().middlewares(m => m.onResult("fluent", r => {
    const check: Expect<Equal<typeof r, { a: 1 }>> = true
    return r
}))
vigor.all(() => 1 as const).middlewares(m => m.onResult("fluent", r => {
    const check: Expect<Equal<typeof r, [VigorAllSettled<1>]>> = true
    return r
}))
vigor.parse(resp).cast<{ a: 1 }>().middlewares(m => m.onResult("fluent", r => {
    const check: Expect<Equal<typeof r, { a: 1 }>> = true
    return r
}))
base.settings(s => s.default(ctx => {
    const check: Expect<Equal<typeof ctx.result, 1 | VigorDefaultType>> = true
    return 0
}))

// An array result is replaced by each step, never concatenated with the previous one.
const arr1 = await vigor.retry(async () => [1] as const).request()
export type Arr1 = Expect<Equal<typeof arr1, readonly [1]>>
const arr2 = await vigor.retry(async () => [1] as const).middlewares(m => m.onResult("fluent", r => [2] as const)).request()
export type Arr2 = Expect<Equal<typeof arr2, readonly [2]>>
vigor.retry(async () => [1] as const).middlewares(m => m.after("fluent", ctx => {
    const check: Expect<Equal<typeof ctx.result, readonly [1]>> = true
}))

// The callback form never duplicates the existing middlewares in the type.
const mwOnce = base.middlewares(m => m.onResult("fluent", r => r))
const mwTwice = mwOnce.middlewares(m => m)
export type MwDup1 = Expect<Equal<typeof mwOnce.config.policy.middlewares.onResult["length"], 1>>
export type MwDup2 = Expect<Equal<typeof mwTwice.config.policy.middlewares.onResult["length"], 1>>
const mwMore = mwOnce.middlewares(m => m.onResult("fluent", r => r))
export type MwDup3 = Expect<Equal<typeof mwMore.config.policy.middlewares.onResult["length"], 2>>

// ============================================================================
// parse
// ============================================================================

const parse1 = await vigor.parse(resp).request()
export type Parse1 = Expect<Equal<typeof parse1, unknown>>
const parse2 = await vigor.parse(resp).settings({ raw: true }).request()
export type Parse2 = Expect<Equal<typeof parse2, Response>>
const parse3 = await vigor.parse().settings({ raw: true }).request()
export type Parse3 = Expect<Equal<typeof parse3, never>>
const parse4 = vigor.parse(resp).target(req)
export type Parse4 = Expect<Equal<typeof parse4.config.policy.target, Request>>
const parse5 = await vigor.parse(resp).settings({ default: () => 0 as const }).cast<string>().request()
export type Parse5 = Expect<Equal<typeof parse5, string | 0>>
const parse6 = await vigor.parse(resp).strategies(s => s.json().text(true)).cast<{ ok: true }>().request()
export type Parse6 = Expect<Equal<typeof parse6, { ok: true }>>

// ============================================================================
// fetch
// ============================================================================

const fetch1 = await vigor.fetch("https://x").request()
export type Fetch1 = Expect<Equal<typeof fetch1, unknown>>
const fetch2 = vigor.fetch("https://a").origin("https://b").hash("x").hash("y")
export type Fetch2 = Expect<Equal<typeof fetch2.config.policy.origin, "https://b">>
export type Fetch3 = Expect<Equal<typeof fetch2.config.policy.hash, "y">>

// The parse engine's result type is the request's result type.
const fetch4 = await vigor.fetch("https://x").parse(p => p.cast<{ id: number }>()).request()
export type Fetch4 = Expect<Equal<typeof fetch4, { id: number }>>
const fetch5 = await vigor.fetch("https://x").parse(p => p.settings({ raw: true })).request()
export type Fetch5 = Expect<Equal<typeof fetch5, Response>>
const fetch6 = await vigor.fetch("https://x").parse({ settings: { raw: true } } as never).request()
const fetch7 = await vigor.fetch("https://x").parse({ policy: { settings: { raw: true } } }).request()
export type Fetch7 = Expect<Equal<typeof fetch7, Response>>
const fetch8 = await vigor.fetch("https://x").parse(p => p.cast<{ id: number }>()).cast<string>().request()
export type Fetch8 = Expect<Equal<typeof fetch8, string>>
const fetch9 = await vigor.fetch("https://x").settings({ default: () => "fb" as const }).cast<number>().request()
export type Fetch9 = Expect<Equal<typeof fetch9, number | "fb">>

// "overwrite"/"replace" apply to the type as they do at runtime; "merge" merges.
const body1 = vigor.fetch("https://x").body("overwrite", { a: 1 }).body("overwrite", { b: 2 })
export type Body1 = Expect<Equal<typeof body1.config.policy.body, { readonly b: 2 }>>
const body2 = vigor.fetch("https://x").body("overwrite", { a: 1 }).body("merge", { b: 2 })
export type Body2 = Expect<Equal<typeof body2.config.policy.body, { readonly a: 1, readonly b: 2 }>>
const body3 = vigor.fetch("https://x").body("overwrite", "text").body("merge", { b: 2 })
export type Body3 = Expect<Equal<typeof body3.config.policy.body, { readonly b: 2 }>>
const headers1 = vigor.fetch("https://x").headers("merge", { a: "1" }).headers("overwrite", { b: "2" })
export type Headers1 = Expect<Equal<typeof headers1.config.policy.headers, { readonly b: "2" }>>
const headers2 = vigor.fetch("https://x").headers("merge", { a: "1" }).headers("merge", { b: "2" })
export type Headers2 = Expect<Equal<typeof headers2.config.policy.headers, { a: "1", b: "2" }>>
const options1 = vigor.fetch("https://x").options("merge", { credentials: "include" }).options("overwrite", { cache: "no-store" })
export type Options1 = Expect<Equal<typeof options1.config.policy.extra, { readonly cache: "no-store" }>>
const options2 = vigor.fetch("https://x").options("merge", { credentials: "include" }).options("merge", { cache: "no-store" })
export type Options2 = Expect<Equal<typeof options2.config.policy.extra, { readonly credentials: "include", readonly cache: "no-store" }>>
const status1 = vigor.fetch("https://x").settings({ unretryStatus: [500] })
export type Status1 = Expect<Equal<typeof status1.config.policy.settings.unretryStatus, [500]>>
const status2 = vigor.fetch("https://x").settings(s => s.unretryStatus(400))
export type Status2 = Expect<Equal<typeof status2.config.policy.settings.unretryStatus, [400]>>
const status3 = vigor.fetch("https://x").settings(s => s.maxRestarts(1))
export type Status3 = Expect<Equal<typeof status3.config.policy.settings.unretryStatus["length"], 29>>

// `confinePath` is on by default and can be turned off.
export type Confine1 = Expect<Equal<ReturnType<typeof vigor.fetch>["config"]["policy"]["settings"]["confinePath"], true>>
const confineOff = vigor.fetch("https://x").settings(s => s.confinePath(false))
export type Confine2 = Expect<Equal<typeof confineOff.config.policy.settings.confinePath, false>>
export function confineError(e: unknown) {
    if (isVigorFetchError(e, "PATH_ESCAPED")) {
        const url: string = e.data.url
        const base: string = e.data.base
        const href: string = e.context.href
    }
}

// Inputs that must be rejected.
// @ts-expect-error
vigor.fetch("https://x").method("get")
// @ts-expect-error
vigor.fetch("https://x").path({})
// @ts-expect-error
vigor.fetch("https://x").query({ a: { b: 1 } })
// @ts-expect-error
vigor.fetch("https://x").headers("merge", { a: 1 })
// @ts-expect-error
vigor.fetch("https://x").body("overwrite", 123)
// A GET/HEAD request can't carry a body (runtime: BODY_NOT_ALLOWED), in either order.
// @ts-expect-error
vigor.fetch("https://x").method("GET").body("overwrite", { a: 1 })
// @ts-expect-error
vigor.fetch("https://x").body("overwrite", { a: 1 }).method("HEAD")
vigor.fetch("https://x").method("GET").body("overwrite", null)
vigor.fetch("https://x").body("overwrite", { a: 1 }).body("overwrite", null).method("GET")
vigor.fetch("https://x").body("overwrite", { a: 1 }).method("PUT")

// ============================================================================
// all
// ============================================================================

// Every task gets its own slot holding its outcome, so a failure can't pass for a result.
const all1 = await vigor.all(() => 1 as const, async () => "a" as const).request()
export type All1 = Expect<Equal<typeof all1, [VigorAllSettled<1>, VigorAllSettled<"a">]>>
const all2 = await vigor.all(() => 1 as const).target(() => 2 as const).request()
export type All2 = Expect<Equal<typeof all2, [VigorAllSettled<1>, VigorAllSettled<2>]>>
const all3 = await vigor.all().request()
export type All3 = Expect<Equal<typeof all3, []>>
declare const tasks: Array<() => number>
const all4 = await vigor.all(...tasks).request()
export type All4 = Expect<Equal<typeof all4, VigorAllSettled<number>[]>>
// A slot narrows by `success`, like `requestVerbose()`'s envelope.
const [slot] = all1
if (slot.success) {
    const data: Expect<Equal<typeof slot.data, 1>> = true
    const error: null = slot.error
} else {
    const data: null = slot.data
    if (isVigorAllError(slot.error, "TIMED_OUT")) {
        const index: number = slot.error.data.index
    }
}
// `onlySuccess` keeps only the successful values: an array of the tasks' result types.
const all5 = await vigor.all(() => 1 as const, () => "a" as const).settings({ onlySuccess: true }).request()
export type All5 = Expect<Equal<typeof all5, (1 | "a")[]>>
// A non-literal `onlySuccess` could be either shape.
const all6 = await vigor.all(() => 1 as const).settings({ onlySuccess: bool }).request()
export type All6 = Expect<Equal<typeof all6, [VigorAllSettled<1>] | 1[]>>
const allBase = vigor.all(() => 1 as const)
const all7 = await allBase
    .middlewares(m => m.onResult("fluent", r => r[0].success ? r[0].data : 0 as const))
    .request()
export type All7 = Expect<Equal<typeof all7, 1 | 0>>

// ============================================================================
// long chains don't hit "Type instantiation is excessively deep" (TS2589)
// ============================================================================

const longFetch = vigor.fetch("https://x")
    .path("1").path("2").path("3").path("4").path("5").path("6")
    .query({ a: 1 }).query({ b: 2 }).query({ c: 3 }).query({ d: 4 })
    .headers("merge", { a: "1" }).headers("merge", { b: "2" }).headers("merge", { c: "3" })
    .hash("a").hash("b").method("PUT").method("POST").origin("https://y")
    .cast<{ ok: true }>()
const longFetchResult = await longFetch.request()
export type Long1 = Expect<Equal<typeof longFetchResult, { ok: true }>>
const longMixed = vigor.fetch("https://x")
    .path("a").query({ q: 1 }).headers("merge", { h: "v" }).body("overwrite", { a: 1 })
    .path("a").query({ q: 1 }).headers("merge", { h: "v" }).body("overwrite", { a: 1 })
    .path("a").query({ q: 1 }).headers("merge", { h: "v" }).body("overwrite", { a: 1 })
    .path("a").query({ q: 1 }).headers("merge", { h: "v" }).body("overwrite", { a: 1 })
    .path("a").query({ q: 1 }).headers("merge", { h: "v" }).body("overwrite", { a: 1 })
    .path("a").query({ q: 1 }).headers("merge", { h: "v" }).body("overwrite", { a: 1 })
    .path("a").query({ q: 1 }).headers("merge", { h: "v" }).body("overwrite", { a: 1 })
    .path("a").query({ q: 1 }).headers("merge", { h: "v" }).body("overwrite", { a: 1 })
    .path("a").query({ q: 1 }).headers("merge", { h: "v" }).body("overwrite", { a: 1 })
    .path("a").query({ q: 1 }).headers("merge", { h: "v" }).body("overwrite", { a: 1 })
const longMixedResult = await longMixed.cast<1>().request()
export type Long3 = Expect<Equal<typeof longMixedResult, 1>>
const longRetry = vigor.retry(async () => 1 as const)
    .target(async () => 2 as const).target(async () => 3 as const).target(async () => 4 as const)
    .cast<1>().cast<2>().cast<3>().cast<4>().cast<5>().cast<6>().cast<7>().cast<8>()
    .abortSignals().abortSignals().abortSignals()
const longRetryResult = await longRetry.request()
export type Long2 = Expect<Equal<typeof longRetryResult, 8>>

// ============================================================================
// errors
// ============================================================================

export async function errorNarrowing() {
    const r = await vigor.retry(async () => 1 as const).requestVerbose()
    if (r.success) {
        const data: 1 = r.data
        const error: null = r.error
    } else {
        // @ts-expect-error  `code` needs narrowing first
        r.error.code
        if (isVigorRetryError(r.error) && r.error.code === "RETRY_EXHAUSTED") {
            const max: number = r.error.data.maxAttempts
        }
        if (isVigorRetryError(r.error) && r.error.code === "VALUE_REQUIRED") {
            // @ts-expect-error  `data` is narrowed by `code`
            r.error.data.maxAttempts
        }
    }

    const p = await vigor.parse(resp).requestVerbose()
    if (!p.success && isVigorParseError(p.error) && p.error.code === "PARSER_NOT_FOUND") {
        const expected: string[] = p.error.data.expected
    }

    const a = await vigor.all(() => 1).requestVerbose()
    if (!a.success && isVigorAllError(a.error) && a.error.code === "TIMED_OUT") {
        const index: number = a.error.data.index
    }

    // Every fetch code survives the guard on a configured fetch — including
    // the nested retry/parse engines' codes, which fetch reports as its own.
    const f = await vigor.fetch("https://x").path("a").requestVerbose()
    if (!f.success && isVigorFetchError(f.error)) {
        const codes: Expect<Equal<typeof f.error.code,
            | "VALUE_REQUIRED" | "RESTART_EXHAUSTED" | "INVALID_BODY" | "BODY_NOT_ALLOWED" | "INVALID_PROTOCOL" | "FETCH_FAILED" | "REDIRECTED" | "PATH_ESCAPED"
            | "RETRY_EXHAUSTED" | "TIMED_OUT"
            | "INVALID_CONTENT_TYPE" | "PARSER_NOT_FOUND" | "PARSER_ALL_FAILED"
        >> = true
        if (f.error.code === "FETCH_FAILED") {
            const status: number = f.error.data.status
        }
        if (f.error.code === "RETRY_EXHAUSTED") {
            const max: number = f.error.data.maxAttempts
        }
        if (f.error.code === "TIMED_OUT") {
            const limit: number = f.error.data.limit
        }
        if (f.error.code === "PARSER_NOT_FOUND") {
            const expected: string[] = f.error.data.expected
        }
    }
    // A fetch never fails with the nested engines' own classes.
    type FetchError = Extract<typeof f, { success: false }>["error"]
    const noRetry: Expect<Equal<Exclude<Extract<FetchError, { code: string }>, VigorFetchError<any, any>>, never>> = true
}

// ============================================================================
// guards with codes: `isVigor*Error(error, ...codes)`
// ============================================================================

export async function guardCodes(thrown: unknown) {
    const f = await vigor.fetch("https://x").requestVerbose()
    if (f.success) return

    if (isVigorFetchError(f.error, "FETCH_FAILED")) {
        const code: Expect<Equal<typeof f.error.code, "FETCH_FAILED">> = true
        const data: Expect<Equal<typeof f.error.data, { status: number, statusText: string, response: Response, url: string, parsed: unknown }>> = true
        const response: Response = f.error.data.response
    } else {
        // The typed FETCH_FAILED member is gone from the else branch.
        const rest: Expect<Equal<Extract<typeof f.error, { code: "FETCH_FAILED" }>, never>> = true
    }

    // Several codes: their union, still correlated with `data`.
    if (isVigorFetchError(f.error, "RETRY_EXHAUSTED", "RESTART_EXHAUSTED")) {
        const codes: Expect<Equal<typeof f.error.code, "RETRY_EXHAUSTED" | "RESTART_EXHAUSTED">> = true
        const max: number = f.error.data.maxAttempts
        const last: unknown = f.error.data.error
    }
    if (isVigorFetchError(f.error, "TIMED_OUT", "FETCH_FAILED")) {
        if (f.error.code === "TIMED_OUT") {
            const limit: number = f.error.data.limit
        } else {
            const status: number = f.error.data.status
        }
    }

    // Works on `unknown` (a `catch` binding, `request()` rejections).
    if (isVigorFetchError(thrown, "INVALID_PROTOCOL")) {
        const base: string | undefined = thrown.data.base
    }
    if (isVigorRetryError(thrown, "TIMED_OUT")) {
        const limit: number = thrown.data.limit
    }
    if (isVigorParseError(thrown, "PARSER_NOT_FOUND")) {
        const expected: string[] = thrown.data.expected
    }
    // Why each strategy failed is kept on the error itself.
    if (isVigorFetchError(thrown, "PARSER_ALL_FAILED")) {
        const tried: string[] = thrown.data.tried
        const errors: unknown[] = thrown.data.errors
    }
    if (isVigorAllError(thrown, "TIMED_OUT")) {
        const index: number = thrown.data.index
    }
    if (vigor.guards.fetch(thrown, "REDIRECTED")) {
        const url: string = thrown.data.url
    }

    // `context` follows the code: always there, maybe there, or never there.
    if (isVigorFetchError(thrown, "FETCH_FAILED")) {
        const ctx: Expect<Equal<typeof thrown.context, VigorFetchContextSchema<any>>> = true
        const href: string = thrown.context.href
    }
    if (isVigorFetchError(thrown, "INVALID_PROTOCOL", "RETRY_EXHAUSTED", "PARSER_NOT_FOUND")) {
        const ctx: Expect<Equal<typeof thrown.context, VigorFetchContextSchema<any>>> = true
    }
    if (isVigorFetchError(thrown, "VALUE_REQUIRED")) {
        const ctx: Expect<Equal<typeof thrown.context, VigorFetchContextSchema<any> | undefined>> = true
        // @ts-expect-error  may be missing (raised by `.route()` while building)
        thrown.context.href
    }
    if (isVigorFetchError(thrown, "FETCH_FAILED", "VALUE_REQUIRED")) {
        if (thrown.code === "FETCH_FAILED") {
            const href: string = thrown.context.href
        }
    }
    if (isVigorRetryError(thrown, "TIMED_OUT")) {
        const ctx: Expect<Equal<typeof thrown.context, VigorRetryContextSchema<any>>> = true
    }
    if (isVigorRetryError(thrown, "VALUE_REQUIRED")) {
        const ctx: Expect<Equal<typeof thrown.context, VigorRetryContextSchema<any> | undefined>> = true
    }
    if (isVigorParseError(thrown, "PARSER_NOT_FOUND", "INVALID_CONTENT_TYPE")) {
        const ctx: Expect<Equal<typeof thrown.context, undefined>> = true
    }
    if (isVigorParseError(thrown, "PARSER_ALL_FAILED")) {
        const ctx: Expect<Equal<typeof thrown.context, VigorParseContextSchema<any> | undefined>> = true
    }
    if (isVigorParseError(thrown, "RESTART_EXHAUSTED")) {
        const ctx: Expect<Equal<typeof thrown.context, VigorParseContextSchema<any>>> = true
    }
    if (isVigorAllError(thrown, "TIMED_OUT")) {
        const ctx: Expect<Equal<typeof thrown.context, undefined>> = true
    }
    if (isVigorAllError(thrown, "EMPTY_TARGET")) {
        const ctx: Expect<Equal<typeof thrown.context, VigorAllContextSchema<any>>> = true
    }

    // Unknown codes, or another module's, are rejected.
    // @ts-expect-error
    isVigorFetchError(thrown, "NOPE")
    // @ts-expect-error
    isVigorAllError(thrown, "FETCH_FAILED")
}

// ============================================================================
// `context` is the failing request's own context, not a generic one
// ============================================================================

export async function typedContexts() {
    const fetchReq = vigor.fetch("https://api.example.com").path("users").headers("merge", { auth: "t" })
    const f = await fetchReq.requestVerbose()
    if (!f.success && isVigorFetchError(f.error, "FETCH_FAILED")) {
        const origin: Expect<Equal<typeof f.error.context.policy.origin, "https://api.example.com">> = true
        const path: Expect<Equal<typeof f.error.context.policy.path, ["users"]>> = true
        const headers: Expect<Equal<typeof f.error.context.policy.headers, { auth: "t" }>> = true
    }
    // ...without a code too, narrowing by `code` afterwards.
    if (!f.success && isVigorFetchError(f.error) && f.error.code === "RETRY_EXHAUSTED") {
        const origin: Expect<Equal<typeof f.error.context.policy.origin, "https://api.example.com">> = true
    }
    // A maybe-missing context is still the request's when present.
    if (!f.success && isVigorFetchError(f.error, "VALUE_REQUIRED") && f.error.context) {
        const origin: Expect<Equal<typeof f.error.context.policy.origin, "https://api.example.com">> = true
    }

    const r = await vigor.retry(async () => 1 as const).settings({ maxAttempts: 7 }).requestVerbose()
    if (!r.success && isVigorRetryError(r.error, "RETRY_EXHAUSTED")) {
        const max: Expect<Equal<typeof r.error.context.policy.settings.maxAttempts, 7>> = true
    }
    const p = await vigor.parse(resp).settings({ maxRestarts: 9 }).requestVerbose()
    if (!p.success && isVigorParseError(p.error, "RESTART_EXHAUSTED")) {
        const restarts: Expect<Equal<typeof p.error.context.policy.settings.maxRestarts, 9>> = true
    }
    const a = await vigor.all(() => 1 as const).settings({ concurrency: 2 }).requestVerbose()
    if (!a.success && isVigorAllError(a.error, "EMPTY_TARGET")) {
        const concurrency: Expect<Equal<typeof a.error.context.policy.settings.concurrency, 2>> = true
    }

    // On `unknown` there's no request to take the type from: the generic context.
    try { await fetchReq.request() } catch (e) {
        if (isVigorFetchError(e, "FETCH_FAILED")) {
            const ctx: Expect<Equal<typeof e.context, VigorFetchContextSchema<any>>> = true
        }
    }
}

// ============================================================================
// constructing errors: `context` is required / optional / forbidden per code
// ============================================================================

declare const fetchCtx: VigorFetchContextSchema<any>
declare const allCtx: VigorAllContextSchema<any>
declare const fetchFailedData: VigorFetchErrorDatas<"FETCH_FAILED">
new VigorFetchError("FETCH_FAILED", { method: "m", data: fetchFailedData, context: fetchCtx })
// @ts-expect-error  FETCH_FAILED always has a context
new VigorFetchError("FETCH_FAILED", { method: "m", data: fetchFailedData })
new VigorFetchError("VALUE_REQUIRED", { method: "m", data: { key: "k" } })
new VigorFetchError("VALUE_REQUIRED", { method: "m", data: { key: "k" }, context: fetchCtx })
new VigorParseError("PARSER_NOT_FOUND", { method: "m", data: { received: null, expected: [] } })
// @ts-expect-error  PARSER_NOT_FOUND never has one
new VigorParseError("PARSER_NOT_FOUND", { method: "m", data: { received: null, expected: [] }, context: {} as VigorParseContextSchema<any> })
new VigorAllError("EMPTY_TARGET", { method: "m", data: {}, context: allCtx })
// @ts-expect-error  TIMED_OUT is per task, without the batch context
new VigorAllError("TIMED_OUT", { method: "m", data: { limit: 1, index: 0 }, context: allCtx })
const constructed = new VigorFetchError("FETCH_FAILED", { method: "m", data: fetchFailedData, context: fetchCtx })
export type Constructed = Expect<Equal<typeof constructed.context, VigorFetchContextSchema<any>>>

// ============================================================================
// timeline / settings.debug
// ============================================================================

const dbg = vigor.fetch("https://x").settings(s => s.debug(true))
export type Debug1 = Expect<Equal<typeof dbg.config.policy.settings.debug, true>>
const dbgOff = dbg.settings({ debug: false })
export type Debug2 = Expect<Equal<typeof dbgOff.config.policy.settings.debug, false>>
export type Debug3 = Expect<Equal<ReturnType<typeof vigor.fetch>["config"]["policy"]["settings"]["debug"], false>>
// It's a setting, not a builder method.
// @ts-expect-error
vigor.fetch("https://x").debug()
vigor.retry(async () => 1).settings(s => s.debug(true))
vigor.parse(resp).settings({ debug: true })
vigor.all(() => 1).settings(s => s.debug(true))

export async function timelineTypes() {
    const f = await vigor.fetch("https://x").settings(s => s.debug(true)).requestVerbose()
    for (const e of f.timeline) {
        if (e.action === "REQUEST_END") {
            const outcome: Expect<Equal<typeof e.content.outcome, "result" | "overridden" | "default" | "failed">> = true
            const restarts: number = e.content.restarts
        }
        if (e.action === "RESPONSE_RECEIVED") {
            const status: number = e.content.status
            const attempt: number = e.content.attempt
        }
        if (e.action === "PARSE_STARTED") {
            const attempt: number = e.content.attempt
        }
        if (e.action === "MIDDLEWARE_RAN") {
            const internal: boolean = e.content.internal
            const index: number = e.content.index
            if (e.content.threw) e.content.error
        }
        if (e.action === "RETRY_ENDED") {
            for (const r of e.content.timeline) {
                if (r.action === "RETRY_DECISION") {
                    const reason: Expect<Equal<typeof r.content.reason, "retry" | "cancelled" | "breakRetry" | "aborted" | "exhausted">> = true
                }
                if (r.action === "PROCESS_HANDLING" && r.content.type === "RETRY_ERROR") {
                    const timedOut: boolean = r.content.data.timedOut
                    const aborted: boolean = r.content.data.aborted
                }
            }
        }
    }
    vigor.retry(async () => 1).middlewares(m => m.onError("intercept", ctx => {
        const flags: Expect<Equal<keyof typeof ctx.flags, "doRetry" | "doRestart" | "brokeRetry" | "aborted" | "timedOut" | "overridden">> = true
        return ctx
    }))
}

// ============================================================================
// plugins
// ============================================================================

const plugin = {
    options: { key: "default" },
    func: (_v, o) => ({ hello: () => o.key }),
} satisfies VigorPlugin<{ key: string }, { hello: () => string }>

const withPlugin = vigor.use(plugin, { key: "a" })
export type Plugin1 = Expect<Equal<ReturnType<typeof withPlugin.hello>, string>>
const chained = withPlugin.use({ options: {}, func: () => ({ bye: 1 }) })
export type Plugin2 = Expect<Equal<typeof chained.bye, number>>
export type Plugin3 = Expect<Equal<ReturnType<typeof chained.hello>, string>>
// @ts-expect-error
vigor.use(plugin, { key: 1 })
// `plugin.options` are the defaults, so options can be omitted or partial.
vigor.use(plugin)
vigor.use(plugin, {})
// A plugin property replaces a same-named built-in or earlier plugin property.
const overridden = vigor.use({ options: {}, func: () => ({ retry: "replaced" }) })
export type Plugin4 = Expect<Equal<typeof overridden.retry, string>>
const overriddenTwice = vigor.use({ options: {}, func: () => ({ x: 1 }) }).use({ options: {}, func: () => ({ x: "s" }) })
export type Plugin5 = Expect<Equal<typeof overriddenTwice.x, string>>
export type Plugin6 = Expect<Equal<ReturnType<typeof overridden.fetch>, ReturnType<typeof vigor.fetch>>>

// ============================================================================
// request<R>(): an unchecked override; VigorResultOf<B> names the inferred type
// ============================================================================

// `R` means "ignore the inference, it's this" — any type, unchecked.
const overridden1 = await vigor.retry(async () => 1 as const).request<string>()
export type Dx1 = Expect<Equal<typeof overridden1, string>>
const overridden2 = await vigor.fetch("https://x").request<{ id: number }>()
export type Dx2 = Expect<Equal<typeof overridden2, { id: number }>>
const overridden3 = await vigor.all(() => 1).requestVerbose<"x">()
if (overridden3.success) {
    const data: Expect<Equal<typeof overridden3.data, "x">> = true
}
// Without it, the inferred type.
const inferred = await vigor.retry(async () => 1 as const).request()
export type Dx3 = Expect<Equal<typeof inferred, 1>>

// The inferred type as a type, for any builder.
const forResultOf = vigor.retry(async () => 1 as const).settings({ default: () => "fb" as const })
export type Dx4 = Expect<Equal<VigorResultOf<typeof forResultOf>, 1 | "fb">>
export type Dx5 = Expect<Equal<VigorResultOf<typeof longFetch>, { ok: true }>>
export type Dx6 = Expect<Equal<VigorResultOf<ReturnType<typeof vigor.parse>>, unknown>>
const forResultOfAll = vigor.all(() => 1 as const).settings({ onlySuccess: true })
export type Dx7 = Expect<Equal<VigorResultOf<typeof forResultOfAll>, 1[]>>
export type Dx8 = Expect<Equal<VigorResultOf<string>, never>>
