import { createBrand, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorParsePolicySettingsBase, VigorParsePolicySettingsSchema } from "./settings"
import { VigorParsePolicyMiddlewaresBase, VigorParsePolicyMiddlewaresSchema } from "./middlewares"
import { VigorParsePolicyStrategiesBase, VigorParsePolicyStrategiesSchema } from "./strategies"
import type { VigorParseSchema } from "./main"

export type VigorParsePolicySchema<
    T extends VigorParseSchema<T>
> = {
    __brand: VigorBrand<"Parse", "Policy<Schema">

    target: Request | Response | VigorDefaultType
    settings: VigorParsePolicySettingsSchema<T>
    middlewares: VigorParsePolicyMiddlewaresSchema<T>
    strategies: VigorParsePolicyStrategiesSchema<T>
}

export const VigorParsePolicyBase = {
    __brand: createBrand("Parse", "Policy<Schema"),

    target: VigorDefault,
    settings: VigorParsePolicySettingsBase,
    middlewares: VigorParsePolicyMiddlewaresBase,
    strategies: VigorParsePolicyStrategiesBase
} as const satisfies VigorParsePolicySchema<any>
