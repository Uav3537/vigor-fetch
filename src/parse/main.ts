import { createBrand, isVigorDefault, isVigorEmpty, VigorBrand, VigorCastPlaceholder, VigorEmpty, VigorExcludeEmpty } from "@core/symbol"
import { VigorParseContextBase, VigorParseContextSchema } from "./context"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorParseTypeLambda } from "./TL"
import { VigorParsePolicySettings, VigorParsePolicySettingsSchema } from "./settings"
import { VigorCastResult, VigorDeepPartial } from "@core/types"
import { VigorParsePolicyMiddlewares, VigorParsePolicyMiddlewaresApi, VigorParsePolicyMiddlewaresSchema } from "./middlewares"
import { VigorParsePolicyStrategies, VigorParsePolicyStrategiesSchema, VigorParseContentTypeStrategy } from "./strategies"
import { VigorParseError } from "./error"
import { VigorParsePolicyBase, VigorParsePolicySchema } from "./policy"

export * from "./policy"

export type VigorParseSchema<
    T extends VigorParseSchema<T>
> = {
    __brand: VigorBrand<"Parse", "Schema">

    policy: VigorParsePolicySchema<T>
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown
}

export const VigorParseBase = {
    __brand: createBrand("Parse", "Schema"),

    policy: VigorParsePolicyBase,
    cast: VigorEmpty
} as const satisfies VigorParseSchema<any>

/**
 * Immutable builder that parses an HTTP response into a result value,
 * trying each configured strategy in sequence with an optional middleware
 * pipeline and restart-on-failure support.
 */
export class VigorParse<
    T extends VigorParseSchema<T> = typeof VigorParseBase
