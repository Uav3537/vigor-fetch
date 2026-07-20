import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorParsePolicyBase } from "./policy"
import type { VigorParsePolicySchema, VigorParseSchema } from "./main"

export type VigorParseContextSchema<
    T extends VigorParseSchema<T>
> = {
    __brand: VigorBrand<"Parse", "Context<Schema">

    result: unknown | VigorDefaultType
    error: unknown
    response: VigorParsePolicySchema<T>["target"]
    flags: {
        overrided: boolean
        restarted: boolean
    },
    record: Record<string, any>,
    policy: T["policy"]
}

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
