import { VigorApply, VigorTypeLambda } from "./HKT"
import { VigorDeepPartial, VigorDeepMerge, VigorMergeStrategy } from "./types"

/**
 * Base class for Vigor's immutable, chainable builder objects.
 *
 * Each subclass holds a `base` config and a current `config`, and exposes
 * `_next()` to derive a new instance with a patch merged in. Subclasses
 * implement `_create()` to construct the concrete instance type, and the
 * return type of `_next()` is computed through the `TL` type lambda so
 * chained calls stay precisely typed.
 *
 * @typeParam Base - Shape of the full config for this builder.
 * @typeParam Config - Concrete config type held by this instance (extends `Base`).
 * @typeParam TL - Type lambda mapping a config type to the concrete instance type.
 */
export abstract class VigorStatus<
    Base,
    Config extends Base,
    TL extends VigorTypeLambda
> {
    private readonly _base: Base
    private readonly _config: Config

    /**
     * @param base - The default/base config for this builder.
     * @param config - The (possibly partial) config to merge onto `base`.
     */
    constructor(base: Base, config: Config | VigorDeepPartial<Config>) {
        this._base = base
        this._config = this._merge(base, config) as Config
    }

    /** Constructs a concrete instance of this builder from a merged config. */
    protected abstract _create<C>(config: C): VigorApply<TL, C>

    /**
     * Derives a new instance by merging `patch` onto the current config.
     *
     * @param patch - Values to overwrite/merge in for this step.
     * @param strategy - Optional tree mirroring the shape of `patch`, whose
     *  leaves may be `"replace" | "concat" | "merge"` to force the merge
     *  behavior at that path. Paths without a strategy fall back to the
     *  default behavior (deep merge for objects, concat for arrays).
     */
    protected _next<const Patch extends VigorDeepPartial<Base>>(
        patch: Patch,
        strategy?: VigorMergeStrategy<Patch>
    ): VigorApply<TL, VigorDeepMerge<Config, Patch>> {
        const merged = this._merge(this._config, patch, strategy)
        return this._create(merged)
    }

    /**
     * Deep-merges `target` onto `source`, honoring an optional per-path
     * `strategy` tree. Objects merge key by key, arrays concatenate (unless
     * `"replace"` is specified), and any other value is overwritten.
     */
    protected _merge<A, B>(source: A, target: B, strategy?: unknown): VigorDeepMerge<A, B> {
        const isObj = (v: unknown): v is Record<string, unknown> =>
            v !== null &&
            typeof v === "object" &&
            Object.getPrototypeOf(v) === Object.prototype

        const merge = (a: unknown, b: unknown, s: unknown): unknown => {
            if (b === undefined || b === null) return a

            if (s === "replace") return b

            if (Array.isArray(a) && Array.isArray(b)) {
                return s === "replace" ? b : [...a, ...b]
            }

            if (isObj(a) && isObj(b)) {
                const r: Record<string, unknown> = { ...a }
                const sObj = isObj(s) ? s : undefined
                for (const k of Object.keys(b)) {
                    r[k] = merge((a as any)[k], (b as any)[k], sObj?.[k])
                }
                return r
            }

            return b
        }

        return merge(source, target, strategy) as VigorDeepMerge<A, B>
    }

    /** The default/base config this builder was constructed with. */
    public get base(): Base {
        return this._base
    }

    /** The current, merged config for this builder instance. */
    public get config(): Config {
        return this._config
    }
}
