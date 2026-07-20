import { createBrand, VigorBrand, VigorEmpty, VigorEmptyType } from "@core/symbol"
import { VigorRetryPolicySettingsBase, VigorRetryPolicySettingsSchema } from "./settings"
import { VigorRetryPolicyMiddlewaresBase, VigorRetryPolicyMiddlewaresSchema } from "./middlewares"
import { VigorRetryPolicyAlgorithmsBase, VigorRetryPolicyAlgorithmsSchema } from "./algorithms"
import type { VigorRetrySchema } from "./main"

export type VigorRetryPolicySchema<
    T extends VigorRetrySchema<T>
> = {
    __brand: VigorBrand<"Retry", "Policy<Schema">

    target: ((signal: AbortSignal) => any | Promise<any>) | VigorEmptyType
    abortSignals: AbortSignal[]
    settings: VigorRetryPolicySettingsSchema<T>
    middlewares: VigorRetryPolicyMiddlewaresSchema<T>
    algorithms: VigorRetryPolicyAlgorithmsSchema<T>
}

export const VigorRetryPolicyBase = {
    __brand: createBrand("Retry", "Policy<Schema"),

    target: VigorEmpty,
    abortSignals: [] as [],
    settings: VigorRetryPolicySettingsBase,
    middlewares: VigorRetryPolicyMiddlewaresBase,
    algorithms: VigorRetryPolicyAlgorithmsBase
} as const satisfies VigorRetryPolicySchema<any>
