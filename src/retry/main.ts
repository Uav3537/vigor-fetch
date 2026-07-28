import { createBrand, isVigorEmpty, VigorBrand, VigorCastPlaceholder, VigorEmpty, VigorExcludeDefault, VigorExcludeEmpty } from "@core/symbol"
import { VigorRetryContextBase, VigorRetryContextSchema } from "./context"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorRetryTypeLambda } from "./TL"
import { VigorRetryPolicySettings, VigorRetryPolicySettingsSchema } from "./settings"
import { VigorDeepMerge, VigorDeepPartial } from "@core/types"
import { VigorRetryPolicyMiddlewares, VigorRetryPolicyMiddlewaresApi, VigorRetryPolicyMiddlewaresSchema } from "./middlewares"
import { VigorRetryPolicyAlgorithms, VigorRetryPolicyAlgorithmsSchema } from "./algorithms"
import { VigorRetryError } from "./error"
import { VigorRetryPolicyBase, VigorRetryPolicySchema } from "./policy"

export * from "./policy"

export type VigorRetrySchema<
    T extends VigorRetrySchema<T>
> = {
    __brand: VigorBrand<"Retry", "Schema">

    policy: VigorRetryPolicySchema<T>
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown
}

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
    public target<const N extends VigorExcludeEmpty<VigorRetrySchema<T>["policy"]["target"]>>(func: N) {
        return this._next({
            policy: { target: func }
        } as const)
    }
    /** Sets external abort signals that, when aborted, stop retrying. */
    public abortSignals<const N extends VigorRetrySchema<T>["policy"]["abortSignals"]>(...sig: N) {
        return this._next({
            policy: { abortSignals: sig }
        } as const)
    }
    /** Configures the retry policy's general settings (max attempts, timeout, etc). */
    public settings<
        const N extends VigorDeepPartial<VigorRetryPolicySettingsSchema<T>>
    >(input: N): VigorApply<VigorRetryTypeLambda, VigorDeepMerge<T, { policy: { settings: N } }>>
    public settings<
        const R extends VigorRetrySchema<any>
    >(input: (s: VigorRetryPolicySettings<T>) => VigorRetryPolicySettings<R>): VigorApply<VigorRetryTypeLambda, VigorDeepMerge<T, { policy: { settings: R["policy"]["settings"] } }>>
    public settings<
        const R extends VigorRetrySchema<any>
    >(input: VigorRetryPolicySettings<R>): VigorApply<VigorRetryTypeLambda, VigorDeepMerge<T, { policy: { settings: R["policy"]["settings"] } }>>
    public settings(input: any): any {
        if (typeof input === 'function' || input instanceof VigorRetryPolicySettings) {
            const result = typeof input === 'function'
                ? input(new VigorRetryPolicySettings<T>())
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
    >(input: N): VigorApply<VigorRetryTypeLambda, VigorDeepMerge<T, { policy: { middlewares: N } }>>
    public middlewares<
        const R extends VigorRetrySchema<any>
    >(input: (s: VigorRetryPolicyMiddlewares<T>) => VigorRetryPolicyMiddlewares<R>): VigorApply<VigorRetryTypeLambda, VigorDeepMerge<T, { policy: { middlewares: R["policy"]["middlewares"] } }>>
    public middlewares<
        const R extends VigorRetrySchema<any>
    >(input: VigorRetryPolicyMiddlewares<R>): VigorApply<VigorRetryTypeLambda, VigorDeepMerge<T, { policy: { middlewares: R["policy"]["middlewares"] } }>>
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
    >(input: N): VigorApply<VigorRetryTypeLambda, VigorDeepMerge<T, { policy: { algorithms: N } }>>
    public algorithms<
        const R extends VigorRetrySchema<any>
    >(input: (a: VigorRetryPolicyAlgorithms<T>) => VigorRetryPolicyAlgorithms<R>): VigorApply<VigorRetryTypeLambda, VigorDeepMerge<T, { policy: { algorithms: R["policy"]["algorithms"] } }>>
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
    public cast<const C>() {
        return this._next(
            { cast: VigorCastPlaceholder } as unknown as { cast: C },
            { cast: "replace" }
        )
    }
    /** Runs the target and returns its result directly, throwing on final failure. */
    public async request<R = VigorExcludeDefault<VigorRetryContextSchema<T>["result"]>>() {
        const res = await this.requestVerbose<R>()
        if(res.success) return res.data
        throw res.error
    }
    /** Runs the target and returns a result/error envelope instead of throwing. */
    public async requestVerbose<R = VigorExcludeDefault<VigorRetryContextSchema<T>["result"]>>() {
        return await this.requestRuntime<R>()
    }
    /** Internal execution loop implementing the attempt/retry/restart lifecycle. */
    private async requestRuntime<R = VigorRetryContextSchema<T>["result"]>(
        restartAttempt: number = 1
    ): Promise<
        {success: true, data: R, error: null} |
        {success: false, data: null, error: unknown}
    > {
        const config = this._merge(this.config, {}) as VigorRetrySchema<T>
        let ctx: VigorRetryContextSchema<T> = {
            ...VigorRetryContextBase,
            policy: config.policy
        } as VigorRetryContextSchema<T>
        if(isVigorEmpty(ctx.policy.target)) throw new VigorRetryError("VALUE_REQUIRED", {
            method: "request",
            data: {
                key: "target"
            },
            context: ctx as VigorRetryContextSchema<any>
        })

        const target = ctx.policy.target

        const throwError: VigorRetryPolicyMiddlewaresApi<T>["throwError"] = (err) => {
            throw err
        }

        try {
            while(ctx.system.attempt < ctx.policy.settings.maxAttempts) {
                ctx.system.attempt++
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

                    const outerSignals = AbortSignal.any(ctx.policy.abortSignals)

                    const autoBreak = () => {
                        ctx.flags.brokeRetry = true
                    }
                    outerSignals.addEventListener("abort", autoBreak)

                    const mergedSignals = AbortSignal.any([
                        innerSignals,
                        outerSignals
                    ])
                    let onAbort: ((reason?: unknown) => void) | undefined
                    let timeoutId: ReturnType<typeof setTimeout> | undefined
                    try {
                        for(const middleware of ctx.policy.middlewares.before) {
                            if(middleware._mode === "fluent") {
                                await middleware.func(ctx as any)
                            } else {
                                ctx = await middleware.func(ctx as any, {
                                    abort: (reason) => userController.abort(reason),
                                    throwError,
                                    breakRetry
                                }) as typeof ctx
                            }
                        }
                        mergedSignals.throwIfAborted()

                        timeoutId = setTimeout(() => timeoutController.abort(new VigorRetryError("TIMED_OUT", {
                            method: "request",
                            data: {
                                limit: ctx.policy.settings.timeout
                            }
                        })), ctx.policy.settings.timeout)

                        ctx.result = await Promise.race([
                            target(mergedSignals),
                            new Promise((_, rej) => {
                                onAbort = () => rej(mergedSignals.reason)
                                mergedSignals.addEventListener("abort", onAbort)
                            })
                        ])

                        for(const middleware of ctx.policy.middlewares.after) {
                            if(middleware._mode === "fluent") {
                                await middleware.func(ctx as any)
                            } else {
                                ctx = await middleware.func(ctx as any, {
                                    throwError
                                }) as typeof ctx
                            }
                        }

                        const setResult: VigorRetryPolicyMiddlewaresApi<T>["setResult"] = (res) => {
                            ctx.result = res
                        }

                        for(const middleware of ctx.policy.middlewares.onResult) {
                            if(middleware._mode === "fluent") {
                                ctx.result = await middleware.func(ctx.result as any)
                            } else {
                                ctx = await middleware.func(ctx as any, {
                                    setResult,
                                    throwError
                                }) as typeof ctx
                            }
                        }
                        return {
                            success: true,
                            data: ctx.result as R,
                            error: null
                        }
                    } finally {
                        clearTimeout(timeoutId)
                        outerSignals.removeEventListener("abort", autoBreak)
                        if(onAbort) mergedSignals.removeEventListener("abort", onAbort)
                    }
                } catch(error) {
                    ctx.error = error
                    if(ctx.flags.brokeRetry) throw ctx.error
                    ctx.flags.doRetry = true

                    const proceedRetry: VigorRetryPolicyMiddlewaresApi<T>["proceedRetry"] = () => ctx.flags.doRetry = true
                    const cancelRetry: VigorRetryPolicyMiddlewaresApi<T>["cancelRetry"] = () => ctx.flags.doRetry = false
                    for(const middleware of ctx.policy.middlewares.retryIf) {
                        if(middleware._mode === "fluent") {
                            ctx.flags.doRetry = await middleware.func(ctx.error)
                        } else {
                            ctx = await middleware.func(ctx, {
                                proceedRetry,
                                cancelRetry
                            })
                        }
                    }
                    if(!ctx.flags.doRetry) throw ctx.error

                    ctx.system.delay = ctx.policy.algorithms._calculateDelay(ctx.system.attempt, ctx.policy.algorithms)
                    const setDelay: VigorRetryPolicyMiddlewaresApi<T>["setDelay"] = (num) => {
                        ctx.system.delay = num
                    }

                    for(const middleware of ctx.policy.middlewares.onRetry) {
                        if(middleware._mode === "fluent") {
                            await middleware.func(ctx.error)
                        } else {
                            ctx = await middleware.func(ctx, {
                                throwError,
                                setDelay
                            })
                        }
                    }

                    const delay = ctx.system.delay
                    await new Promise(res => setTimeout(res, delay as number))
                }
            }

            throw new VigorRetryError("RETRY_EXHAUSTED", {
                method: "request",
                cause: ctx.error,
                data: {
                    maxAttempts: ctx.policy.settings.maxAttempts,
                    error: ctx.error
                }
            })
        } catch(error) {
            ctx.error = error

            ctx.flags.doRestart = false
            ctx.flags.overridden = false
            const setResult: VigorRetryPolicyMiddlewaresApi<T>["setResult"] = (res) => {
                ctx.flags.overridden = true
                ctx.result = res
            }
            const proceedRestart: VigorRetryPolicyMiddlewaresApi<T>["proceedRestart"]  = () => ctx.flags.doRestart = true
            const cancelRestart: VigorRetryPolicyMiddlewaresApi<T>["cancelRestart"]  = () => ctx.flags.doRestart = false
            for(const middleware of ctx.policy.middlewares.onError) {
                if(middleware._mode === "fluent") {
                    await middleware.func(ctx.error)
                } else {
                    ctx = await middleware.func(ctx, {
                        setResult,
                        throwError,
                        proceedRestart,
                        cancelRestart
                    })
                }
            }
            if(ctx.flags.doRestart) {
                if(restartAttempt + 1 > ctx.policy.settings.maxRestarts) throw new VigorRetryError("RESTART_EXHAUSTED", {
                    method: "request",
                    cause: ctx.error,
                    data: {
                        maxAttempts: ctx.policy.settings.maxRestarts,
                        error: ctx.error
                    }
                })
                return await this.requestRuntime(restartAttempt + 1)
            }
            if(ctx.flags.overridden) return {
                success: true,
                data: ctx.result as R,
                error: null
            }
            if(!isVigorEmpty(ctx.policy.settings.default)) {
                const data = await ctx.policy.settings.default(ctx)
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
