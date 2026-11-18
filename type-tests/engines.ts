/**
 * fetch's `.retry()` / `.parse()`: each form starts from the current engine
 * config (the defaults until set) and merges into it; an instance replaces it.
 */
import vigor, { VigorParse, VigorRetry } from "../src/index"

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
type Expect<T extends true> = T

const base = vigor.fetch("https://x")
type RetrySettings<B extends { config: { policy: { retry: any } } }> = B["config"]["policy"]["retry"]["policy"]["settings"]
type RetryAlgorithm<B extends { config: { policy: { retry: any } } }> = B["config"]["policy"]["retry"]["policy"]["algorithms"]["_tag"]
type ParseSettings<B extends { config: { policy: { parse: any } } }> = B["config"]["policy"]["parse"]["policy"]["settings"]

// ---- retry: callback ----
// The callback's builder holds the current config.
base.retry(r => r).retry(r => {
    type _D = Expect<Equal<typeof r.config.policy.settings.maxAttempts, 5>>
    return r
})
const rc = base.retry(r => r.settings({ maxAttempts: 8 })).retry(r => {
    type _C = Expect<Equal<typeof r.config.policy.settings.maxAttempts, 8>>
    return r.settings({ timeout: 100 })
})
export type RC1 = Expect<Equal<RetrySettings<typeof rc>["maxAttempts"], 8>>
export type RC2 = Expect<Equal<RetrySettings<typeof rc>["timeout"], 100>>
// Defaults stay where nothing was set.
export type RC3 = Expect<Equal<RetrySettings<typeof rc>["maxRestarts"], 3>>

// ---- retry: config object ----
const ro = base.retry({ policy: { settings: { maxAttempts: 8 } } }).retry({ policy: { settings: { timeout: 100 } } })
export type RO1 = Expect<Equal<RetrySettings<typeof ro>["maxAttempts"], 8>>
export type RO2 = Expect<Equal<RetrySettings<typeof ro>["timeout"], 100>>
export type RO3 = Expect<Equal<RetrySettings<typeof ro>["maxRestarts"], 3>>
// The two forms combine.
const rm = base.retry(r => r.settings({ maxAttempts: 8 })).retry({ policy: { settings: { timeout: 100 } } })
export type RM1 = Expect<Equal<RetrySettings<typeof rm>["maxAttempts"], 8>>
export type RM2 = Expect<Equal<RetrySettings<typeof rm>["timeout"], 100>>
// The algorithm is replaced whole, not merged with the previous one.
const ra = base.retry(r => r.algorithms(a => a.linear())).retry(r => r.algorithms(a => a.constant()))
export type RA1 = Expect<Equal<RetryAlgorithm<typeof ra>, "constant">>
// @ts-expect-error  typo inside the config object
base.retry({ policy: { settings: { maxAtempts: 8 } } })

// ---- retry: instance ----
// A complete engine: replaces what was set before.
const ri = base.retry(r => r.settings({ maxAttempts: 8 })).retry(new VigorRetry().settings({ timeout: 100 }))
export type RI1 = Expect<Equal<RetrySettings<typeof ri>["maxAttempts"], 5>>
export type RI2 = Expect<Equal<RetrySettings<typeof ri>["timeout"], 100>>

// ---- parse ----
const pc = base.parse(p => p.settings({ raw: true })).parse(p => {
    type _C = Expect<Equal<typeof p.config.policy.settings.raw, true>>
    return p.settings({ maxRestarts: 1 })
})
export type PC1 = Expect<Equal<ParseSettings<typeof pc>["raw"], true>>
export type PC2 = Expect<Equal<ParseSettings<typeof pc>["maxRestarts"], 1>>
// A cast set earlier survives a later parse call.
const pcast = base.parse(p => p.cast<{ id: number }>()).parse(p => p.settings({ maxRestarts: 1 }))
const pcastResult = await pcast.request()
export type PCast = Expect<Equal<typeof pcastResult, { id: number }>>
const po = base.parse({ policy: { settings: { raw: true } } }).parse({ policy: { settings: { maxRestarts: 1 } } })
export type PO1 = Expect<Equal<ParseSettings<typeof po>["raw"], true>>
export type PO2 = Expect<Equal<ParseSettings<typeof po>["maxRestarts"], 1>>
const pi = base.parse(p => p.settings({ raw: true })).parse(new VigorParse())
export type PI1 = Expect<Equal<ParseSettings<typeof pi>["raw"], false>>
