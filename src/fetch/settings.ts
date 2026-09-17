import { createBrand, VigorBrand, VigorEmpty, VigorEmptyType, VigorExcludeEmpty } from "@core/symbol"
import { VigorFetchBase, VigorFetchSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorFetchPolicySettingsTypeLambda } from "./TL"
import type { VigorFetchContextSchema } from "./context"

export type VigorFetchPolicySettingsSchema<
    T extends VigorFetchSchema<T>
> = {
    __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">

    retryHeaders: string[]
    unretryStatus: number[]
    /**
     * When `true` (the default), a `3xx` response carrying a `Location`
     * header navigates the page to that URL via `window.location.href`.
     * Outside a browser (no `window.location`) this does nothing, exactly
     * like `false`.
     */
    redirect: boolean
    maxRestarts: number
    default: ((ctx: VigorFetchContextSchema<T>) => any|Promise<any>) | VigorEmptyType
}

export const VigorFetchPolicySettingsBase = {
    __brand: createBrand("Fetch", "Policy<Settings<Schema"),

    retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"],
    unretryStatus: [400, 401, 403, 404, 405, 413, 422],
    redirect: true,
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

    /** Sets (replaces) the response headers consulted to compute a server-suggested retry delay. */
    public retryHeaders<const N extends VigorFetchSchema<any>["policy"]["settings"]["retryHeaders"]>(...strs: N) {
        return this._next({ policy: { settings: { retryHeaders: strs } } } as const, { policy: { settings: { retryHeaders: "replace" } } })
    }
    /** Sets (replaces) the HTTP status codes that should never be retried. */
    public unretryStatus<const N extends VigorFetchSchema<any>["policy"]["settings"]["unretryStatus"]>(...nums: N) {
        return this._next({ policy: { settings: { unretryStatus: nums } } } as const, { policy: { settings: { unretryStatus: "replace" } } })
    }
    /**
     * When enabled, a `3xx` response with a `Location` header navigates the
     * page to that URL (`window.location.href`). Without `window.location`
     * — e.g. in Node — this behaves like `false`.
     */
    public redirect<const N extends VigorFetchSchema<any>["policy"]["settings"]["redirect"]>(bool: N) {
        return this._next({ policy: { settings: { redirect: bool } } } as const)
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
