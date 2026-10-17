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
        // `base` only fills in keys `config` lacks — arrays in `config` replace
        // the base defaults instead of concatenating, so re-constructing from
        // an already-merged config (as `_next()` does) never duplicates them.
        this._config = this._merge(base, config, undefined, "replace") as Config
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
    protected _next<
        const Patch extends VigorDeepPartial<Base>,
        const S extends VigorMergeStrategy<Patch> | undefined = undefined
    >(
        patch: Patch,
        strategy?: S
    ): VigorApply<TL, VigorDeepMerge<Config, Patch, S>> {
        const merged = this._merge(this._config, patch, strategy)
        return this._create(merged)
    }

    /**
     * Deep-merges `target` onto `source`, honoring an optional per-path
     * `strategy` tree. Objects merge key by key, arrays concatenate (unless
     * `"replace"` is specified, or `arrayMode` is `"replace"`), and any other
     * value — including `null` — is overwritten. Only `undefined` keeps the
     * source value.
     */
    protected _merge<A, B>(source: A, target: B, strategy?: unknown, arrayMode: "concat" | "replace" = "concat"): VigorDeepMerge<A, B> {
        const isObj = (v: unknown): v is Record<string, unknown> =>
            v !== null &&
            typeof v === "object" &&
            Object.getPrototypeOf(v) === Object.prototype

        const deepClone = (v: unknown): unknown => {
            if (Array.isArray(v)) return v.map(deepClone)
            if (isObj(v)) {
                const r: Record<string, unknown> = {}
                for (const k of Object.keys(v)) r[k] = deepClone(v[k])
                return r
            }
            return v   // primitive, symbol(VigorDefault 등), class instance, Response 등은 그대로
        }

        const merge = (a: unknown, b: unknown, s: unknown): unknown => {
            if (b === undefined) return deepClone(a)

            if (s === "replace") return b

            if (Array.isArray(a) && Array.isArray(b)) {
                return arrayMode === "replace" ? deepClone(b) : [...a, ...b]
            }

            if (isObj(a) && isObj(b)) {
                const r: Record<string, unknown> = {}
                const sObj = isObj(s) ? s : undefined
                const keys = new Set([...Object.keys(a), ...Object.keys(b)])
                for (const k of keys) {
                    r[k] = merge((a as any)[k], (b as any)[k], sObj?.[k])
                }
                return r
            }

            return b
        }

        return merge(source, target, strategy) as VigorDeepMerge<A, B>
    }

    /**
     * Snapshots a runtime context for a timeline entry: a `_merge` deep clone
     * of everything but `timeline`, so later changes to `ctx` don't reach it.
     */
    protected _snapshot<C extends { timeline: unknown }>(ctx: C): Omit<C, "timeline"> {
        const { timeline: _, ...rest } = ctx
        return this._merge(rest, {}) as Omit<C, "timeline">
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
