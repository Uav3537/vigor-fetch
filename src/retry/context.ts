import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorRetryPolicyBase } from "./policy"
import type { VigorRetrySchema } from "./main"
import type { VigorRetryPipeInitialContext, VigorRetryPipeResult, VigorRetryPipeStepVoid, VigorRetryPipeStepResult } from "./middlewares"

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
        brokeRetry: boolean
        overridden: boolean
    },
    record: Record<string, any>,
    policy: T["policy"]
}

/** Context shape seen by `before` middlewares — the target hasn't run yet, so there's no result. */
export type VigorRetryBeforeContextSchema<
    T extends VigorRetrySchema<T>
> = VigorRetryContextSchema<T, VigorDefaultType>

/** Context shape seen by `after` middlewares — reflects the result after `before` has run. */
export type VigorRetryAfterContextSchema<
    T extends VigorRetrySchema<T>
> = VigorRetryPipeStepResult<
    VigorRetryPipeStepVoid<
        VigorRetryPipeInitialContext<T>,
        T["policy"]["middlewares"]["before"]
    >,
    T["policy"]["middlewares"]["after"]
>

/** Context shape seen by `onResult` middlewares — additionally threads any `onResult` middlewares already registered earlier in the same chain, so `ctx.result` reflects what the previous `onResult` returned. */
export type VigorRetryOnResultContextSchema<
    T extends VigorRetrySchema<T>
> = VigorRetryPipeStepResult<
    VigorRetryAfterContextSchema<T>,
    T["policy"]["middlewares"]["onResult"]
>

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
        overridden: false
    },
    record: {},
    policy: VigorRetryPolicyBase
} as const satisfies VigorRetryContextSchema<any>
