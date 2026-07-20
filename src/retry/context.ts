import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorRetryPolicyBase } from "./policy"
import type { VigorRetrySchema } from "./main"
import { VigorRetryPipeResult } from "./middlewares"

export type VigorRetryContextSchema<
    T extends VigorRetrySchema<T>
> = {
    __brand: VigorBrand<"Retry", "Context<Schema">

    result: VigorRetryPipeResult<T> | VigorDefaultType
    error: unknown
    system: {
        delay: number|VigorDefaultType
        attempt: number
    }
    flags: {
        doRetry: boolean
        doRestart: boolean
        brokeRetry: boolean
        overridden: boolean
    },
    record: Record<string, any>,
    policy: T["policy"]
}

export const VigorRetryContextBase = {
    __brand: createBrand("Retry", "Context<Schema"),
    
    result: VigorDefault,
    error: VigorDefault,
    system: {
        delay: VigorDefault,
        attempt: 0
    },
    flags: {
        doRetry: true,
        doRestart: false,
        brokeRetry: false,
        overridden: false
    },
    record: {},
    policy: VigorRetryPolicyBase
} as const satisfies VigorRetryContextSchema<any>