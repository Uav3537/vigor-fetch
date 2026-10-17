import { createBrand, isVigorEmpty, VigorBrand, VigorCastPlaceholder, VigorEmpty, VigorExcludeDefault } from "@core/symbol"
import { VigorAllContextBase, VigorAllContextSchema, VigorAllEachContextBase, VigorAllEachContextSchema } from "./context"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorAllTypeLambda } from "./TL"
import { VigorAllPolicySettings, VigorAllPolicySettingsSchema } from "./settings"
import { VigorDeepMerge, VigorDeepPartial, VigorNoExtraKeys } from "@core/types"
import { VigorAllPolicyMiddlewares, VigorAllPolicyMiddlewaresSchema } from "./middlewares"
import { VigorAllError, VigorAllRequestError } from "./error"
import { VigorAllPolicyBase, VigorAllPolicySchema, VigorAllTask } from "./policy"
import { VigorAllTimeline, VigorAllTimelineSnapshot } from "./timeline"
import { createVigorTimelineRecorder } from "@core/timeline"

export * from "./policy"
export * from "./timeline"

/** Largest delay `setTimeout` accepts — longer values overflow and fire immediately. */
const MAX_TIMEOUT = 2 ** 31 - 1

export type VigorAllSchema<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "Schema">

    policy: VigorAllPolicySchema<T>
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown
}

/** What `request()` resolves to. */
export type VigorAllResult<T extends VigorAllSchema<T>> = VigorExcludeDefault<VigorAllContextSchema<T>["result"]>

