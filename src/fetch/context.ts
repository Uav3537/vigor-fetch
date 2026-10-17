import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorFetchPolicyBase } from "./policy"
import type { VigorFetchSchema } from "./main"
import type { VigorFetchNaturalResult, VigorFetchPipeResult } from "./middlewares"
import type { VigorCastResult, VigorContextReset, VigorContextStage } from "@core/types"
import type { VigorFetchTimeline } from "./timeline"

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
    /** Everything this `requestVerbose()` call has gone through so far, restarts included. */
    timeline: VigorFetchTimeline,
    policy: T["policy"]
}

/**
 * Context seen by `before` middlewares — the request hasn't been sent yet.
 *
 * Each stage's context is defined on its own — the runtime's view at that
 * point — with whatever the stage's earlier intercept middlewares changed by
 * returning a different context (see `VigorContextStage`).
 */
export type VigorFetchBeforeContextSchema<
    T extends VigorFetchSchema<T>
> = VigorContextStage<VigorFetchContextSchema<T, VigorDefaultType>, T["policy"]["middlewares"]["before"]>

/**
 * Context seen by `after` middlewares — `response` and the parsed `result`
 * are set; what `before` changed otherwise carries over. `Natural` is the
 * result before `.cast<T>()` (one API-map status's, when followed per status).
 */
export type VigorFetchAfterContextSchema<
    T extends VigorFetchSchema<T>,
    Natural = VigorFetchNaturalResult<T>
> = VigorContextStage<
    VigorContextReset<VigorFetchBeforeContextSchema<T>, { result: VigorCastResult<T["cast"], Natural>, response: Response }>,
    T["policy"]["middlewares"]["after"]
>

/** Context seen by `onResult` middlewares — `ctx.result` is what the earlier `onResult` ones left it as. */
export type VigorFetchOnResultContextSchema<
    T extends VigorFetchSchema<T>,
    Natural = VigorFetchNaturalResult<T>
> = VigorContextStage<VigorFetchAfterContextSchema<T, Natural>, T["policy"]["middlewares"]["onResult"], "result">

/** Context seen by `onError` middlewares — the request failed. */
export type VigorFetchOnErrorContextSchema<
    T extends VigorFetchSchema<T>
> = VigorContextStage<VigorFetchContextSchema<T>, T["policy"]["middlewares"]["onError"]>

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
    timeline: [] as VigorFetchTimeline,
    policy: VigorFetchPolicyBase
} as const satisfies VigorFetchContextSchema<any>