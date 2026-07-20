import { VigorTypeLambda } from "@core/HKT"
import { VigorParse, VigorParseSchema } from "./main"
import { VigorParsePolicySettings } from "./settings"
import { VigorParsePolicyMiddlewares } from "./middlewares"
import { VigorParsePolicyStrategies } from "./strategies"

export type VigorParseIn<T> =
    T extends VigorParseSchema<any> ? T : never

export interface VigorParseTypeLambda extends VigorTypeLambda {
    readonly Target: VigorParse<VigorParseIn<this["In"]>>
}

export interface VigorParsePolicySettingsTypeLambda extends VigorTypeLambda {
    readonly Target: VigorParsePolicySettings<VigorParseIn<this["In"]>>
}

export interface VigorParsePolicyMiddlewaresTypeLambda extends VigorTypeLambda {
    readonly Target: VigorParsePolicyMiddlewares<VigorParseIn<this["In"]>>
}

export interface VigorParsePolicyStrategiesTypeLambda extends VigorTypeLambda {
    readonly Target: VigorParsePolicyStrategies<VigorParseIn<this["In"]>>
}