> extends VigorStatus<VigorParseSchema<T>, T, VigorParseTypeLambda> {

    constructor(config: T = VigorParseBase as unknown as T) {
        super(VigorParseBase as VigorParseSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorParseTypeLambda, C> {
        return new VigorParse(config as unknown as VigorParseSchema<any>) as unknown as VigorApply<VigorParseTypeLambda, C>
    }

    /** Sets the `Response` object to parse. */
    public target<const N extends VigorParseSchema<T>["policy"]["target"]>(response: N) {
        return this._next({ policy: { target: response } } as const)
    }
    /** Configures the parse policy's general settings. */
    public settings<
        const N extends VigorDeepPartial<VigorParsePolicySettingsSchema<T>>,
        R extends VigorParseSchema<any>
    >(
        input:
            | N
            | ((s: VigorParsePolicySettings<T>) => VigorParsePolicySettings<R>)
            | VigorParsePolicySettings<R>
    ) {
        if (typeof input === 'function' || input instanceof VigorParsePolicySettings) {
            const result = typeof input === 'function'
                ? input(new VigorParsePolicySettings<T>())
                : input
            return this._next({
                policy: { settings: result.config.policy.settings }
            } as const)
        }
        return this._next({ policy: { settings: input } } as const)
    }
    /** Configures the parse policy's middleware pipeline. */
    public middlewares<
        const N extends VigorDeepPartial<VigorParsePolicyMiddlewaresSchema<T>>,
        R extends VigorParseSchema<any>
    >(
        input:
            | N
            | ((s: VigorParsePolicyMiddlewares<T>) => VigorParsePolicyMiddlewares<R>)
            | VigorParsePolicyMiddlewares<R>
    ) {
        if (typeof input === 'function' || input instanceof VigorParsePolicyMiddlewares) {
            const result = typeof input === 'function'
                ? input(new VigorParsePolicyMiddlewares<T>())
                : input
            return this._next({
                policy: { middlewares: result.config.policy.middlewares }
            } as const)
        }
        return this._next({ policy: { middlewares: input } } as const)
    }
    /** Configures the parse policy's fallback chain of parsing strategies. */
    public strategies<
        const N extends VigorDeepPartial<VigorParsePolicyStrategiesSchema<T>>,
        R extends VigorParseSchema<any>
    >(
        input:
            | N
            | ((s: VigorParsePolicyStrategies<T>) => VigorParsePolicyStrategies<R>)
            | VigorParsePolicyStrategies<R>
    ) {
        if (typeof input === 'function' || input instanceof VigorParsePolicyStrategies) {
            const result = typeof input === 'function'
                ? input(new VigorParsePolicyStrategies<T>())
                : input
            return this._next({
                policy: { strategies: result.config.policy.strategies }
            } as const)
        }
        return this._next({ policy: { strategies: input } } as const)
    }

    /**
     * Overrides the resolved result type with `T`, taking priority over the
     * default `unknown` result. Can be called before or after `strategies()`
     * (or any other configuration method); whichever `.cast<T>()` call
     * happens last wins.
     */
    public cast<const C>() {
        return this._next(
            { cast: VigorCastPlaceholder } as unknown as { cast: C },
            { cast: "replace" }
        )
    }
    /** Runs parsing and returns the result directly, throwing on final failure. */
    public async request<R = VigorCastResult<T["cast"], VigorParseContextSchema<T>["result"]>>() {
        const res = await this.requestVerbose<R>()
        if(res.success) return res.data
        throw res.error
    }
    /** Runs parsing and returns a result/error envelope instead of throwing. */
    public async requestVerbose<R = VigorCastResult<T["cast"], VigorParseContextSchema<T>["result"]>>() {
        return await this.requestRuntime<R>()
    }
    /** Internal execution loop implementing the strategy fallback and restart handling. */
    private async requestRuntime<R = VigorParseContextSchema<T>["result"]>(
        restartAttempt: number = 1
    ): Promise<
        {success: true, data: R, error: null} |
        {success: false, data: null, error: unknown}
    > {
        const config = this._merge(this.config, {}) as VigorParseSchema<T>
        let ctx: VigorParseContextSchema<T> = {
            ...VigorParseContextBase,
            policy: config.policy
        } as VigorParseContextSchema<T>

        if (isVigorDefault(ctx.policy.target)) throw new VigorParseError("VALUE_REQUIRED", {
            method: "request",
            data: { key: "target" },
            context: ctx as VigorParseContextSchema<any>
        })

        ctx.response = ctx.policy.target

        const throwError: VigorParsePolicyMiddlewaresApi<T>["throwError"] = (err) => { throw err }

        try {
            for (const middleware of ctx.policy.middlewares.before) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx as any)
                } else {
                    ctx = await middleware.func(ctx as any, { throwError }) as typeof ctx
                }
            }

            const response = ctx.response as Response

            if (ctx.policy.settings.raw) {
                ctx.result = response
            } else {
                const funcs = ctx.policy.strategies.funcs.length > 0
                    ? ctx.policy.strategies.funcs
                    : [VigorParseContentTypeStrategy]

                let parsed = false
                for (const [i, func] of funcs.entries()) {
                    const cloned = (i === funcs.length - 1) ? response : response.clone()
                    try {
                        ctx.result = await func(cloned)
                        parsed = true
                        break
                    } catch { }
                }
                if (!parsed) throw new VigorParseError("PARSER_ALL_FAILED", {
                    method: "request",
                    data: { tried: funcs.map((_, i) => `strategy#${i}`) },
                    context: ctx as VigorParseContextSchema<any>
                })
            }

            const setResult: VigorParsePolicyMiddlewaresApi<T>["setResult"] = (res) => { ctx.result = res }
            for (const middleware of ctx.policy.middlewares.after) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx as any)
                } else {
                    ctx = await middleware.func(ctx as any, { setResult, throwError }) as typeof ctx
                }
            }

            for (const middleware of ctx.policy.middlewares.onResult) {
                if (middleware._mode === "fluent") {
                    ctx.result = await middleware.func(ctx.result as any)
                } else {
                    ctx = await middleware.func(ctx as any, { setResult, throwError }) as typeof ctx
                }
            }

            return {
                success: true,
                data: ctx.result as R,
                error: null
            }
        } catch (error) {
            ctx.error = error
            ctx.flags.overrided = false
            ctx.flags.restarted = false

            const setResult: VigorParsePolicyMiddlewaresApi<T>["setResult"] = (res) => {
                ctx.flags.overrided = true
                ctx.result = res
            }
            const proceedRestart: VigorParsePolicyMiddlewaresApi<T>["proceedRestart"] = () => ctx.flags.restarted = true
            const cancelRestart: VigorParsePolicyMiddlewaresApi<T>["cancelRestart"] = () => ctx.flags.restarted = false

            for (const middleware of ctx.policy.middlewares.onError) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx.error)
                } else {
                    ctx = await middleware.func(ctx as any, { setResult, throwError, proceedRestart, cancelRestart }) as typeof ctx
                }
            }

            if (ctx.flags.restarted) {
                if (restartAttempt + 1 > ctx.policy.settings.maxRestarts) throw new VigorParseError("RESTART_EXHAUSTED", {
                    method: "request",
                    cause: ctx.error,
                    data: {
                        maxAttempts: ctx.policy.settings.maxRestarts,
                        error: ctx.error
                    }
                })
                return await this.requestRuntime<R>(restartAttempt + 1)
            }
            if (ctx.flags.overrided) return {
                success: true,
                data: ctx.result as R,
                error: null
            }
            if (!isVigorEmpty(ctx.policy.settings.default)) {
                const data = await ctx.policy.settings.default(ctx) as R
                return {
                    success: true,
                    data,
                    error: null
                }
            }
            return {
                success: false,
                data: null,
                error: ctx.error
            }
        }
    }
}
