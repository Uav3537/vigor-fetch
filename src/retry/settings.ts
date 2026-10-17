import { VigorDeepMerge } from "@core/types"
import { createBrand, VigorBrand, VigorEmpty, VigorEmptyType, VigorExcludeEmpty } from "@core/symbol"
import { VigorRetryBase, VigorRetrySchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorRetryPolicySettingsTypeLambda } from "./TL"
import type { VigorRetryContextSchema } from "./context"

export type VigorRetryPolicySettingsSchema<
    T extends VigorRetrySchema<T>
> = {
    __brand: VigorBrand<"Retry", "Policy<Settings<Schema">

    /**
     * Whether `requestVerbose()` records a timeline. Off by default: the
     * `timeline` stays empty and no context snapshots are taken.
     */
    debug: boolean
    default: ((ctx: VigorRetryContextSchema<T>) => any|Promise<any>) | VigorEmptyType
    maxAttempts: number
    maxRestarts: number
    timeout: number
}

export const VigorRetryPolicySettingsBase = {
    __brand: createBrand("Retry", "Policy<Settings<Schema"),

    debug: false,
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
    public default<const N extends VigorExcludeEmpty<VigorRetryPolicySettingsSchema<T>["default"]>>(func: N): VigorApply<VigorRetryPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { default: N } } }>> {
        return this._next({
            policy: { settings: { default: func } }
        } as const)
    }
    /** Sets the maximum number of retry attempts before giving up. */
    public maxAttempts<const N extends VigorRetrySchema<any>["policy"]["settings"]["maxAttempts"]>(num: N): VigorApply<VigorRetryPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { maxAttempts: N } } }>> {
        return this._next({
            policy: { settings: { maxAttempts: num } }
        })
    }
    /** Sets the maximum number of full restarts allowed. */
    public maxRestarts<const N extends VigorRetrySchema<any>["policy"]["settings"]["maxRestarts"]>(num: N): VigorApply<VigorRetryPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { maxRestarts: N } } }>> {
        return this._next({
            policy: { settings: { maxRestarts: num } }
        })
    }
    /** Sets the timeout, in milliseconds, for a single attempt. */
    public timeout<const N extends VigorRetrySchema<any>["policy"]["settings"]["timeout"]>(num: N): VigorApply<VigorRetryPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { timeout: N } } }>> {
        return this._next({
            policy: { settings: { timeout: num } }
        })
    }
    /**
     * Turns timeline recording on or off (off by default). Off, the
     * `timeline` of `requestVerbose()` stays empty and no context snapshots
     * are taken, so it costs nothing unless you're debugging.
     */
    public debug<const N extends VigorRetrySchema<any>["policy"]["settings"]["debug"]>(bool: N): VigorApply<VigorRetryPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { debug: N } } }>> {
        return this._next({ policy: { settings: { debug: bool } } } as const)
    }
}
