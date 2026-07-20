import { VigorTypeLambda } from "@core/HKT"
import { VigorFetch, VigorFetchSchema } from "./main"
import { VigorFetchPolicySettings } from "./settings"
import { VigorFetchPolicyMiddlewares } from "./middlewares"

export type VigorFetchIn<T> =
    T extends VigorFetchSchema<any> ? T : never

export interface VigorFetchTypeLambda extends VigorTypeLambda {
    readonly Target: VigorFetch<VigorFetchIn<this["In"]>>
}

export interface VigorFetchPolicySettingsTypeLambda extends VigorTypeLambda {
    readonly Target: VigorFetchPolicySettings<VigorFetchIn<this["In"]>>
}

export interface VigorFetchPolicyMiddlewaresTypeLambda extends VigorTypeLambda {
    readonly Target: VigorFetchPolicyMiddlewares<VigorFetchIn<this["In"]>>
}
