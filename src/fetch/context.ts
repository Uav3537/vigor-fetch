import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorFetchPolicyBase } from "./policy"
import type { VigorFetchSchema } from "./main"

export type VigorFetchExtraOptions = Omit<RequestInit, "method" | "headers" | "body" | "signal">

export type VigorFetchOptions = VigorFetchExtraOptions & {
    method?: "GET"|"POST"|"PUT"|"PATCH"|"DELETE"|"HEAD"|"OPTIONS"|"CONNECT"|"TRACE"
    headers: Record<string, string>
    body?: BodyInit | null
    signal?: AbortSignal
}

export type VigorFetchContextSchema<
    T extends VigorFetchSchema<T>
> = {
    __brand: VigorBrand<"Fetch", "Context<Schema">

    href: string
    response: Response | VigorDefaultType
    result: unknown | VigorDefaultType
    error: unknown
    options: VigorFetchOptions | VigorDefaultType
    flags: {
        overrided: boolean
        restarted: boolean
    },
    record: Record<string, any>,
    policy: T["policy"]
}

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
