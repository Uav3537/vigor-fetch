import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorAllPolicyBase } from "./policy"
import type { VigorAllSchema } from "./main"

export type VigorAllContextSchema<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "Context<Schema">

    result: unknown[] | VigorDefaultType
    policy: T["policy"]
    record: Record<string, any>
}

export const VigorAllContextBase = {
    __brand: createBrand("All", "Context<Schema"),

    result: VigorDefault,
    policy: VigorAllPolicyBase,
    record: {}
} as const satisfies VigorAllContextSchema<any>

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
