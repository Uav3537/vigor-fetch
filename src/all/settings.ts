import { VigorDeepMerge } from "@core/types"
import { createBrand, VigorBrand, VigorEmpty, VigorEmptyType, VigorExcludeEmpty } from "@core/symbol"
import { VigorAllBase, VigorAllSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorAllPolicySettingsTypeLambda } from "./TL"

export type VigorAllPolicySettingsSchema<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "Policy<Settings<Schema">

    /**
     * Whether `requestVerbose()` records a timeline. Off by default: the
     * `timeline` stays empty and no context snapshots are taken.
     */
    debug: boolean
    concurrency: number
    onlySuccess: boolean
    /** Per-task timeout in milliseconds. `VigorEmpty` (the default), `0`, a negative value, or `Infinity` disables it. */
    timeout: number | VigorEmptyType
    /** When `true`, the first task failure (not recovered by `onErrorEach`) aborts the remaining tasks and fails the batch. */
    failFast: boolean
}

export const VigorAllPolicySettingsBase = {
    __brand: createBrand("All", "Policy<Settings<Schema"),

    debug: false,
    concurrency: 5,
    onlySuccess: false,
    timeout: VigorEmpty,
    failFast: false
} as const satisfies VigorAllPolicySettingsSchema<any>

/** Immutable builder for an all-policy's general settings. */
export class VigorAllPolicySettings<
    T extends VigorAllSchema<T> = typeof VigorAllBase
> extends VigorStatus<VigorAllSchema<any>, T, VigorAllPolicySettingsTypeLambda> {

    constructor(config: T = VigorAllBase as unknown as T) {
        super(VigorAllBase as VigorAllSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorAllPolicySettingsTypeLambda, C> {
        return new VigorAllPolicySettings(config as unknown as VigorAllSchema<any>) as unknown as VigorApply<VigorAllPolicySettingsTypeLambda, C>
    }

    /** Sets the maximum number of tasks run concurrently. */
    public concurrency<const N extends VigorAllSchema<any>["policy"]["settings"]["concurrency"]>(num: N): VigorApply<VigorAllPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { concurrency: N } } }>> {
        return this._next({ policy: { settings: { concurrency: num } } } as const)
    }
    /** When enabled, filters the final result down to only the tasks that succeeded. */
    public onlySuccess<const N extends VigorAllSchema<any>["policy"]["settings"]["onlySuccess"]>(bool: N): VigorApply<VigorAllPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { onlySuccess: N } } }>> {
        return this._next({ policy: { settings: { onlySuccess: bool } } } as const)
    }
    /** Sets the per-task timeout, in milliseconds. A task exceeding it fails with `TIMED_OUT`. */
    public timeout<const N extends VigorExcludeEmpty<VigorAllSchema<any>["policy"]["settings"]["timeout"]>>(num: N): VigorApply<VigorAllPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { timeout: N } } }>> {
        return this._next({ policy: { settings: { timeout: num } } } as const)
    }
    /** When enabled, the first unrecovered task failure aborts the remaining tasks and fails the batch with that error. */
    public failFast<const N extends VigorAllSchema<any>["policy"]["settings"]["failFast"]>(bool: N): VigorApply<VigorAllPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { failFast: N } } }>> {
        return this._next({ policy: { settings: { failFast: bool } } } as const)
    }
    /**
     * Turns timeline recording on or off (off by default). Off, the
     * `timeline` of `requestVerbose()` stays empty and no context snapshots
     * are taken, so it costs nothing unless you're debugging.
     */
    public debug<const N extends VigorAllSchema<any>["policy"]["settings"]["debug"]>(bool: N): VigorApply<VigorAllPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { debug: N } } }>> {
        return this._next({ policy: { settings: { debug: bool } } } as const)
    }
}
