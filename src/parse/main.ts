import { createBrand, isVigorDefault, isVigorEmpty, VigorBrand, VigorCastPlaceholder, VigorEmpty, VigorExcludeDefault, VigorExcludeEmpty } from "@core/symbol"
import { VigorParseContextBase, VigorParseContextSchema } from "./context"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorParseTypeLambda } from "./TL"
import { VigorParsePolicySettings, VigorParsePolicySettingsSchema } from "./settings"
import { VigorDeepMerge, VigorDeepPartial, VigorNoExtraKeys, VigorReturnType } from "@core/types"
import { VigorParsePolicyMiddlewares, VigorParsePolicyMiddlewaresApi, VigorParsePolicyMiddlewaresSchema } from "./middlewares"
import { VigorParsePolicyStrategies, VigorParsePolicyStrategiesSchema, VigorParseContentTypeStrategy, readVigorParseBody } from "./strategies"
import { VigorParseError, VigorParseRequestError } from "./error"
import { VigorParsePolicyBase, VigorParsePolicySchema } from "./policy"
import { VigorParseTimeline, VigorParseTimelineSnapshot } from "./timeline"
import { createVigorTimelineRecorder, VigorTimelineOutcome } from "@core/timeline"

export * from "./policy"
export * from "./timeline"

export type VigorParseSchema<
    T extends VigorParseSchema<T>
> = {
    __brand: VigorBrand<"Parse", "Schema">

    policy: VigorParsePolicySchema<T>
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown
}

/** What `request()` resolves to: the pipeline's result, or what `settings.default` returns. */
export type VigorParseResult<T extends VigorParseSchema<T>> =
    | VigorExcludeDefault<VigorParseContextSchema<T>["result"]>
    | VigorReturnType<T["policy"]["settings"]["default"]>

