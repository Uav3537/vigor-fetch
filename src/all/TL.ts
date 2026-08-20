import { VigorTypeLambda } from "@core/HKT"
import { VigorAll, VigorAllSchema } from "./main"
import { VigorAllPolicySettings } from "./settings"
import { VigorAllPolicyMiddlewares } from "./middlewares"

export type VigorAllIn<T> =
    T extends VigorAllSchema<any> ? T : never

export interface VigorAllTypeLambda extends VigorTypeLambda {
    readonly Target: VigorAll<VigorAllIn<this["In"]>>
}

export interface VigorAllPolicySettingsTypeLambda extends VigorTypeLambda {
    readonly Target: VigorAllPolicySettings<VigorAllIn<this["In"]>>
}

export interface VigorAllPolicyMiddlewaresTypeLambda extends VigorTypeLambda {
    readonly Target: VigorAllPolicyMiddlewares<VigorAllIn<this["In"]>>
}