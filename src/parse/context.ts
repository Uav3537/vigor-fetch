import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorParsePolicyBase } from "./policy"
import type { VigorParsePolicySchema, VigorParseSchema } from "./main"
import type { VigorParsePipeResult } from "./middlewares"
import type { VigorCastResult, VigorContextReset, VigorContextStage } from "@core/types"
import type { VigorExcludeDefault } from "@core/symbol"
import type { VigorParseTimeline } from "./timeline"

/**
 * Base shape shared by every parse context variant. `R` is the type of
 * `result` at the point the context is observed — computed per pipeline
 * stage instead of being fixed on the schema. Threads the configured
 * middleware pipeline (see `./middlewares`) so fluent `after`/`onResult`
 * middlewares narrow the resolved type, taking priority from `.cast<T>()`
 * when set.
 */
export type VigorParseContextSchema<
    T extends VigorParseSchema<T>,
    R = VigorParsePipeResult<T> | VigorDefaultType
> = {
    __brand: VigorBrand<"Parse", "Context<Schema">

    result: R
    error: unknown
    response: VigorParsePolicySchema<T>["target"]
    flags: {
        overridden: boolean
        restarted: boolean
    },
    record: Record<string, any>,
    /** Everything this `requestVerbose()` call has gone through so far, restarts included. */
    timeline: VigorParseTimeline,
    policy: T["policy"]
}

/** The result before any middleware: a `raw` parse's target, else `.cast<T>()`'s (`unknown` without one). */
export type VigorParseNaturalResult<
    T extends VigorParseSchema<T>
> = T["policy"]["settings"]["raw"] extends true
    ? VigorExcludeDefault<T["policy"]["target"]>
    : VigorCastResult<T["cast"], unknown>

/**
 * Context seen by `before` middlewares — parsing hasn't run yet.
 *
 * Each stage's context is defined on its own — the runtime's view at that
 * point — with whatever the stage's earlier intercept middlewares changed by
 * returning a different context (see `VigorContextStage`).
 */
export type VigorParseBeforeContextSchema<
    T extends VigorParseSchema<T>
> = VigorContextStage<VigorParseContextSchema<T, VigorDefaultType>, T["policy"]["middlewares"]["before"]>

/** Context seen by `after` middlewares — `result` is the parsed one; what `before` changed otherwise carries over. */
export type VigorParseAfterContextSchema<
    T extends VigorParseSchema<T>
> = VigorContextStage<
    VigorContextReset<VigorParseBeforeContextSchema<T>, { result: VigorParseNaturalResult<T> }>,
    T["policy"]["middlewares"]["after"]
>

/** Context seen by `onResult` middlewares — `ctx.result` is what the earlier `onResult` ones left it as. */
export type VigorParseOnResultContextSchema<
    T extends VigorParseSchema<T>
> = VigorContextStage<VigorParseAfterContextSchema<T>, T["policy"]["middlewares"]["onResult"], "result">

/** Context seen by `onError` middlewares — every strategy failed (or a middleware threw). */
export type VigorParseOnErrorContextSchema<
    T extends VigorParseSchema<T>
> = VigorContextStage<VigorParseContextSchema<T>, T["policy"]["middlewares"]["onError"]>

/** Context shape once the full middleware pipeline (including `onResult`) has run. */
export type VigorParseResultContextSchema<
    T extends VigorParseSchema<T>
> = VigorParseContextSchema<T, VigorParsePipeResult<T>>

export const VigorParseContextBase = {
    __brand: createBrand("Parse", "Context<Schema"),

    result: VigorDefault,
    error: VigorDefault,
    response: VigorDefault,
    flags: {
        overridden: false,
        restarted: false
    },
    record: {},
    timeline: [] as VigorParseTimeline,
    policy: VigorParsePolicyBase
} as const satisfies VigorParseContextSchema<any>