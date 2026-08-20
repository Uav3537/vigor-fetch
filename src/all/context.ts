import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorAllPolicyBase } from "./policy"
import type { VigorAllSchema } from "./main"
import type { VigorAllPipeInitialContext, VigorAllPipeResult, VigorAllPipeStepVoid, VigorAllPipeStepResult } from "./middlewares"
import type { VigorDeepMerge } from "@core/types"

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
}

/** Context shape seen by `before` middlewares — no task has run yet. */
export type VigorAllBeforeContextSchema<
    T extends VigorAllSchema<T>
> = VigorAllContextSchema<T, VigorDefaultType>

/** Context shape seen by `after` middlewares — every task has settled, reflecting whatever `before` changed. */
export type VigorAllAfterContextSchema<
    T extends VigorAllSchema<T>
> = VigorDeepMerge<
    VigorAllPipeStepVoid<
        VigorAllPipeInitialContext<T>,
        T["policy"]["middlewares"]["before"]
    >,
    // before -> 모든 태스크 실행 -> after 순서이므로, after 시작 시점의 result는
    // before가 무엇을 리턴했든 실제 집계 결과 타입으로 재설정되어야 한다.
    { result: VigorAllPipeInitialContext<T>["result"] }
>

/** Context shape seen by `onResult` middlewares — additionally threads any `onResult` middlewares already registered earlier in the same chain, so `ctx.result` reflects what the previous `onResult` returned. */
export type VigorAllOnResultContextSchema<
    T extends VigorAllSchema<T>
> = VigorAllPipeStepResult<
    VigorAllPipeStepVoid<
        VigorAllAfterContextSchema<T>,
        T["policy"]["middlewares"]["after"]
    >,
    T["policy"]["middlewares"]["onResult"]
>

/** Context shape once the full batch-level pipeline (`before`/`after`/`onResult`) has run. */
export type VigorAllResultContextSchema<
    T extends VigorAllSchema<T>
> = VigorAllContextSchema<T, VigorAllPipeResult<T>>

export const VigorAllContextBase = {
    __brand: createBrand("All", "Context<Schema"),

    result: VigorDefault,
    policy: VigorAllPolicyBase,
    record: {}
} as const satisfies VigorAllContextSchema<any>

/** Per-task context, seen by `beforeEach` / `afterEach` / `onErrorEach`. */
export type VigorAllEachContextSchema<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "EachContext<Schema">

    result: unknown | VigorDefaultType
    error: unknown
    flags: { overrided: boolean }
    record: Record<string, any>
}

export const VigorAllEachContextBase = {
    __brand: createBrand("All", "EachContext<Schema"),

    result: VigorDefault,
    error: VigorDefault,
    flags: { overrided: false },
    record: {}
} as const satisfies VigorAllEachContextSchema<any>