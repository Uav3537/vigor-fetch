import { createBrand, isVigorEmpty, VigorBrand, VigorCastPlaceholder, VigorEmpty, VigorExcludeDefault, VigorExcludeEmpty } from "@core/symbol"
import { VigorRetryContextBase, VigorRetryContextSchema } from "./context"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorRetryTypeLambda } from "./TL"
import { VigorRetryPolicySettings, VigorRetryPolicySettingsSchema } from "./settings"
import { VigorDeepMerge, VigorDeepPartial, VigorNoExtraKeys, VigorReturnType } from "@core/types"
import { VigorRetryErrorPipeResult, VigorRetryPolicyMiddlewares, VigorRetryPolicyMiddlewaresApi, VigorRetryPolicyMiddlewaresSchema } from "./middlewares"
import { VigorRetryPolicyAlgorithms, VigorRetryPolicyAlgorithmsSchema } from "./algorithms"
import { VigorRetryError, VigorRetryRequestError } from "./error"
import { VigorRetryPolicyBase, VigorRetryPolicySchema } from "./policy"
import { VigorRetryDecisionReason, VigorRetryTimeline, VigorRetryTimelineSnapshot } from "./timeline"
import { createVigorTimelineRecorder, VigorTimelineOutcome } from "@core/timeline"

export * from "./policy"
export * from "./timeline"

/** Largest delay `setTimeout` accepts — longer values overflow and fire immediately. */
const MAX_TIMEOUT = 2 ** 31 - 1

export type VigorRetrySchema<
    T extends VigorRetrySchema<T>
> = {
    __brand: VigorBrand<"Retry", "Schema">

    policy: VigorRetryPolicySchema<T>
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown
}

/** What `request()` resolves to: the pipeline's result, or what `settings.default` returns. */
export type VigorRetryResult<T extends VigorRetrySchema<T>> =
    | VigorExcludeDefault<VigorRetryContextSchema<T>["result"]>
    | VigorExcludeDefault<VigorRetryErrorPipeResult<T>>
    | VigorReturnType<T["policy"]["settings"]["default"]>

/** The builder `T` becomes after merging `P` in (with strategy tree `S`). */
type VigorRetryNext<T, P, S = undefined> = VigorApply<VigorRetryTypeLambda, VigorDeepMerge<T, P, S>>

export const VigorRetryBase = {
    __brand: createBrand("Retry", "Schema"),

    policy: VigorRetryPolicyBase,
    cast: VigorEmpty
} as const satisfies VigorRetrySchema<any>

/**
 * Immutable builder that executes a target function with retry, restart,
 * timeout, and abort support, driven by a configurable delay algorithm and
 * middleware pipeline.
 */
export class VigorRetry<
    T extends VigorRetrySchema<T> = typeof VigorRetryBase
