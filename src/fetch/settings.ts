import { createBrand, VigorBrand, VigorEmpty, VigorEmptyType, VigorExcludeEmpty } from "@core/symbol"
import { VigorFetchBase, VigorFetchSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorFetchPolicySettingsTypeLambda } from "./TL"

export type VigorFetchPolicySettingsSchema<
    T extends VigorFetchSchema<T>
> = {
    __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">

    retryHeaders: string[]
    unretryStatus: number[]
    maxRestarts: number
    default: ((ctx: T["context"]) => any|Promise<any>) | VigorEmptyType
}

export const VigorFetchPolicySettingsBase = {
    __brand: createBrand("Fetch", "Policy<Settings<Schema"),

    retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"],
    unretryStatus: [400, 401, 403, 404, 405, 413, 422],
    maxRestarts: 3,
    default: VigorEmpty
} as const satisfies VigorFetchPolicySettingsSchema<any>

/** Immutable builder for a fetch policy's general settings. */
export class VigorFetchPolicySettings<
    T extends VigorFetchSchema<T> = typeof VigorFetchBase
> extends VigorStatus<VigorFetchSchema<any>, T, VigorFetchPolicySettingsTypeLambda> {

    constructor(config: T = VigorFetchBase as unknown as T) {
        super(VigorFetchBase as VigorFetchSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorFetchPolicySettingsTypeLambda, C> {
        return new VigorFetchPolicySettings(config as unknown as VigorFetchSchema<any>) as unknown as VigorApply<VigorFetchPolicySettingsTypeLambda, C>
    }

    /** Sets response headers consulted to compute a server-suggested retry delay. */
    public retryHeaders<const N extends VigorFetchSchema<any>["policy"]["settings"]["retryHeaders"]>(...strs: N) {
        return this._next({ policy: { settings: { retryHeaders: strs } } } as const)
    }
    /** Sets HTTP status codes that should never be retried. */
    public unretryStatus<const N extends VigorFetchSchema<any>["policy"]["settings"]["unretryStatus"]>(...nums: N) {
        return this._next({ policy: { settings: { unretryStatus: nums } } } as const)
    }
    /** Sets the maximum number of full restarts allowed. */
    public maxRestarts<const N extends VigorFetchSchema<any>["policy"]["settings"]["maxRestarts"]>(num: N) {
        return this._next({ policy: { settings: { maxRestarts: num } } } as const)
    }
    /** Sets the fallback value/factory used when the request ultimately fails. */
    public default<const N extends VigorExcludeEmpty<VigorFetchSchema<any>["policy"]["settings"]["default"]>>(func: N) {
        return this._next({ policy: { settings: { default: func } } } as const)
    }
}
