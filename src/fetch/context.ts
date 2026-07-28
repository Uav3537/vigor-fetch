import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorFetchPolicyBase } from "./policy"
import type { VigorFetchSchema } from "./main"
import { VigorFetchPipeInitialContext, VigorFetchPipeResult, VigorFetchPipeStepVoid, VigorFetchPipeStepResult } from "./middlewares"

export type VigorFetchExtraOptions = Omit<RequestInit, "method" | "headers" | "body" | "signal">

export type VigorFetchOptions = VigorFetchExtraOptions & {
    method?: "GET"|"POST"|"PUT"|"PATCH"|"DELETE"|"HEAD"|"OPTIONS"|"CONNECT"|"TRACE"
    headers: Record<string, string>
    body?: BodyInit | null
    signal?: AbortSignal
}

/**
 * Base shape shared by every fetch context variant. `R` is the type of
 * `result` at the point the context is observed — computed per pipeline
 * stage instead of being fixed on the schema.
 */
export type VigorFetchContextSchema<
    T extends VigorFetchSchema<T>,
    R = VigorFetchPipeResult<T> | VigorDefaultType
> = {
    __brand: VigorBrand<"Fetch", "Context<Schema">

    href: string
    response: Response | VigorDefaultType
    result: R
    error: unknown
    options: VigorFetchOptions | VigorDefaultType
    flags: {
        overridden: boolean
        restarted: boolean
    },
    record: Record<string, any>,
    policy: T["policy"]
}

/** Context shape seen by `before` middlewares — the request hasn't been sent yet. */
export type VigorFetchBeforeContextSchema<
    T extends VigorFetchSchema<T>
> = VigorFetchContextSchema<T, VigorDefaultType>

/** Context shape seen by `after` middlewares — reflects the result after `before` has run. */
export type VigorFetchAfterContextSchema<
    T extends VigorFetchSchema<T>
> = VigorFetchPipeStepResult<
    VigorFetchPipeStepVoid<
        VigorFetchPipeInitialContext<T>,
        T["policy"]["middlewares"]["before"]
    >,
    T["policy"]["middlewares"]["after"]
>

/** Context shape seen by `onResult` middlewares — additionally threads any `onResult` middlewares already registered earlier in the same chain, so `ctx.result` reflects what the previous `onResult` returned. */
export type VigorFetchOnResultContextSchema<
    T extends VigorFetchSchema<T>
> = VigorFetchPipeStepResult<
    VigorFetchAfterContextSchema<T>,
    T["policy"]["middlewares"]["onResult"]
>

/** Context shape once the full middleware pipeline (including `onResult`) has run. */
export type VigorFetchResultContextSchema<
    T extends VigorFetchSchema<T>
> = VigorFetchContextSchema<T, VigorFetchPipeResult<T>>

export const VigorFetchContextBase = {
    __brand: createBrand("Fetch", "Context<Schema"),

    href: "",
    response: VigorDefault,
    result: VigorDefault,
    error: VigorDefault,
    options: VigorDefault,
    flags: {
        overridden: false,
        restarted: false
    },
    record: {},
    policy: VigorFetchPolicyBase
} as const satisfies VigorFetchContextSchema<any>
