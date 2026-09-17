import { createBrand, isVigorEmpty, VigorBrand, VigorCastPlaceholder, VigorEmpty, VigorExcludeDefault } from "@core/symbol"
import { VigorAllContextBase, VigorAllContextSchema, VigorAllEachContextBase, VigorAllEachContextSchema } from "./context"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorAllTypeLambda } from "./TL"
import { VigorAllPolicySettings, VigorAllPolicySettingsSchema } from "./settings"
import { VigorDeepMerge, VigorDeepPartial } from "@core/types"
import { VigorAllPolicyMiddlewares, VigorAllPolicyMiddlewaresSchema } from "./middlewares"
import { VigorAllError, VigorAllRequestError } from "./error"
import { VigorAllPolicyBase, VigorAllPolicySchema, VigorAllTask } from "./policy"

export * from "./policy"

export type VigorAllSchema<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "Schema">

    policy: VigorAllPolicySchema<T>
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown
}

export const VigorAllBase = {
    __brand: createBrand("All", "Schema"),

    policy: VigorAllPolicyBase,
    cast: VigorEmpty
} as const satisfies VigorAllSchema<any>

/**
 * Immutable builder that runs a list of independent tasks with bounded
 * concurrency, per-task middleware, and either an all-results or
 * only-successes result mode.
 */
export class VigorAll<
    T extends VigorAllSchema<T> = typeof VigorAllBase
