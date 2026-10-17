import { VigorDeepMerge } from "@core/types"
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

    /**
     * Whether `requestVerbose()` records a timeline. Off by default: the
     * `timeline` stays empty and no context snapshots are taken. With it
     * on, the nested retry/parse engines record theirs too.
     */
    debug: boolean
    retryHeaders: string[]
    unretryStatus: number[]
    /**
     * Upper bound, in milliseconds, on a server-suggested retry delay read
     * from `retryHeaders`. Longer values are clamped to it.
     */
    maxRetryAfter: number
    /**
     * When `true`, a response that was redirected (or a readable `3xx` with a
     * `Location` header) navigates the page to its target via
     * `window.location.href`. Outside a browser (no `window.location`) this
     * does nothing, exactly like `false` (the default).
     */
    redirect: boolean
    /**
     * When `true` (the default), the request URL must stay inside the origin
     * it was built from: the same domain, and within the origin's path. A
     * `.path()` segment like `".."` that would climb out of it — e.g. user
     * input landing in `.path("users", id)` — fails the request with
     * `PATH_ESCAPED` instead of sending it. `..` that stays inside is fine.
     */
    confinePath: boolean
    maxRestarts: number
    default: ((ctx: VigorFetchContextSchema<T>) => any|Promise<any>) | VigorEmptyType
}

export const VigorFetchPolicySettingsBase = {
    __brand: createBrand("Fetch", "Policy<Settings<Schema"),

    debug: false,
    retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"],
    // Statuses a retry of the same request won't change. Left retryable on
    // purpose: 408 (timeout), 421 (misdirected — another connection may
    // work), 423 (locked), 425 (too early), 429 (rate limit), and 5xx
    // outages (500, 502, 503, 504, 507).
    unretryStatus: [
        400, 401, 402, 403, 404, 405, 406, 407, 409, 410, 411, 412, 413, 414, 415, 416, 417,
        422, 424, 426, 428, 431, 451,
        501, 505, 506, 508, 510, 511
    ],
    maxRetryAfter: 5 * 60 * 1000,
    redirect: false,
    confinePath: true,
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
    public retryHeaders<const N extends VigorFetchSchema<any>["policy"]["settings"]["retryHeaders"]>(...strs: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { retryHeaders: N } } }, { policy: { settings: { retryHeaders: "replace" } } }>> {
        return this._next({ policy: { settings: { retryHeaders: strs } } } as const, { policy: { settings: { retryHeaders: "replace" } } })
    }
    /** Sets (replaces) the HTTP status codes that should never be retried. */
    public unretryStatus<const N extends VigorFetchSchema<any>["policy"]["settings"]["unretryStatus"]>(...nums: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { unretryStatus: N } } }, { policy: { settings: { unretryStatus: "replace" } } }>> {
        return this._next({ policy: { settings: { unretryStatus: nums } } } as const, { policy: { settings: { unretryStatus: "replace" } } })
    }
    /** Sets the upper bound, in milliseconds, on a server-suggested retry delay. */
    public maxRetryAfter<const N extends VigorFetchSchema<any>["policy"]["settings"]["maxRetryAfter"]>(num: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { maxRetryAfter: N } } }>> {
        return this._next({ policy: { settings: { maxRetryAfter: num } } } as const)
    }
    /**
     * When enabled, a redirected response (or a readable `3xx` with a
     * `Location` header) navigates the page to its target
     * (`window.location.href`). Without `window.location` — e.g. in Node —
     * this behaves like `false`.
     */
    /**
     * When enabled (the default), a request whose URL would leave its
     * origin's domain or path (e.g. through a `".."` path segment) fails with
     * `PATH_ESCAPED` instead of being sent.
     */
    public confinePath<const N extends VigorFetchSchema<any>["policy"]["settings"]["confinePath"]>(bool: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { confinePath: N } } }>> {
        return this._next({ policy: { settings: { confinePath: bool } } } as const)
    }
    public redirect<const N extends VigorFetchSchema<any>["policy"]["settings"]["redirect"]>(bool: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { redirect: N } } }>> {
        return this._next({ policy: { settings: { redirect: bool } } } as const)
    }
    /** Sets the maximum number of full restarts allowed. */
    public maxRestarts<const N extends VigorFetchSchema<any>["policy"]["settings"]["maxRestarts"]>(num: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { maxRestarts: N } } }>> {
        return this._next({ policy: { settings: { maxRestarts: num } } } as const)
    }
    /** Sets the fallback value/factory used when the request ultimately fails. */
    public default<const N extends VigorExcludeEmpty<VigorFetchPolicySettingsSchema<T>["default"]>>(func: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { default: N } } }>> {
        return this._next({ policy: { settings: { default: func } } } as const)
    }
    /**
     * Turns timeline recording on or off (off by default). Off, the
     * `timeline` of `requestVerbose()` stays empty and no context snapshots
     * are taken, so it costs nothing unless you're debugging. With it on,
     * the nested retry/parse engines record theirs too.
     */
    public debug<const N extends VigorFetchSchema<any>["policy"]["settings"]["debug"]>(bool: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { debug: N } } }>> {
        return this._next({ policy: { settings: { debug: bool } } } as const)
    }
}
