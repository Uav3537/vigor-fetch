import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorCastResult } from "@core/types"
import { VigorParsePolicyBase } from "./policy"
import type { VigorParsePolicySchema, VigorParseSchema } from "./main"

/**
 * Base shape shared by every parse context variant. `R` is the type of
 * `result` at the point the context is observed — computed per pipeline
 * stage instead of being fixed on the schema.
 */
export type VigorParseContextSchema<
    T extends VigorParseSchema<T>,
    R = VigorCastResult<T["cast"], unknown> | VigorDefaultType
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

/** Context shape seen by `after` / `onResult` middlewares — a result has been produced. */
export type VigorParseAfterContextSchema<
    T extends VigorParseSchema<T>
> = VigorParseContextSchema<T, VigorCastResult<T["cast"], unknown>>

/** Context shape once the full middleware pipeline (including `onResult`) has run. */
export type VigorParseResultContextSchema<
    T extends VigorParseSchema<T>
> = VigorParseContextSchema<T, VigorCastResult<T["cast"], unknown>>

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