/** The builder `T` becomes after merging `P` in (with strategy tree `S`). */
type VigorParseNext<T, P, S = undefined> = VigorApply<VigorParseTypeLambda, VigorDeepMerge<T, P, S>>

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
    public target<const N extends VigorParseSchema<T>["policy"]["target"]>(response: N): VigorParseNext<T, { policy: { target: N } }> {
        return this._next({ policy: { target: response } } as const)
    }
    /** Configures the parse policy's general settings. */
    public settings<
        const N extends VigorDeepPartial<VigorParsePolicySettingsSchema<T>>
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorParsePolicySettingsSchema<T>>>): VigorParseNext<T, { policy: { settings: N } }>
    public settings<
        const B extends VigorParsePolicySettings<any>
    >(input: (s: VigorParsePolicySettings<T>) => B): VigorParseNext<T, { policy: { settings: B["config"]["policy"]["settings"] } }>
    public settings<
        const R extends VigorParseSchema<any>
    >(input: VigorParsePolicySettings<R>): VigorParseNext<T, { policy: { settings: R["policy"]["settings"] } }>
    public settings(input: any): any {
        if (typeof input === 'function' || input instanceof VigorParsePolicySettings) {
            // The callback builder starts from the current settings, so values it doesn't touch are kept.
            const result = typeof input === 'function'
                ? input(new VigorParsePolicySettings<T>(this.config))
                : input
            return this._next({
                policy: { settings: result.config.policy.settings }
            } as const)
        }
        return this._next({ policy: { settings: input } } as const)
    }
    /** Configures the parse policy's middleware pipeline. */
    public middlewares<
        const N extends VigorDeepPartial<VigorParsePolicyMiddlewaresSchema<T>>
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorParsePolicyMiddlewaresSchema<T>>>): VigorParseNext<T, { policy: { middlewares: N } }>
    /**
     * The callback's builder is typed as already holding this instance's
     * middlewares (so each new one sees the pipeline so far), while at
     * runtime it starts empty and its result is appended. Either way, its
     * type is the full list, so it replaces the current one.
     */
    public middlewares<
        const B extends VigorParsePolicyMiddlewares<any>
    >(input: (s: VigorParsePolicyMiddlewares<T>) => B): VigorParseNext<T, { policy: { middlewares: B["config"]["policy"]["middlewares"] } }, { policy: { middlewares: "replace" } }>
    public middlewares<
        const R extends VigorParseSchema<any>
    >(input: VigorParsePolicyMiddlewares<R>): VigorParseNext<T, { policy: { middlewares: R["policy"]["middlewares"] } }>
    public middlewares(input: any): any {
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
        const N extends VigorDeepPartial<VigorParsePolicyStrategiesSchema<T>>
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorParsePolicyStrategiesSchema<T>>>): VigorParseNext<T, { policy: { strategies: N } }>
    public strategies<
        const B extends VigorParsePolicyStrategies<any>
    >(input: (s: VigorParsePolicyStrategies<T>) => B): VigorParseNext<T, { policy: { strategies: B["config"]["policy"]["strategies"] } }>
    public strategies<
        const R extends VigorParseSchema<any>
    >(input: VigorParsePolicyStrategies<R>): VigorParseNext<T, { policy: { strategies: R["policy"]["strategies"] } }>
    public strategies(input: any): any {
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
    public cast<const C>(): VigorParseNext<T, { cast: C }, { cast: "replace" }> {
        return this._next(
            { cast: VigorCastPlaceholder } as unknown as { cast: C },
            { cast: "replace" }
        )
    }
    /**
     * Runs parsing and returns the result directly, throwing on final failure.
     *
     * `R` defaults to the inferred result type. Passing one (`request<User>()`)
     * means "ignore the inference, it's this": it's taken as-is, unchecked.
     * To name the inferred type itself, use `VigorResultOf<typeof builder>`.
     */
    public async request<R = VigorParseResult<T>>(): Promise<R> {
        const res = await this.requestVerbose<R>()
        if(res.success) return res.data
        throw res.error
    }
    /**
     * Runs parsing and returns a result/error envelope instead of throwing,
     * along with the `timeline` of everything the run went through.
     */
    public async requestVerbose<R = VigorParseResult<T>>() {
        return await this.requestRuntime<R>()
    }
    /**
     * Internal execution loop implementing the strategy fallback and restart
     * handling. Never throws: every failure, including one from `onError` or
     * `default`, comes back as an envelope carrying the timeline. A restart
     * passes the same `timeline` on, so it keeps growing across runs.
     */
    private async requestRuntime<R = VigorParseContextSchema<T>["result"]>(
        restartAttempt: number = 1,
        timeline: VigorParseTimeline = [],
        startedAt: number = performance.now()
    ): Promise<
        {success: true, data: R, error: null, timeline: VigorParseTimeline} |
        {success: false, data: null, error: VigorParseRequestError<T>, timeline: VigorParseTimeline}
    > {
        const config = this._merge(this.config, {}) as VigorParseSchema<T>
        let ctx: VigorParseContextSchema<T> = this._merge(VigorParseContextBase, {
            policy: config.policy
        }, undefined, "replace")
        // Assigned after `_merge`, which would otherwise clone it: `ctx.timeline` is the array entries are pushed to.
        ctx.timeline = timeline

        const { add, stage } = createVigorTimelineRecorder(timeline, (): VigorParseTimelineSnapshot => this._snapshot(ctx), config.policy.settings.debug)
        add("PROCESS_HANDLING", { type: "REQUEST_START", data: { restartAttempt } })
        const end = (success: boolean, outcome: VigorTimelineOutcome, error: unknown) => add("REQUEST_END", {
            success, outcome, error, took: performance.now() - startedAt, restarts: restartAttempt - 1
        })
        const succeed = (data: R, outcome: VigorTimelineOutcome) => {
            end(true, outcome, null)
            return { success: true, data, error: null, timeline } as const
        }
        const fail = (error: unknown) => {
            end(false, "failed", error)
            return { success: false, data: null, error: error as VigorParseRequestError<T>, timeline } as const
        }

        if (isVigorDefault(ctx.policy.target)) return fail(new VigorParseError("VALUE_REQUIRED", {
            method: "request",
            data: { key: "target" },
            context: ctx as VigorParseContextSchema<any>
        }))

        ctx.response = ctx.policy.target

        const throwError: VigorParsePolicyMiddlewaresApi<T>["throwError"] = (err) => { throw err }

        try {
            await stage("before", ctx.policy.middlewares.before, async (middleware, trace) => {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx as any)
                } else {
                    ctx = (await middleware.func(ctx as any, trace({ throwError })) ?? ctx) as typeof ctx
                }
            })

            if (ctx.policy.settings.raw) {
                (ctx as any).result = ctx.response
            } else {
                // Read once into bytes; every strategy in the chain parses the same
                // bytes, and a restart reuses them (the read is cached per object).
                const readStarted = performance.now()
                const body = await readVigorParseBody(ctx.response as Request | Response)
                add("BODY_READ", { size: body.bytes.byteLength, took: performance.now() - readStarted })
                const funcs = ctx.policy.strategies.funcs.length > 0
                    ? ctx.policy.strategies.funcs
                    : [VigorParseContentTypeStrategy]

                let parsed = false
                // Why each strategy failed, kept on `PARSER_ALL_FAILED` (not only in the timeline).
                const errors: unknown[] = []
                for (const [index, func] of funcs.entries()) {
                    add("STRATEGY_STARTED", { index })
                    const started = performance.now()
                    try {
                        ctx.result = await func(body)
                        add("STRATEGY_SUCCEEDED", { index, took: performance.now() - started })
                        parsed = true
                        break
                    } catch (error) {
                        errors.push(error)
                        add("STRATEGY_FAILED", { index, error, took: performance.now() - started })
                    }
                }
                if (!parsed) throw new VigorParseError("PARSER_ALL_FAILED", {
                    method: "request",
                    cause: errors.at(-1),
                    data: { tried: funcs.map((_, i) => `strategy#${i}`), errors },
                    context: ctx as VigorParseContextSchema<any>
                })
            }

            const setResult: VigorParsePolicyMiddlewaresApi<T>["setResult"] = (res) => { ctx.result = res }
            await stage("after", ctx.policy.middlewares.after, async (middleware, trace) => {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx as any)
                } else {
                    ctx = (await middleware.func(ctx as any, trace({ setResult, throwError })) ?? ctx) as typeof ctx
                }
            })

            await stage("onResult", ctx.policy.middlewares.onResult, async (middleware, trace) => {
                if (middleware._mode === "fluent") {
                    ctx.result = await middleware.func(ctx.result as any)
                } else {
                    ctx = (await middleware.func(ctx as any, trace({ setResult, throwError })) ?? ctx) as typeof ctx
                }
            })

            return succeed(ctx.result as R, "result")
        } catch (error) {
            ctx.error = error
            add("PROCESS_HANDLING", { type: "REQUEST_ERROR", data: { error } })
            ctx.flags.overridden = false
            ctx.flags.restarted = false

            const setResult: VigorParsePolicyMiddlewaresApi<T>["setResult"] = (res) => {
                ctx.flags.overridden = true
                ctx.result = res
            }
            const proceedRestart: VigorParsePolicyMiddlewaresApi<T>["proceedRestart"] = () => ctx.flags.restarted = true
            const cancelRestart: VigorParsePolicyMiddlewaresApi<T>["cancelRestart"] = () => ctx.flags.restarted = false

            try {
                await stage("onError", ctx.policy.middlewares.onError, async (middleware, trace) => {
                    if (middleware._mode === "fluent") {
                        await middleware.func(ctx.error)
                    } else {
                        ctx = (await middleware.func(ctx as any, trace({ setResult, throwError, proceedRestart, cancelRestart })) ?? ctx) as typeof ctx
                    }
                })
            } catch (err) {
                return fail(err)
            }

            if (ctx.flags.restarted) {
                if (restartAttempt > ctx.policy.settings.maxRestarts) return fail(new VigorParseError("RESTART_EXHAUSTED", {
                    method: "request",
                    cause: ctx.error,
                    data: {
                        maxAttempts: ctx.policy.settings.maxRestarts,
                        error: ctx.error
                    },
                    context: ctx
                }))
                add("PROCESS_HANDLING", { type: "REQUEST_RESTART", data: { restartAttempt: restartAttempt + 1 } })
                return await this.requestRuntime<R>(restartAttempt + 1, timeline, startedAt)
            }
            if (ctx.flags.overridden) return succeed(ctx.result as R, "overridden")
            if (!isVigorEmpty(ctx.policy.settings.default)) {
                try {
                    return succeed(await ctx.policy.settings.default(ctx) as R, "default")
                } catch (err) {
                    return fail(err)
                }
            }
            return fail(ctx.error)
        }
    }
}