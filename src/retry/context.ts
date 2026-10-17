import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorRetryPolicyBase } from "./policy"
import type { VigorRetrySchema } from "./main"
import type { VigorRetryPipeResult } from "./middlewares"
import type { VigorCastResult, VigorContextReset, VigorContextStage, VigorReturnType } from "@core/types"
import type { VigorRetryTimeline } from "./timeline"

/**
 * Base shape shared by every retry context variant. `R` is the type of
 * `result` at the point the context is observed — it differs by pipeline
 * stage (before / after / onResult / ...), so callers plug in whichever
 * `R` matches where they are in the pipeline instead of this being fixed
 * on the schema.
 */
export type VigorRetryContextSchema<
    T extends VigorRetrySchema<T>,
    R = VigorRetryPipeResult<T> | VigorDefaultType
> = {
    __brand: VigorBrand<"Retry", "Context<Schema">

    result: R
    error: unknown
    system: {
        delay: number|VigorDefaultType
        attempt: number
    }
    flags: {
        doRetry: boolean
        doRestart: boolean
        /** `breakRetry()` was called: the attempt's error ends the run without retrying. */
        brokeRetry: boolean
        /** An external abort signal fired: the run stops without retrying. */
        aborted: boolean
        /** The current attempt hit `settings.timeout`. Reset at the start of every attempt. */
        timedOut: boolean
        overridden: boolean
    },
    record: Record<string, any>,
    /** Everything this `requestVerbose()` call has gone through so far, restarts included. */
    timeline: VigorRetryTimeline,
    policy: T["policy"]
}

/** The result before any middleware: `.cast<T>()`'s, else the target's return type. */
export type VigorRetryNaturalResult<
    T extends VigorRetrySchema<T>
> = VigorCastResult<T["cast"], VigorReturnType<T["policy"]["target"]>>

/**
 * Context seen by `before` middlewares — the target hasn't run yet, so
 * there's no result.
 *
 * Each stage's context is defined on its own — the runtime's view at that
 * point — with whatever the stage's earlier intercept middlewares changed by
 * returning a different context (see `VigorContextStage`).
 */
export type VigorRetryBeforeContextSchema<
    T extends VigorRetrySchema<T>
> = VigorContextStage<VigorRetryContextSchema<T, VigorDefaultType>, T["policy"]["middlewares"]["before"]>

/** Context seen by `after` middlewares — `result` is the target's; what `before` changed otherwise carries over. */
export type VigorRetryAfterContextSchema<
    T extends VigorRetrySchema<T>
> = VigorContextStage<
    VigorContextReset<VigorRetryBeforeContextSchema<T>, { result: VigorRetryNaturalResult<T> }>,
    T["policy"]["middlewares"]["after"]
>

/** Context seen by `onResult` middlewares — `ctx.result` is what the earlier `onResult` ones left it as. */
export type VigorRetryOnResultContextSchema<
    T extends VigorRetrySchema<T>
> = VigorContextStage<VigorRetryAfterContextSchema<T>, T["policy"]["middlewares"]["onResult"], "result">

/** Context seen by `retryIf` middlewares — an attempt failed. */
export type VigorRetryRetryIfContextSchema<
    T extends VigorRetrySchema<T>
> = VigorContextStage<VigorRetryContextSchema<T>, T["policy"]["middlewares"]["retryIf"]>

/** Context seen by `onRetry` middlewares — `retryIf` decided to retry. */
export type VigorRetryOnRetryContextSchema<
    T extends VigorRetrySchema<T>
> = VigorContextStage<VigorRetryRetryIfContextSchema<T>, T["policy"]["middlewares"]["onRetry"]>

/** Context seen by `onError` middlewares — the run failed. */
export type VigorRetryOnErrorContextSchema<
    T extends VigorRetrySchema<T>
> = VigorContextStage<VigorRetryContextSchema<T>, T["policy"]["middlewares"]["onError"]>

/** Context shape once the full middleware pipeline (including `onResult`) has run. */
export type VigorRetryResultContextSchema<
    T extends VigorRetrySchema<T>
> = VigorRetryContextSchema<T, VigorRetryPipeResult<T>>

export const VigorRetryContextBase = {
    __brand: createBrand("Retry", "Context<Schema"),
    
    result: VigorDefault,
    error: VigorDefault,
    system: {
        delay: VigorDefault,
        attempt: 0
    },
    flags: {
        doRetry: true,
        doRestart: false,
        brokeRetry: false,
        aborted: false,
        timedOut: false,
        overridden: false
    },
    record: {},
    timeline: [] as VigorRetryTimeline,
    policy: VigorRetryPolicyBase
} as const satisfies VigorRetryContextSchema<any>