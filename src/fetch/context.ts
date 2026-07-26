import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorCastResult } from "@core/types"
import { VigorFetchPolicyBase } from "./policy"
import type { VigorFetchSchema } from "./main"

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
    R = VigorCastResult<T["cast"], unknown> | VigorDefaultType
> = {
    __brand: VigorBrand<"Fetch", "Context<Schema">

    href: string
    response: Response | VigorDefaultType
    result: R
    error: unknown
    options: VigorFetchOptions | VigorDefaultType
    flags: {
        overrided: boolean
        restarted: boolean
    },
    record: Record<string, any>,
    policy: T["policy"]
}

/** Context shape seen by `before` middlewares — the request hasn't been sent yet. */
export type VigorFetchBeforeContextSchema<
    T extends VigorFetchSchema<T>
> = VigorFetchContextSchema<T, VigorDefaultType>

/** Context shape seen by `after` / `onResult` middlewares — a response has been received/parsed. */
export type VigorFetchAfterContextSchema<
    T extends VigorFetchSchema<T>
> = VigorFetchContextSchema<T, VigorCastResult<T["cast"], unknown> | VigorDefaultType>

/** Context shape once the full middleware pipeline (including `onResult`) has run. */
export type VigorFetchResultContextSchema<
    T extends VigorFetchSchema<T>
> = VigorFetchContextSchema<T, VigorCastResult<T["cast"], unknown>>

export const VigorFetchContextBase = {
    __brand: createBrand("Fetch", "Context<Schema"),

    href: "",
    response: VigorDefault,
    result: VigorDefault,
    error: VigorDefault,
    options: VigorDefault,
    flags: {
        overrided: false,
        restarted: false
    },
    record: {},
    policy: VigorFetchPolicyBase
} as const satisfies VigorFetchContextSchema<any>
