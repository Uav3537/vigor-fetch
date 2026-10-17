import { VigorDeepMerge } from "@core/types"
import { createBrand, VigorBrand, VigorEmpty, VigorEmptyType, VigorExcludeEmpty } from "@core/symbol"
import { VigorParseBase, VigorParseSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorParsePolicySettingsTypeLambda } from "./TL"
import type { VigorParseContextSchema } from "./context"

export type VigorParsePolicySettingsSchema<
    T extends VigorParseSchema<T>
> = {
    __brand: VigorBrand<"Parse", "Policy<Settings<Schema">

    /**
     * Whether `requestVerbose()` records a timeline. Off by default: the
     * `timeline` stays empty and no context snapshots are taken.
     */
    debug: boolean
    raw: boolean
    default: ((ctx: VigorParseContextSchema<T>) => any|Promise<any>) | VigorEmptyType
    maxRestarts: number
}

export const VigorParsePolicySettingsBase = {
    __brand: createBrand("Parse", "Policy<Settings<Schema"),

    debug: false,
    raw: false,
    default: VigorEmpty,
    maxRestarts: 3
} as const satisfies VigorParsePolicySettingsSchema<any>

/** Immutable builder for a parse policy's general settings. */
export class VigorParsePolicySettings<
    T extends VigorParseSchema<T> = typeof VigorParseBase
> extends VigorStatus<VigorParseSchema<any>, T, VigorParsePolicySettingsTypeLambda> {

    constructor(config: T = VigorParseBase as unknown as T) {
        super(VigorParseBase as VigorParseSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorParsePolicySettingsTypeLambda, C> {
        return new VigorParsePolicySettings(config as unknown as VigorParseSchema<any>) as unknown as VigorApply<VigorParsePolicySettingsTypeLambda, C>
    }

    /** When enabled, skips content-type based parsing and returns the raw response. */
    public raw<const N extends VigorParseSchema<any>["policy"]["settings"]["raw"]>(bool: N): VigorApply<VigorParsePolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { raw: N } } }>> {
        return this._next({
            policy: { settings: { raw: bool } }
        } as const)
    }
    /** Sets the fallback value/factory used when parsing ultimately fails. */
    public default<const N extends VigorExcludeEmpty<VigorParsePolicySettingsSchema<T>["default"]>>(func: N): VigorApply<VigorParsePolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { default: N } } }>> {
        return this._next({
            policy: { settings: { default: func } }
        } as const)
    }
    /** Sets the maximum number of full restarts allowed. */
    public maxRestarts<const N extends VigorParseSchema<any>["policy"]["settings"]["maxRestarts"]>(num: N): VigorApply<VigorParsePolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { maxRestarts: N } } }>> {
        return this._next({
            policy: { settings: { maxRestarts: num } }
        } as const)
    }
    /**
     * Turns timeline recording on or off (off by default). Off, the
     * `timeline` of `requestVerbose()` stays empty and no context snapshots
     * are taken, so it costs nothing unless you're debugging.
     */
    public debug<const N extends VigorParseSchema<any>["policy"]["settings"]["debug"]>(bool: N): VigorApply<VigorParsePolicySettingsTypeLambda, VigorDeepMerge<T, { policy: { settings: { debug: N } } }>> {
        return this._next({ policy: { settings: { debug: bool } } } as const)
    }
}
