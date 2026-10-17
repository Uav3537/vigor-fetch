/**
 * Type tests for how middlewares shape each stage's context and the result:
 * an intercept middleware's returned context overwrites the keys it
 * changed, a fluent `onResult`'s return value overwrites `result`. Run with
 * `npm run test:types`.
 */
import vigor, { VigorDefaultType } from "../src/index"

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
type Expect<T extends true> = T

declare const resp: Response
type Api = { "GET /u": { response: { id: number } } }

const retry = vigor.retry(async () => 1 as const)
const parse = vigor.parse(resp).cast<{ p: 1 }>()
const fetch = vigor.fetch("https://x").cast<{ f: 1 }>()
const all = vigor.all(async () => 1 as const)

// ============================================================================
// async intercept middlewares: the returned context is awaited
// ============================================================================

const a1 = await retry.middlewares(m => m.before("intercept", async ctx => ctx)).request()
export type A1 = Expect<Equal<typeof a1, 1>>
const a2 = await retry.middlewares(m => m.after("intercept", async ctx => ctx)).request()
export type A2 = Expect<Equal<typeof a2, 1>>
const a3 = await retry.middlewares(m => m.onResult("intercept", async ctx => ctx)).request()
export type A3 = Expect<Equal<typeof a3, 1>>
const a4 = await retry.middlewares(m => m.retryIf("intercept", async ctx => ctx).onRetry("intercept", async ctx => ctx).onError("intercept", async ctx => ctx)).request()
export type A4 = Expect<Equal<typeof a4, 1>>
const a5 = await parse.middlewares(m => m.before("intercept", async ctx => ctx).after("intercept", async ctx => ctx).onResult("intercept", async ctx => ctx).onError("intercept", async ctx => ctx)).request()
export type A5 = Expect<Equal<typeof a5, { p: 1 }>>
const a6 = await fetch.middlewares(m => m.before("intercept", async ctx => ctx).after("intercept", async ctx => ctx).onResult("intercept", async ctx => ctx).onError("intercept", async ctx => ctx)).request()
export type A6 = Expect<Equal<typeof a6, { f: 1 }>>
const a7 = await all.middlewares(m => m.before("intercept", async ctx => ctx).after("intercept", async ctx => ctx).onResult("intercept", async ctx => ctx)).request()
export type A7 = Expect<Equal<typeof a7, [import("../src/index").VigorAllSettled<1>]>>
// A fluent `onResult` is awaited too.
const a8 = await retry.middlewares(m => m.onResult("fluent", async r => [r] as const)).request()
export type A8 = Expect<Equal<typeof a8, readonly [1]>>

// ============================================================================
// a middleware registered early doesn't freeze the result at that point
// ============================================================================

// Returning `ctx` changes nothing, so config set later still decides the result.
const e1 = await vigor.fetch("https://x").middlewares(m => m.onError("intercept", ctx => ctx)).cast<{ c: 1 }>().request()
export type E1 = Expect<Equal<typeof e1, { c: 1 }>>
const e2 = await vigor.fetch("https://x").middlewares(m => m.onError("intercept", ctx => ctx)).apiMap<Api>().path("u").request()
export type E2 = Expect<Equal<typeof e2, { id: number }>>
const e3 = await vigor.retry().middlewares(m => m.onError("intercept", ctx => ctx).after("intercept", ctx => ctx)).target(async () => 1 as const).request()
export type E3 = Expect<Equal<typeof e3, 1>>
const e4 = await vigor.parse(resp).middlewares(m => m.before("intercept", ctx => ctx)).cast<"late">().request()
export type E4 = Expect<Equal<typeof e4, "late">>
// ...and an `onResult` registered after it isn't undone.
const e5 = await vigor.fetch("https://x").apiMap<Api>().path("u")
    .middlewares(m => m.onError("intercept", ctx => ctx).after("intercept", async ctx => ctx))
    .middlewares(m => m.onResult("fluent", r => r.id))
    .request()
export type E5 = Expect<Equal<typeof e5, number>>

// ============================================================================
// a returned context overwrites what it changed
// ============================================================================

// `result` changed in `onResult`/`after`: that's the result.
const o1 = await retry.middlewares(m => m.onResult("intercept", ctx => ({ ...ctx, result: "changed" as const }))).request()
export type O1 = Expect<Equal<typeof o1, "changed">>
const o2 = await fetch.middlewares(m => m.after("intercept", async ctx => ({ ...ctx, result: 5 as const }))).request()
export type O2 = Expect<Equal<typeof o2, 5>>
// ...and the next `onResult` sees it.
fetch.middlewares(m => m
    .after("intercept", ctx => ({ ...ctx, result: 5 as const }))
    .onResult("fluent", r => {
        const check: Expect<Equal<typeof r, 5>> = true
        return r
    }))
// `result` changed in `before` is reset: the runtime sets it from the target/parse.
const o3 = await retry.middlewares(m => m.before("intercept", ctx => ({ ...ctx, result: "ignored" as const }))).request()
export type O3 = Expect<Equal<typeof o3, 1>>
// Any other key changed carries over to the later stages.
retry.middlewares(m => m
    .before("intercept", ctx => ({ ...ctx, record: { traceId: "t" as string } }))
    .after("fluent", ctx => {
        const check: Expect<Equal<typeof ctx.record, { traceId: string }>> = true
    })
    .onResult("intercept", ctx => {
        const check: Expect<Equal<typeof ctx.record, { traceId: string }>> = true
        return ctx
    }))
fetch.middlewares(m => m
    .before("intercept", async ctx => ({ ...ctx, record: { n: 1 as const } }))
    .after("intercept", ctx => {
        const check: Expect<Equal<typeof ctx.record, { n: 1 }>> = true
        return ctx
    }))
// Within a stage, a later middleware sees an earlier one's change.
retry.middlewares(m => m
    .retryIf("intercept", ctx => ({ ...ctx, record: { seen: true as const } }))
    .onRetry("intercept", ctx => {
        const check: Expect<Equal<typeof ctx.record, { seen: true }>> = true
        return ctx
    }))
// A fluent `after` returns nothing, so it leaves the result alone.
const o4 = await fetch.middlewares(m => m.after("fluent", ctx => { })).request()
export type O4 = Expect<Equal<typeof o4, { f: 1 }>>
const o5 = await parse.middlewares(m => m.after("fluent", async ctx => { })).request()
export type O5 = Expect<Equal<typeof o5, { p: 1 }>>

// `onError` changing `result` is what a recovered run resolves to, next to the success result.
const o6 = await retry.middlewares(m => m.onError("intercept", (ctx, api) => {
    api.setResult("recovered")
    return { ...ctx, result: "recovered" as const }
})).request()
export type O6 = Expect<Equal<typeof o6, 1 | "recovered">>
export async function recoveredVerbose() {
    const v = await fetch.middlewares(m => m.onError("intercept", ctx => ({ ...ctx, result: null }))).requestVerbose()
    if (v.success && v.status === null) {
        const data: Expect<Equal<typeof v.data, null>> = true
    }
}

// The stages' own runtime view: `after` has the response, `before` has no result.
fetch.middlewares(m => m
    .before("intercept", ctx => {
        const check: Expect<Equal<typeof ctx.result, VigorDefaultType>> = true
        return ctx
    })
    .after("intercept", ctx => {
        const check: Expect<Equal<typeof ctx.response, Response>> = true
        return ctx
    }))
