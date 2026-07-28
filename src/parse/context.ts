import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorParsePolicyBase } from "./policy"
import type { VigorParsePolicySchema, VigorParseSchema } from "./main"
import type { VigorParsePipeInitialContext, VigorParsePipeResult, VigorParsePipeStepVoid, VigorParsePipeStepResult } from "./middlewares"

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
        overrided: boolean
        restarted: boolean
    },
    record: Record<string, any>,
    policy: T["policy"]
}

/** Context shape seen by `before` middlewares — parsing hasn't run yet. */
export type VigorParseBeforeContextSchema<
    T extends VigorParseSchema<T>
> = VigorParseContextSchema<T, VigorDefaultType>

/** Context shape seen by `after` middlewares — reflects the result after `before` has run. */
export type VigorParseAfterContextSchema<
    T extends VigorParseSchema<T>
> = VigorParsePipeStepResult<
    VigorParsePipeStepVoid<
        VigorParsePipeInitialContext<T>,
        T["policy"]["middlewares"]["before"]
    >,
    T["policy"]["middlewares"]["after"]
>

/** Context shape seen by `onResult` middlewares — additionally threads any `onResult` middlewares already registered earlier in the same chain, so `ctx.result` reflects what the previous `onResult` returned. */
export type VigorParseOnResultContextSchema<
    T extends VigorParseSchema<T>
> = VigorParsePipeStepResult<
    VigorParseAfterContextSchema<T>,
    T["policy"]["middlewares"]["onResult"]
>

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
        overrided: false,
        restarted: false
    },
    record: {},
    policy: VigorParsePolicyBase
} as const satisfies VigorParseContextSchema<any>