import { createBrand, VigorBrand } from "@core/symbol"
import { VigorAllContextBase, VigorAllContextSchema, VigorAllEachContextBase, VigorAllEachContextSchema } from "./context"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorAllTypeLambda } from "./TL"
import { VigorAllPolicySettings, VigorAllPolicySettingsSchema } from "./settings"
import { VigorDeepPartial } from "@core/types"
import { VigorAllPolicyMiddlewares, VigorAllPolicyMiddlewaresSchema } from "./middlewares"
import { VigorAllError } from "./error"
import { VigorAllPolicyBase, VigorAllPolicySchema, VigorAllTask } from "./policy"

export * from "./policy"

export type VigorAllSchema<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "Schema">

    policy: VigorAllPolicySchema<T>
    context: VigorAllContextSchema<T>
}

export const VigorAllBase = {
    __brand: createBrand("All", "Schema"),

    policy: VigorAllPolicyBase,
    context: VigorAllContextBase
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
    /** Configures the all-policy's general settings (concurrency, onlySuccess). */
    public settings<
        const N extends VigorDeepPartial<VigorAllPolicySettingsSchema<T>>,
        R extends VigorAllSchema<any>
    >(
        input:
            | N
            | ((s: VigorAllPolicySettings<T>) => VigorAllPolicySettings<R>)
            | VigorAllPolicySettings<R>
    ) {
        if (typeof input === 'function' || input instanceof VigorAllPolicySettings) {
            const result = typeof input === 'function'
                ? input(new VigorAllPolicySettings<T>())
                : input
            return this._next(result.config as VigorDeepPartial<VigorAllSchema<any>>)
        }
        return this._next({ policy: { settings: input } } as const)
    }
    /** Configures the all-policy's per-task middleware pipeline. */
    public middlewares<
        const N extends VigorDeepPartial<VigorAllPolicyMiddlewaresSchema<T>>,
        R extends VigorAllSchema<any>
    >(
        input:
            | N
            | ((s: VigorAllPolicyMiddlewares<T>) => VigorAllPolicyMiddlewares<R>)
            | VigorAllPolicyMiddlewares<R>
    ) {
        if (typeof input === 'function' || input instanceof VigorAllPolicyMiddlewares) {
            const result = typeof input === 'function'
                ? input(new VigorAllPolicyMiddlewares<T>())
                : input
            return this._next(result.config as VigorDeepPartial<VigorAllSchema<any>>)
        }
        return this._next({ policy: { middlewares: input } } as const)
    }

    /** Runs a single task through the before/after/onError middleware pipeline. */
    private async _runTask(
        task: VigorAllTask,
        policy: VigorAllPolicySchema<any>
    ): Promise<{ success: true, value: unknown } | { success: false, value: unknown }> {
        let ctx: VigorAllEachContextSchema<any> = { ...VigorAllEachContextBase }

        try {
            for (const before of policy.middlewares.before) await before(ctx)
            ctx.result = await task()
            for (const after of policy.middlewares.after) await after(ctx)
            return { success: true, value: ctx.result }
        } catch (error) {
            ctx.error = error
            const setResult = (r: unknown) => { ctx.flags.overrided = true; ctx.result = r }
            for (const onError of policy.middlewares.onError) await onError(ctx, { setResult })
            if (ctx.flags.overrided) return { success: true, value: ctx.result }
            return { success: false, value: error }
        }
    }

    /** Runs all tasks and returns the results array directly, throwing on final failure. */
    public async request<R extends unknown[] = unknown[]>() {
        const res = await this.requestVerbose<R>()
        if(res.success) return res.data
        throw res.error
    }
    /** Runs all tasks and returns a result/error envelope instead of throwing. */
    public async requestVerbose<R extends unknown[] = unknown[]>() {
        return await this.requestRuntime<R>()
    }
    /** Internal execution loop implementing the bounded-concurrency worker pool. */
    private async requestRuntime<R extends unknown[] = unknown[]>(
        restartAttempt: number = 1
    ): Promise<
        {success: true, data: R, error: null} |
        {success: false, data: null, error: unknown}
    > {
        const config = this._merge(this.config, {}) as VigorAllSchema<T>
        const policy = config.policy

        try {
            if (policy.target.length === 0) throw new VigorAllError("EMPTY_TARGET", {
                method: "request",
                data: {}
            })

            const concurrency = Math.max(1, policy.settings.concurrency)
            const results: { success: boolean, value: unknown }[] = new Array(policy.target.length)

            let cursor = 0
            const worker = async () => {
                while (true) {
                    const i = cursor++
                    if (i >= policy.target.length) return
                    results[i] = await this._runTask(policy.target[i], policy)
                }
            }
            await Promise.all(
                Array.from({ length: Math.min(concurrency, policy.target.length) }, () => worker())
            )

            const result = policy.settings.onlySuccess
                ? results.filter(r => r.success).map(r => r.value)
                : results.map(r => r.value)

            return {
                success: true,
                data: result as R,
                error: null
            }
        } catch (error) {
            return {
                success: false,
                data: null,
                error
            }
        }
    }
}