> extends VigorStatus<VigorRetrySchema<T>, T, VigorRetryTypeLambda> {

    constructor(config: T = VigorRetryBase as unknown as T) {
        super(VigorRetryBase  as VigorRetrySchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorRetryTypeLambda, C> {
        return new VigorRetry(config as unknown as VigorRetrySchema<any>) as unknown as VigorApply<VigorRetryTypeLambda, C>
    }

    /** Sets the target function to invoke, with retry/timeout applied. */
    public target<const N extends VigorExcludeEmpty<VigorRetrySchema<T>["policy"]["target"]>>(func: N): VigorRetryNext<T, { policy: { target: N } }> {
        return this._next({
            policy: { target: func }
        } as const)
    }
    /** Sets external abort signals that, when aborted, stop retrying. */
    public abortSignals<const N extends VigorRetrySchema<T>["policy"]["abortSignals"]>(...sig: N): VigorRetryNext<T, { policy: { abortSignals: N } }> {
        return this._next({
            policy: { abortSignals: sig }
        } as const)
    }
    /** Configures the retry policy's general settings (max attempts, timeout, etc). */
    public settings<
        const N extends VigorDeepPartial<VigorRetryPolicySettingsSchema<T>>
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorRetryPolicySettingsSchema<T>>>): VigorRetryNext<T, { policy: { settings: N } }>
    public settings<
        const B extends VigorRetryPolicySettings<any>
    >(input: (s: VigorRetryPolicySettings<T>) => B): VigorRetryNext<T, { policy: { settings: B["config"]["policy"]["settings"] } }>
    public settings<
        const R extends VigorRetrySchema<any>
    >(input: VigorRetryPolicySettings<R>): VigorRetryNext<T, { policy: { settings: R["policy"]["settings"] } }>
    public settings(input: any): any {
        if (typeof input === 'function' || input instanceof VigorRetryPolicySettings) {
            // The callback builder starts from the current settings, so values it doesn't touch are kept.
            const result = typeof input === 'function'
                ? input(new VigorRetryPolicySettings<T>(this.config))
                : input
            return this._next({
                policy: { settings: result.config.policy.settings }
            } as const)
        }

        return this._next({
            policy: { settings: input }
        } as const)
    }
    /** Configures the retry policy's middleware pipeline. */
    public middlewares<
        const N extends VigorDeepPartial<VigorRetryPolicyMiddlewaresSchema<T>>
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorRetryPolicyMiddlewaresSchema<T>>>): VigorRetryNext<T, { policy: { middlewares: N } }>
    /**
     * The callback's builder is typed as already holding this instance's
     * middlewares (so each new one sees the pipeline so far), while at
     * runtime it starts empty and its result is appended. Either way, its
     * type is the full list, so it replaces the current one.
     */
    public middlewares<
        const B extends VigorRetryPolicyMiddlewares<any>
    >(input: (s: VigorRetryPolicyMiddlewares<T>) => B): VigorRetryNext<T, { policy: { middlewares: B["config"]["policy"]["middlewares"] } }, { policy: { middlewares: "replace" } }>
    public middlewares<
        const R extends VigorRetrySchema<any>
    >(input: VigorRetryPolicyMiddlewares<R>): VigorRetryNext<T, { policy: { middlewares: R["policy"]["middlewares"] } }>
    public middlewares(input: any): any {
        if (typeof input === 'function' || input instanceof VigorRetryPolicyMiddlewares) {
            const result = typeof input === 'function'
                ? input(new VigorRetryPolicyMiddlewares<T>())
                : input
            return this._next({
                policy: { middlewares: result.config.policy.middlewares }
            } as const)
        }

        return this._next({
            policy: { middlewares: input }
        } as const)
    }
    /** Configures the retry policy's delay algorithm. */
    public algorithms<
        const N extends VigorDeepPartial<VigorRetryPolicyAlgorithmsSchema<T>>
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorRetryPolicyAlgorithmsSchema<T>>>): VigorRetryNext<T, { policy: { algorithms: N } }, { policy: { algorithms: "replace" } }>
    public algorithms<
        const B extends VigorRetryPolicyAlgorithms<any>
    >(input: (a: VigorRetryPolicyAlgorithms<T>) => B): VigorRetryNext<T, { policy: { algorithms: B["config"]["policy"]["algorithms"] } }, { policy: { algorithms: "replace" } }>
    public algorithms(input: any): any {
        if (typeof input === 'function') {
            const result = input(new VigorRetryPolicyAlgorithms<T>())
            const algoSlice = (result as any).config.policy.algorithms

            return this._next({
                policy: { algorithms: algoSlice }
            } as const, { policy: { algorithms: "replace" } })
        }
        return this._next({
            policy: { algorithms: input }
        } as const, { policy: { algorithms: "replace" } })
    }
    /**
     * Overrides the resolved result type with `T`, taking priority over the
     * type naturally inferred from `target()`. Can be called before or after
     * `target()` (or any other configuration method); whichever `.cast<T>()`
     * call happens last wins.
     */
    public cast<const C>(): VigorRetryNext<T, { cast: C }, { cast: "replace" }> {
        return this._next(
            { cast: VigorCastPlaceholder } as unknown as { cast: C },
            { cast: "replace" }
        )
    }
    /**
     * Runs the target and returns its result directly, throwing on final failure.
     *
     * `R` defaults to the inferred result type. Passing one (`request<User>()`)
     * means "ignore the inference, it's this": it's taken as-is, unchecked.
     * To name the inferred type itself, use `VigorResultOf<typeof builder>`.
     */
    public async request<R = VigorRetryResult<T>>(): Promise<R> {
        const res = await this.requestVerbose<R>()
        if(res.success) return res.data
        throw res.error
    }
    /**
     * Runs the target and returns a result/error envelope instead of throwing,
     * along with the `timeline` of everything the run went through.
     */
    public async requestVerbose<R = VigorRetryResult<T>>() {
        return await this.requestRuntime<R>()
    }
    /**
     * Internal execution loop implementing the attempt/retry/restart lifecycle.
     * Never throws: every failure, including one from `onError` or `default`,
     * comes back as an envelope carrying the timeline. A restart passes the
     * same `timeline` on, so it keeps growing across runs; `startedAt` is the
     * first run's start, for `REQUEST_END`'s `took`.
     */
    private async requestRuntime<R = VigorRetryContextSchema<T>["result"]>(
        restartAttempt: number = 1,
        timeline: VigorRetryTimeline = [],
        startedAt: number = performance.now()
    ): Promise<
        {success: true, data: R, error: null, timeline: VigorRetryTimeline} |
        {success: false, data: null, error: VigorRetryRequestError<T>, timeline: VigorRetryTimeline}
    > {
        const config = this._merge(this.config, {}) as VigorRetrySchema<T>
        let ctx: VigorRetryContextSchema<T> = this._merge(VigorRetryContextBase, {
            policy: config.policy
        }, undefined, "replace") as VigorRetryContextSchema<T>
        // Assigned after `_merge`, which would otherwise clone it: `ctx.timeline` is the array entries are pushed to.
        ctx.timeline = timeline

        const { add, stage } = createVigorTimelineRecorder(timeline, (): VigorRetryTimelineSnapshot => this._snapshot(ctx), config.policy.settings.debug)
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
            return { success: false, data: null, error: error as VigorRetryRequestError<T>, timeline } as const
        }
        const decide = (retry: boolean, reason: VigorRetryDecisionReason) =>
            add("RETRY_DECISION", { attempt: ctx.system.attempt, retry, reason })

        if(isVigorEmpty(ctx.policy.target)) return fail(new VigorRetryError("VALUE_REQUIRED", {
            method: "request",
            data: {
                key: "target"
            },
            context: ctx as VigorRetryContextSchema<any>
        }))

        const target = ctx.policy.target

        const throwError: VigorRetryPolicyMiddlewaresApi<T>["throwError"] = (err) => {
            throw err
        }

        const outerSignals = AbortSignal.any(ctx.policy.abortSignals)

        try {
            while(ctx.system.attempt < ctx.policy.settings.maxAttempts) {
                ctx.system.attempt++
                add("ATTEMPT_INCREASED", { attempt: ctx.system.attempt })
                add("PROCESS_HANDLING", { type: "RETRY_START", data: { attempt: ctx.system.attempt } })
                ctx.flags.timedOut = false
                try {
                    const breakRetry: VigorRetryPolicyMiddlewaresApi<T>["breakRetry"] = (err) => {
                        ctx.flags.brokeRetry = true
                        throw err
                    }
                    const userController = new AbortController()
                    const timeoutController = new AbortController()

                    const innerSignals = AbortSignal.any([
                        userController.signal,
                        timeoutController.signal
                    ])

                    const mergedSignals = AbortSignal.any([
                        innerSignals,
                        outerSignals
                    ])
                    let onAbort: ((reason?: unknown) => void) | undefined
                    let timeoutId: ReturnType<typeof setTimeout> | undefined
                    try {
                        await stage("before", ctx.policy.middlewares.before, async (middleware, trace) => {
                            if(middleware._mode === "fluent") {
                                await middleware.func(ctx as any)
                            } else {
                                ctx = (await middleware.func(ctx as any, trace({
                                    abort: (reason) => userController.abort(reason),
                                    throwError,
                                    breakRetry
                                })) ?? ctx) as typeof ctx
                            }
                        })
                        mergedSignals.throwIfAborted()

                        // `0`, a negative value, or `Infinity` disables the per-attempt timeout.
                        const limit = ctx.policy.settings.timeout
                        if(Number.isFinite(limit) && limit > 0) {
                            timeoutId = setTimeout(() => {
                                ctx.flags.timedOut = true
                                timeoutController.abort(new VigorRetryError("TIMED_OUT", {
                                    method: "request",
                                    data: {
                                        limit
                                    },
                                    context: ctx
                                }))
                            }, Math.min(limit, MAX_TIMEOUT))
                        }

                        const attempt = ctx.system.attempt
                        add("TARGET_REQUEST_STARTED", { attempt })
                        const started = performance.now()
                        ctx.result = await Promise.race([
                            target(mergedSignals),
                            new Promise((_, rej) => {
                                onAbort = () => rej(mergedSignals.reason)
                                mergedSignals.addEventListener("abort", onAbort)
                            })
                        ])
                        add("TARGET_REQUEST_ENDED", { attempt, took: performance.now() - started })

                        await stage("after", ctx.policy.middlewares.after, async (middleware, trace) => {
                            if(middleware._mode === "fluent") {
                                await middleware.func(ctx as any)
                            } else {
                                ctx = (await middleware.func(ctx as any, trace({
                                    throwError
                                })) ?? ctx) as typeof ctx
                            }
                        })

                        const setResult: VigorRetryPolicyMiddlewaresApi<T>["setResult"] = (res) => {
                            ctx.result = res
                        }

                        await stage("onResult", ctx.policy.middlewares.onResult, async (middleware, trace) => {
                            if(middleware._mode === "fluent") {
                                ctx.result = await middleware.func(ctx.result as any)
                            } else {
                                ctx = (await middleware.func(ctx as any, trace({
                                    setResult,
                                    throwError
                                })) ?? ctx) as typeof ctx
                            }
                        })
                        return succeed(ctx.result as R, "result")
                    } finally {
                        clearTimeout(timeoutId)
                        if(onAbort) mergedSignals.removeEventListener("abort", onAbort)
                    }
                } catch(error) {
                    ctx.error = error
                    // An external abort always stops retrying.
                    if(outerSignals.aborted) ctx.flags.aborted = true
                    add("PROCESS_HANDLING", { type: "RETRY_ERROR", data: {
                        attempt: ctx.system.attempt,
                        error,
                        timedOut: ctx.flags.timedOut,
                        aborted: ctx.flags.aborted
                    } })
                    if(ctx.flags.aborted) {
                        decide(false, "aborted")
                        throw ctx.error
                    }
                    if(ctx.flags.brokeRetry) {
                        decide(false, "breakRetry")
                        throw ctx.error
                    }
                    ctx.flags.doRetry = true

                    const proceedRetry: VigorRetryPolicyMiddlewaresApi<T>["proceedRetry"] = () => ctx.flags.doRetry = true
                    const cancelRetry: VigorRetryPolicyMiddlewaresApi<T>["cancelRetry"] = () => ctx.flags.doRetry = false
                    await stage("retryIf", ctx.policy.middlewares.retryIf, async (middleware, trace) => {
                        if(middleware._mode === "fluent") {
                            ctx.flags.doRetry = await middleware.func(ctx.error)
                        } else {
                            ctx = (await middleware.func(ctx as any, trace({
                                proceedRetry,
                                cancelRetry
                            })) ?? ctx) as typeof ctx
                        }
                    })
                    if(!ctx.flags.doRetry) {
                        decide(false, "cancelled")
                        throw ctx.error
                    }
                    // No attempts left: skip the delay and `onRetry`, since nothing will be retried.
                    if(ctx.system.attempt >= ctx.policy.settings.maxAttempts) {
                        decide(false, "exhausted")
                        break
                    }
                    decide(true, "retry")

                    ctx.system.delay = ctx.policy.algorithms._calculateDelay(ctx.system.attempt, ctx.policy.algorithms)
                    const setDelay: VigorRetryPolicyMiddlewaresApi<T>["setDelay"] = (num) => {
                        ctx.system.delay = num
                    }

                    await stage("onRetry", ctx.policy.middlewares.onRetry, async (middleware, trace) => {
                        if(middleware._mode === "fluent") {
                            await middleware.func(ctx.error)
                        } else {
                            ctx = (await middleware.func(ctx as any, trace({
                                throwError,
                                setDelay
                            })) ?? ctx) as typeof ctx
                        }
                    })

                    const delay = Math.min(Math.max(0, Number(ctx.system.delay) || 0), MAX_TIMEOUT)
                    add("RETRY_DELAY", { attempt: ctx.system.attempt, delay })
                    // The delay is abortable, so an external abort doesn't wait it out.
                    await new Promise<void>((res, rej) => {
                        if(outerSignals.aborted) {
                            ctx.flags.aborted = true
                            return rej(outerSignals.reason)
                        }
                        const onAbort = () => {
                            clearTimeout(id)
                            ctx.flags.aborted = true
                            rej(outerSignals.reason)
                        }
                        const id = setTimeout(() => {
                            outerSignals.removeEventListener("abort", onAbort)
                            res()
                        }, delay)
                        outerSignals.addEventListener("abort", onAbort, { once: true })
                    })
                }
            }

            throw new VigorRetryError("RETRY_EXHAUSTED", {
                method: "request",
                cause: ctx.error,
                data: {
                    maxAttempts: ctx.policy.settings.maxAttempts,
                    error: ctx.error
                },
                context: ctx
            })
        } catch(error) {
            ctx.error = error
            add("PROCESS_HANDLING", { type: "REQUEST_ERROR", data: { error } })

            ctx.flags.doRestart = false
            ctx.flags.overridden = false
            const setResult: VigorRetryPolicyMiddlewaresApi<T>["setResult"] = (res) => {
                ctx.flags.overridden = true
                ctx.result = res
            }
            const proceedRestart: VigorRetryPolicyMiddlewaresApi<T>["proceedRestart"]  = () => ctx.flags.doRestart = true
            const cancelRestart: VigorRetryPolicyMiddlewaresApi<T>["cancelRestart"]  = () => ctx.flags.doRestart = false
            try {
                await stage("onError", ctx.policy.middlewares.onError, async (middleware, trace) => {
                    if(middleware._mode === "fluent") {
                        await middleware.func(ctx.error)
                    } else {
                        ctx = (await middleware.func(ctx as any, trace({
                            setResult,
                            throwError,
                            proceedRestart,
                            cancelRestart
                        })) ?? ctx) as typeof ctx
                    }
                })
            } catch(err) {
                return fail(err)
            }
            if(ctx.flags.doRestart) {
                // `restartAttempt` counts runs, so `restartAttempt - 1` restarts have happened so far.
                if(restartAttempt > ctx.policy.settings.maxRestarts) return fail(new VigorRetryError("RESTART_EXHAUSTED", {
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
            if(ctx.flags.overridden) return succeed(ctx.result as R, "overridden")
            if(!isVigorEmpty(ctx.policy.settings.default)) {
                try {
                    return succeed(await ctx.policy.settings.default(ctx), "default")
                } catch(err) {
                    return fail(err)
                }
            }
            return fail(ctx.error)
        }
    }
}
