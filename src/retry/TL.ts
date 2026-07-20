import { VigorTypeLambda } from "@core/HKT"
import { VigorRetry, VigorRetrySchema } from "./main"
import { VigorRetryPolicySettings } from "./settings"
import { VigorRetryPolicyMiddlewares } from "./middlewares"
import {
    VigorRetryPolicyAlgorithms,
    VigorRetryPolicyAlgorithmsBackoff,
    VigorRetryPolicyAlgorithmsBackoffSchema,
    VigorRetryPolicyAlgorithmsConstant,
    VigorRetryPolicyAlgorithmsConstantSchema,
    VigorRetryPolicyAlgorithmsCustom,
    VigorRetryPolicyAlgorithmsCustomSchema,
    VigorRetryPolicyAlgorithmsLinear,
    VigorRetryPolicyAlgorithmsLinearSchema
} from "./algorithms"

export type VigorRetryIn<T> =
    T extends VigorRetrySchema<any> ? T : never

export type VigorRetryAlgorithmsConstantIn<T> =
    T extends VigorRetryPolicyAlgorithmsConstantSchema<any> ? T : never

export type VigorRetryAlgorithmsLinearIn<T> =
    T extends VigorRetryPolicyAlgorithmsLinearSchema<any> ? T : never

export type VigorRetryAlgorithmsBackoffIn<T> =
    T extends VigorRetryPolicyAlgorithmsBackoffSchema<any> ? T : never

export type VigorRetryAlgorithmsCustomIn<T> =
    T extends VigorRetryPolicyAlgorithmsCustomSchema<any> ? T : never


export interface VigorRetryTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetry<VigorRetryIn<this["In"]>>
}

export interface VigorRetryPolicySettingsTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicySettings<VigorRetryIn<this["In"]>>
}

export interface VigorRetryPolicyMiddlewaresTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyMiddlewares<VigorRetryIn<this["In"]>>
}

export interface VigorRetryPolicyAlgorithmsTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyAlgorithms<VigorRetryIn<this["In"]>>
}

export interface VigorRetryPolicyAlgorithmsConstantTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyAlgorithmsConstant<VigorRetryAlgorithmsConstantIn<this["In"]>>
}

export interface VigorRetryPolicyAlgorithmsLinearTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyAlgorithmsLinear<VigorRetryAlgorithmsLinearIn<this["In"]>>
}

export interface VigorRetryPolicyAlgorithmsBackoffTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyAlgorithmsBackoff<VigorRetryAlgorithmsBackoffIn<this["In"]>>
}

export interface VigorRetryPolicyAlgorithmsCustomTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyAlgorithmsCustom<VigorRetryAlgorithmsCustomIn<this["In"]>>
}