> extends VigorStatus<VigorAllSchema<T>, T, VigorAllTypeLambda> {

    constructor(config: T = VigorAllBase as unknown as T) {
        super(VigorAllBase as VigorAllSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorAllTypeLambda, C> {
        return new VigorAll(config as unknown as VigorAllSchema<any>) as unknown as VigorApply<VigorAllTypeLambda, C>
    }

    /** Sets the list of tasks to run. */
    public target<const N extends VigorAllTask[]>(...funcs: N) {
        return this._next({ policy: { target: funcs } } as const)
    }
    /** Sets external abort signals that, when aborted, cancel the remaining tasks and fail the batch. */
    public abortSignals<const N extends VigorAllSchema<T>["policy"]["abortSignals"]>(...sig: N) {
        return this._next({ policy: { abortSignals: sig } } as const)
    }
    /** Configures the all-policy's general settings (concurrency, onlySuccess). */
    public settings<
        const N extends VigorDeepPartial<VigorAllPolicySettingsSchema<T>>
    >(input: N): VigorApply<VigorAllTypeLambda, VigorDeepMerge<T, { policy: { settings: N } }>>
    public settings<
        const R extends VigorAllSchema<any>
    >(input: (s: VigorAllPolicySettings<T>) => VigorAllPolicySettings<R>): VigorApply<VigorAllTypeLambda, VigorDeepMerge<T, { policy: { settings: R["policy"]["settings"] } }>>
    public settings<
        const R extends VigorAllSchema<any>
    >(input: VigorAllPolicySettings<R>): VigorApply<VigorAllTypeLambda, VigorDeepMerge<T, { policy: { settings: R["policy"]["settings"] } }>>
    public settings(input: any): any {
        if (typeof input === 'function' || input instanceof VigorAllPolicySettings) {
            const result = typeof input === 'function'
                ? input(new VigorAllPolicySettings<T>())
                : input
            return this._next({
                policy: { settings: result.config.policy.settings }
            } as const)
        }
        return this._next({ policy: { settings: input } } as const)
    }
    /** Configures the all-policy's per-task middleware pipeline. */
    public middlewares<
        const N extends VigorDeepPartial<VigorAllPolicyMiddlewaresSchema<T>>
    >(input: N): VigorApply<VigorAllTypeLambda, VigorDeepMerge<T, { policy: { middlewares: N } }>>
    public middlewares<
        const R extends VigorAllSchema<any>
    >(input: (s: VigorAllPolicyMiddlewares<T>) => VigorAllPolicyMiddlewares<R>): VigorApply<VigorAllTypeLambda, VigorDeepMerge<T, { policy: { middlewares: R["policy"]["middlewares"] } }>>
    public middlewares<
        const R extends VigorAllSchema<any>
    >(input: VigorAllPolicyMiddlewares<R>): VigorApply<VigorAllTypeLambda, VigorDeepMerge<T, { policy: { middlewares: R["policy"]["middlewares"] } }>>
    public middlewares(input: any): any {
        if (typeof input === 'function' || input instanceof VigorAllPolicyMiddlewares) {
            const result = typeof input === 'function'
                ? input(new VigorAllPolicyMiddlewares<T>())
                : input
            return this._next({
                policy: { middlewares: result.config.policy.middlewares }
            } as const)
        }
        return this._next({ policy: { middlewares: input } } as const)
    }

    /** Runs a single task through the beforeEach/afterEach/onErrorEach middleware pipeline. */
    private async _runTask(
        task: VigorAllTask,
        index: number,
        policy: VigorAllPolicySchema<any>,
        batchSignal: AbortSignal
    ): Promise<{ success: true, value: unknown } | { success: false, value: unknown }> {
        let ctx: VigorAllEachContextSchema<any> = this._merge(VigorAllEachContextBase, { index })

        const timeoutController = new AbortController()
        const signal = AbortSignal.any([batchSignal, timeoutController.signal])
        let timeoutId: ReturnType<typeof setTimeout> | undefined
        let onAbort: (() => void) | undefined

        try {
            for (const beforeEach of policy.middlewares.beforeEach) await beforeEach(ctx)
            signal.throwIfAborted()

            const limit = policy.settings.timeout
            if (!isVigorEmpty(limit)) {
                timeoutId = setTimeout(() => timeoutController.abort(new VigorAllError("TIMED_OUT", {
                    method: "request",
                    data: { limit, index }
                })), limit)
            }

            ctx.result = await Promise.race([
                task(signal),
                new Promise((_, rej) => {
                    onAbort = () => rej(signal.reason)
                    signal.addEventListener("abort", onAbort)
                })
            ])
            for (const afterEach of policy.middlewares.afterEach) await afterEach(ctx)
            return { success: true, value: ctx.result }
        } catch (error) {
            ctx.error = error
            const setResult = (r: unknown) => { ctx.flags.overridden = true; ctx.result = r }
            for (const onErrorEach of policy.middlewares.onErrorEach) await onErrorEach(ctx, { setResult })
            if (ctx.flags.overridden) return { success: true, value: ctx.result }
            return { success: false, value: error }
        } finally {
            clearTimeout(timeoutId)
            if (onAbort) signal.removeEventListener("abort", onAbort)
        }
    }

    /**
     * Overrides the resolved result type with `T`, taking priority over the
     * naturally-inferred `unknown[]`. Can be called before or after
     * `target()` (or any other configuration method); whichever `.cast<T>()`
     * call happens last wins.
     */
    public cast<const C>() {
        return this._next(
            { cast: VigorCastPlaceholder } as unknown as { cast: C },
            { cast: "replace" }
        )
    }
    /** Runs all tasks and returns the results array directly, throwing on final failure. */
    public async request<R = VigorExcludeDefault<VigorAllContextSchema<T>["result"]>>() {
        const res = await this.requestVerbose<R>()
        if(res.success) return res.data
        throw res.error
    }
    /** Runs all tasks and returns a result/error envelope instead of throwing. */
    public async requestVerbose<R = VigorExcludeDefault<VigorAllContextSchema<T>["result"]>>(): Promise<
        {success: true, data: R, error: null} |
        {success: false, data: null, error: VigorAllRequestError<T>}
    > {
        return await this.requestRuntime<R>()
    }
    /** Internal execution loop implementing the bounded-concurrency worker pool and the batch-level before/after/onResult pipeline. */
    private async requestRuntime<R = unknown>(
    ): Promise<
        {success: true, data: R, error: null} |
        {success: false, data: null, error: VigorAllRequestError<T>}
    > {
        const config = this._merge(this.config, {}) as VigorAllSchema<T>
        const policy = config.policy

        let ctx: VigorAllContextSchema<any> = this._merge(VigorAllContextBase, {
            policy
        }, undefined, "replace")
        const setResult = (r: unknown) => { ctx.result = r }
        const throwError = (err: unknown) => { throw err }

        try {
            if (policy.target.length === 0) throw new VigorAllError("EMPTY_TARGET", {
                method: "request",
                data: {},
                context: ctx
            })

            for (const mw of policy.middlewares.before) {
                if (mw._mode === "fluent") {
                    await mw.func(ctx as any)
                } else {
                    ctx = (await mw.func(ctx as any, { throwError }) ?? ctx) as typeof ctx
                }
            }

            const concurrency = Number.isNaN(policy.settings.concurrency)
                ? 1
                : Math.max(1, Math.floor(policy.settings.concurrency))
            const results: { success: boolean, value: unknown }[] = new Array(policy.target.length)

            // Aborted by an external signal, by `failFast`, or by an `onErrorEach` hook throwing.
            const batchController = new AbortController()
            const batchSignal = AbortSignal.any([...policy.abortSignals, batchController.signal])

            let cursor = 0
            const worker = async () => {
                while (!batchSignal.aborted) {
                    const i = cursor++
                    if (i >= policy.target.length) return
                    try {
                        results[i] = await this._runTask(policy.target[i], i, policy, batchSignal)
                    } catch (error) {
                        batchController.abort(error)
                        return
                    }
                    if (!results[i].success && policy.settings.failFast) {
                        batchController.abort(results[i].value)
                    }
                }
            }
            await Promise.all(
                Array.from({ length: Math.min(concurrency, policy.target.length) }, () => worker())
            )
            batchSignal.throwIfAborted()

            ctx.result = policy.settings.onlySuccess
                ? results.filter(r => r.success).map(r => r.value)
                : results.map(r => r.value)

            for (const mw of policy.middlewares.after) {
                if (mw._mode === "fluent") {
                    await mw.func(ctx as any)
                } else {
                    ctx = (await mw.func(ctx as any, { setResult, throwError }) ?? ctx) as typeof ctx
                }
            }

            for (const mw of policy.middlewares.onResult) {
                if (mw._mode === "fluent") {
                    ctx.result = await mw.func(ctx.result as any)
                } else {
                    ctx = (await mw.func(ctx as any, { setResult, throwError }) ?? ctx) as typeof ctx
                }
            }

            return {
                success: true,
                data: ctx.result as R,
                error: null
            }
        } catch (error) {
            return {
                success: false,
                data: null,
                error: error as VigorAllRequestError<T>
            }
        }
    }
}