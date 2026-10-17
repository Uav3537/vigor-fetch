import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorAllPolicyBase } from "./policy"
import type { VigorAllSchema } from "./main"
import type { VigorAllPipeResult } from "./middlewares"
import type { VigorCastResult, VigorContextReset, VigorContextStage } from "@core/types"
import type { VigorAllNaturalResult } from "./policy"
import type { VigorAllTimeline } from "./timeline"

/**
 * Base shape shared by every batch-level `all` context variant. `R` is the
 * type of `result` at the point the context is observed — computed per
 * pipeline stage instead of being fixed on the schema.
 */
export type VigorAllContextSchema<
    T extends VigorAllSchema<T>,
    R = VigorAllPipeResult<T> | VigorDefaultType
> = {
    __brand: VigorBrand<"All", "Context<Schema">

    result: R
    policy: T["policy"]
    record: Record<string, any>
    /** Everything this `requestVerbose()` call has gone through so far. */
    timeline: VigorAllTimeline
}

/** The result before any batch-level middleware: `.cast<T>()`'s, else the tasks' outcomes. */
export type VigorAllCastNaturalResult<
    T extends VigorAllSchema<T>
> = VigorCastResult<T["cast"], VigorAllNaturalResult<T>>

/**
 * Context seen by `before` middlewares — no task has run yet.
 *
 * Each stage's context is defined on its own — the runtime's view at that
 * point — with whatever the stage's earlier intercept middlewares changed by
 * returning a different context (see `VigorContextStage`).
 */
export type VigorAllBeforeContextSchema<
    T extends VigorAllSchema<T>
> = VigorContextStage<VigorAllContextSchema<T, VigorDefaultType>, T["policy"]["middlewares"]["before"]>

/** Context seen by `after` middlewares — every task has settled; what `before` changed otherwise carries over. */
export type VigorAllAfterContextSchema<
    T extends VigorAllSchema<T>
> = VigorContextStage<
    VigorContextReset<VigorAllBeforeContextSchema<T>, { result: VigorAllCastNaturalResult<T> }>,
    T["policy"]["middlewares"]["after"]
>

/** Context seen by `onResult` middlewares — `ctx.result` is what the earlier `onResult` ones left it as. */
export type VigorAllOnResultContextSchema<
    T extends VigorAllSchema<T>
> = VigorContextStage<VigorAllAfterContextSchema<T>, T["policy"]["middlewares"]["onResult"], "result">

/** Context shape once the full batch-level pipeline (`before`/`after`/`onResult`) has run. */
export type VigorAllResultContextSchema<
    T extends VigorAllSchema<T>
> = VigorAllContextSchema<T, VigorAllPipeResult<T>>

export const VigorAllContextBase = {
    __brand: createBrand("All", "Context<Schema"),

    result: VigorDefault,
    policy: VigorAllPolicyBase,
    record: {},
    timeline: [] as VigorAllTimeline
} as const satisfies VigorAllContextSchema<any>

/** Per-task context, seen by `beforeEach` / `afterEach` / `onErrorEach`. */
export type VigorAllEachContextSchema<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "EachContext<Schema">

    /** Position of this task in the `target` list. */
    index: number
    result: unknown | VigorDefaultType
    error: unknown
    flags: { overridden: boolean }
    record: Record<string, any>
}

export const VigorAllEachContextBase = {
    __brand: createBrand("All", "EachContext<Schema"),

    index: 0,
    result: VigorDefault,
    error: VigorDefault,
    flags: { overridden: false },
    record: {}
} as const satisfies VigorAllEachContextSchema<any>