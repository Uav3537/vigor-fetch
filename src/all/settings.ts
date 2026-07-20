import { createBrand, VigorBrand } from "@core/symbol"
import { VigorAllBase, VigorAllSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorAllPolicySettingsTypeLambda } from "./TL"

export type VigorAllPolicySettingsSchema<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "Policy<Settings<Schema">

    concurrency: number
    onlySuccess: boolean
}

export const VigorAllPolicySettingsBase = {
    __brand: createBrand("All", "Policy<Settings<Schema"),

    concurrency: 5,
    onlySuccess: false
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
    public concurrency<const N extends VigorAllSchema<any>["policy"]["settings"]["concurrency"]>(num: N) {
        return this._next({ policy: { settings: { concurrency: num } } } as const)
    }
    /** When enabled, filters the final result down to only the tasks that succeeded. */
    public onlySuccess<const N extends VigorAllSchema<any>["policy"]["settings"]["onlySuccess"]>(bool: N) {
        return this._next({ policy: { settings: { onlySuccess: bool } } } as const)
    }
}
