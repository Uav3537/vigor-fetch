import { createBrand, VigorBrand, VigorEmpty, VigorEmptyType, VigorExcludeEmpty } from "@core/symbol"
import { VigorRetryBase, VigorRetrySchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorRetryPolicySettingsTypeLambda } from "./TL"

export type VigorRetryPolicySettingsSchema<
    T extends VigorRetrySchema<T>
> = {
    __brand: VigorBrand<"Retry", "Policy<Settings<Schema">

    default: ((ctx: T["context"]) => any|Promise<any>) | VigorEmptyType
    maxAttempts: number
    maxRestarts: number
    timeout: number
}

export const VigorRetryPolicySettingsBase = {
    __brand: createBrand("Retry", "Policy<Settings<Schema"),

    default: VigorEmpty,
    maxAttempts: 5,
    maxRestarts: 3,
    timeout: 20000
} as const satisfies VigorRetryPolicySettingsSchema<any>

/** Immutable builder for a retry policy's general settings. */
export class VigorRetryPolicySettings<
    T extends VigorRetrySchema<T> = typeof VigorRetryBase 
> extends VigorStatus<VigorRetrySchema<any>, T, VigorRetryPolicySettingsTypeLambda> {

    constructor(config: T = VigorRetryBase as unknown as T) {
        super(VigorRetryBase  as VigorRetrySchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorRetryPolicySettingsTypeLambda, C> {
        return new VigorRetryPolicySettings(config as unknown as VigorRetrySchema<any>) as unknown as VigorApply<VigorRetryPolicySettingsTypeLambda, C>
    }

    /** Sets the fallback value/factory used when the target ultimately fails. */
    public default<const N extends VigorExcludeEmpty<VigorRetrySchema<any>["policy"]["settings"]["default"]>>(func: N) {
        return this._next({
            policy: { settings: { default: func } }
        } as const)
    }
    /** Sets the maximum number of retry attempts before giving up. */
    public maxAttempts<const N extends VigorRetrySchema<any>["policy"]["settings"]["maxAttempts"]>(num: N) {
        return this._next({
            policy: { settings: { maxAttempts: num } }
        })
    }
    /** Sets the maximum number of full restarts allowed. */
    public maxRestarts<const N extends VigorRetrySchema<any>["policy"]["settings"]["maxRestarts"]>(num: N) {
        return this._next({
            policy: { settings: { maxRestarts: num } }
        })
    }
    /** Sets the timeout, in milliseconds, for a single attempt. */
    public timeout<const N extends VigorRetrySchema<any>["policy"]["settings"]["timeout"]>(num: N) {
        return this._next({
            policy: { settings: { timeout: num } }
        })
    }
}