/** The builder `T` becomes after merging `P` in (with strategy tree `S`). */
type VigorAllNext<T, P, S = undefined> = VigorApply<VigorAllTypeLambda, VigorDeepMerge<T, P, S>>

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
    public target<const N extends VigorAllTask[]>(...funcs: N): VigorAllNext<T, { policy: { target: N } }> {
        return this._next({ policy: { target: funcs } } as const)
    }
    /** Sets external abort signals that, when aborted, cancel the remaining tasks and fail the batch. */
    public abortSignals<const N extends VigorAllSchema<T>["policy"]["abortSignals"]>(...sig: N): VigorAllNext<T, { policy: { abortSignals: N } }> {
        return this._next({ policy: { abortSignals: sig } } as const)
    }
    /** Configures the all-policy's general settings (concurrency, onlySuccess). */
    public settings<
        const N extends VigorDeepPartial<VigorAllPolicySettingsSchema<T>>
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorAllPolicySettingsSchema<T>>>): VigorAllNext<T, { policy: { settings: N } }>
    public settings<
        const B extends VigorAllPolicySettings<any>
    >(input: (s: VigorAllPolicySettings<T>) => B): VigorAllNext<T, { policy: { settings: B["config"]["policy"]["settings"] } }>
    public settings<
        const R extends VigorAllSchema<any>
    >(input: VigorAllPolicySettings<R>): VigorAllNext<T, { policy: { settings: R["policy"]["settings"] } }>
    public settings(input: any): any {
        if (typeof input === 'function' || input instanceof VigorAllPolicySettings) {
            // The callback builder starts from the current settings, so values it doesn't touch are kept.
            const result = typeof input === 'function'
                ? input(new VigorAllPolicySettings<T>(this.config))
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
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorAllPolicyMiddlewaresSchema<T>>>): VigorAllNext<T, { policy: { middlewares: N } }>
    /**
     * The callback's builder is typed as already holding this instance's
     * middlewares (so each new one sees the pipeline so far), while at
     * runtime it starts empty and its result is appended. Either way, its
     * type is the full list, so it replaces the current one.
     */
    public middlewares<
        const B extends VigorAllPolicyMiddlewares<any>
    >(input: (s: VigorAllPolicyMiddlewares<T>) => B): VigorAllNext<T, { policy: { middlewares: B["config"]["policy"]["middlewares"] } }, { policy: { middlewares: "replace" } }>
    public middlewares<
        const R extends VigorAllSchema<any>
    >(input: VigorAllPolicyMiddlewares<R>): VigorAllNext<T, { policy: { middlewares: R["policy"]["middlewares"] } }>
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
        batchSignal: AbortSignal,
        timeline: VigorAllTimeline,
        debug: boolean
    ): Promise<{ success: true, value: unknown } | { success: false, value: unknown }> {
        let ctx: VigorAllEachContextSchema<any> = this._merge(VigorAllEachContextBase, { index })
        // Same timeline as the batch, but entries snapshot this task's context.
        const { add, stage } = createVigorTimelineRecorder(timeline, (): VigorAllTimelineSnapshot => this._merge(ctx, {}), debug)

        const timeoutController = new AbortController()
        const signal = AbortSignal.any([batchSignal, timeoutController.signal])
        let timeoutId: ReturnType<typeof setTimeout> | undefined
        let onAbort: (() => void) | undefined

        add("TASK_STARTED", { index })
        const started = performance.now()
        const settle = <S extends { success: boolean, value: unknown }>(res: S) => {
            add("TASK_ENDED", { index, success: res.success, took: performance.now() - started })
            return res
        }

        try {
            await stage("beforeEach", policy.middlewares.beforeEach, (beforeEach) => beforeEach(ctx))
            signal.throwIfAborted()

            // Same as retry: `VigorEmpty`, `0`, a negative value, or `Infinity` disables the per-task timeout.
            const limit = policy.settings.timeout
            if (!isVigorEmpty(limit) && Number.isFinite(limit) && limit > 0) {
                timeoutId = setTimeout(() => timeoutController.abort(new VigorAllError("TIMED_OUT", {
                    method: "request",
                    data: { limit, index }
                })), Math.min(limit, MAX_TIMEOUT))
            }

            ctx.result = await Promise.race([
                task(signal),
                new Promise((_, rej) => {
                    onAbort = () => rej(signal.reason)
                    signal.addEventListener("abort", onAbort)
                })
            ])
            await stage("afterEach", policy.middlewares.afterEach, (afterEach) => afterEach(ctx))
            return settle({ success: true, value: ctx.result })
        } catch (error) {
            ctx.error = error
            add("TASK_ERROR", { index, error })
            const setResult = (r: unknown) => { ctx.flags.overridden = true; ctx.result = r }
            await stage("onErrorEach", policy.middlewares.onErrorEach, (onErrorEach, trace) => onErrorEach(ctx, trace({ setResult })))
            if (ctx.flags.overridden) return settle({ success: true, value: ctx.result })
            return settle({ success: false, value: error })
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
    public cast<const C>(): VigorAllNext<T, { cast: C }, { cast: "replace" }> {
        return this._next(
            { cast: VigorCastPlaceholder } as unknown as { cast: C },
            { cast: "replace" }
        )
    }
    /**
     * Runs all tasks and returns the results array directly, throwing on final failure.
     *
     * `R` defaults to the inferred result type. Passing one (`request<User>()`)
     * means "ignore the inference, it's this": it's taken as-is, unchecked.
     * To name the inferred type itself, use `VigorResultOf<typeof builder>`.
     */
    public async request<R = VigorAllResult<T>>(): Promise<R> {
        const res = await this.requestVerbose<R>()
        if(res.success) return res.data
        throw res.error
    }
    /**
     * Runs all tasks and returns a result/error envelope instead of throwing,
     * along with the `timeline` of everything the batch went through.
     */
    public async requestVerbose<R = VigorAllResult<T>>() {
        return await this.requestRuntime<R>()
    }
    /** Internal execution loop implementing the bounded-concurrency worker pool and the batch-level before/after/onResult pipeline. */
    private async requestRuntime<R = unknown>(
        timeline: VigorAllTimeline = []
    ): Promise<
        {success: true, data: R, error: null, timeline: VigorAllTimeline} |
        {success: false, data: null, error: VigorAllRequestError<T>, timeline: VigorAllTimeline}
    > {
        const config = this._merge(this.config, {}) as VigorAllSchema<T>
        const policy = config.policy

        let ctx: VigorAllContextSchema<any> = this._merge(VigorAllContextBase, {
            policy
        }, undefined, "replace")
        // Assigned after `_merge`, which would otherwise clone it: `ctx.timeline` is the array entries are pushed to.
        ctx.timeline = timeline

        const startedAt = performance.now()
        const { add, stage } = createVigorTimelineRecorder(timeline, (): VigorAllTimelineSnapshot => this._snapshot(ctx), config.policy.settings.debug)
        const end = (success: boolean, error: unknown) => add("REQUEST_END", {
            success, outcome: success ? "result" : "failed", error, took: performance.now() - startedAt, restarts: 0
        })
        const setResult = (r: unknown) => { ctx.result = r }
        const throwError = (err: unknown) => { throw err }

        const concurrency = Number.isNaN(policy.settings.concurrency)
            ? 1
            : Math.max(1, Math.floor(policy.settings.concurrency))
        add("PROCESS_HANDLING", { type: "REQUEST_START", data: { tasks: policy.target.length, concurrency } })

        try {
            if (policy.target.length === 0) throw new VigorAllError("EMPTY_TARGET", {
                method: "request",
                data: {},
                context: ctx
            })

            await stage("before", policy.middlewares.before, async (mw, trace) => {
                if (mw._mode === "fluent") {
                    await mw.func(ctx as any)
                } else {
                    ctx = (await mw.func(ctx as any, trace({ throwError })) ?? ctx) as typeof ctx
                }
            })

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
                        results[i] = await this._runTask(policy.target[i], i, policy, batchSignal, timeline, policy.settings.debug)
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

            // Each slot says whether its task succeeded, so a thrown error is
            // never mistaken for a returned value; `onlySuccess` keeps the values.
            ctx.result = policy.settings.onlySuccess
                ? results.filter(r => r.success).map(r => r.value)
                : results.map(r => r.success
                    ? { success: true, data: r.value, error: null }
                    : { success: false, data: null, error: r.value })

            await stage("after", policy.middlewares.after, async (mw, trace) => {
                if (mw._mode === "fluent") {
                    await mw.func(ctx as any)
                } else {
                    ctx = (await mw.func(ctx as any, trace({ setResult, throwError })) ?? ctx) as typeof ctx
                }
            })

            await stage("onResult", policy.middlewares.onResult, async (mw, trace) => {
                if (mw._mode === "fluent") {
                    ctx.result = await mw.func(ctx.result as any)
                } else {
                    ctx = (await mw.func(ctx as any, trace({ setResult, throwError })) ?? ctx) as typeof ctx
                }
            })

            end(true, null)
            return {
                success: true,
                data: ctx.result as R,
                error: null,
                timeline
            }
        } catch (error) {
            add("PROCESS_HANDLING", { type: "REQUEST_ERROR", data: { error } })
            end(false, error)
            return {
                success: false,
                data: null,
                error: error as VigorAllRequestError<T>,
                timeline
            }
        }
    }
}