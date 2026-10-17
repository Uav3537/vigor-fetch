import { createBrand, VigorBrand } from "@core/symbol"
import { VigorAllBase, VigorAllSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorAllPolicyMiddlewaresTypeLambda } from "./TL"
import { VigorApply } from "@core/HKT"
import { VigorCastResult, VigorDeepMerge } from "@core/types"
import { VigorAllNaturalResult } from "./policy"
import type {
    VigorAllContextSchema,
    VigorAllEachContextSchema,
    VigorAllBeforeContextSchema,
    VigorAllAfterContextSchema,
    VigorAllOnResultContextSchema
} from "./context"

/** Per-task hook (`beforeEach` / `afterEach`) — observes/mutates a single task's context, no return value. */
export type VigorAllEachMiddlewareFn = (ctx: VigorAllEachContextSchema<any>) => void | Promise<void>
/** Per-task failure hook (`onErrorEach`) — can override the task's outcome via `api.setResult`. */
export type VigorAllEachOnErrorFn = (ctx: VigorAllEachContextSchema<any>, api: { setResult: (r: unknown) => void }) => void | Promise<void>

export type VigorAllPolicyMiddlewaresSchema<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "Policy<Middlewares<Schema">

    /** Batch-level: runs once before any task starts. */
    before: (VigorAllPolicyMiddlewaresFluent<T>["before"] | VigorAllPolicyMiddlewaresIntercept<T>["before"])[]
    /** Batch-level: runs once after every task has settled. */
    after: (VigorAllPolicyMiddlewaresFluent<T>["after"] | VigorAllPolicyMiddlewaresIntercept<T>["after"])[]
    /** Batch-level: transforms/validates the aggregate result. */
    onResult: (VigorAllPolicyMiddlewaresFluent<T>["onResult"] | VigorAllPolicyMiddlewaresIntercept<T>["onResult"])[]
    /** Per-task: runs before each individual task is invoked. */
    beforeEach: VigorAllEachMiddlewareFn[]
    /** Per-task: runs after each individual task settles successfully. */
    afterEach: VigorAllEachMiddlewareFn[]
    /** Per-task: runs when an individual task fails. */
    onErrorEach: VigorAllEachOnErrorFn[]
}

export const VigorAllPolicyMiddlewaresBase = {
    __brand: createBrand("All", "Policy<Middlewares<Schema"),

    before: [] as [],
    after: [] as [],
    onResult: [] as [],
    beforeEach: [] as [],
    afterEach: [] as [],
    onErrorEach: [] as []
} as const satisfies VigorAllPolicyMiddlewaresSchema<any>

export type VigorAllPolicyMiddlewaresFluent<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "Policy<Middlewares<Fluent<Schema">

    before: { _mode: "fluent", func: (ctx: VigorAllBeforeContextSchema<T>) => void|Promise<void> }
    after: { _mode: "fluent", func: (ctx: VigorAllAfterContextSchema<T>) => void|Promise<void> }
    onResult: { _mode: "fluent", func: (res: VigorAllOnResultContextSchema<T> extends { result: infer R } ? R : never) => VigorAllContextSchema<any>["result"]|Promise<VigorAllContextSchema<any>["result"]> }
}

export type VigorAllPolicyMiddlewaresApi<
    T extends VigorAllSchema<T>
> = {
    setResult: (res: VigorAllContextSchema<any>["result"]) => void
    throwError: (err: unknown) => void
}

export type VigorAllPolicyMiddlewaresIntercept<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "Policy<Middlewares<Intercept<Schema">

    before: { _mode: "intercept", func: (ctx: VigorAllBeforeContextSchema<T>, api: Pick<VigorAllPolicyMiddlewaresApi<T>, "throwError">) => VigorAllContextSchema<any> | Promise<VigorAllContextSchema<any>> }
    after: { _mode: "intercept", func: (ctx: VigorAllAfterContextSchema<T>, api: Pick<VigorAllPolicyMiddlewaresApi<T>, "setResult"|"throwError">) => VigorAllContextSchema<any> | Promise<VigorAllContextSchema<any>> }
    onResult: { _mode: "intercept", func: (ctx: VigorAllOnResultContextSchema<T>, api: Pick<VigorAllPolicyMiddlewaresApi<T>, "setResult"|"throwError">) => VigorAllContextSchema<any> | Promise<VigorAllContextSchema<any>> }
}

/**
 * Immutable builder for an all-policy's middleware pipeline. Batch-level
 * stages (`before`, `after`, `onResult`) run once for the whole request and
 * accept either "fluent" middleware (returns a plain value merged into the
 * context) or "intercept" middleware (receives an explicit API to mutate
 * control flow). Per-task stages (`beforeEach`, `afterEach`, `onErrorEach`)
 * run once per task and are plain observer/mutator callbacks — there's no
 * batch-level `onError`, since the batch runs its tasks `allSettled`-style
 * and never fails because an individual task did.
 */
export class VigorAllPolicyMiddlewares<
    T extends VigorAllSchema<T> = typeof VigorAllBase
> extends VigorStatus<VigorAllSchema<any>, T, VigorAllPolicyMiddlewaresTypeLambda> {
    constructor(config: T = VigorAllBase as unknown as T) {
        super(VigorAllBase as VigorAllSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, C> {
        return new VigorAllPolicyMiddlewares(config as unknown as VigorAllSchema<any>) as unknown as VigorApply<VigorAllPolicyMiddlewaresTypeLambda, C>
    }

    /** Registers a middleware that runs once before any task starts. */
    public before<const N extends VigorAllPolicyMiddlewaresFluent<T>["before"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { before: [{ _mode: "fluent", func: N }] } } }>>
    public before<const N extends VigorAllPolicyMiddlewaresIntercept<T>["before"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { before: [{ _mode: "intercept", func: N }] } } }>>
    public before(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { before: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that runs once after every task has settled. */
    public after<const N extends VigorAllPolicyMiddlewaresFluent<T>["after"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { after: [{ _mode: "fluent", func: N }] } } }>>
    public after<const N extends VigorAllPolicyMiddlewaresIntercept<T>["after"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { after: [{ _mode: "intercept", func: N }] } } }>>
    public after(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { after: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that transforms or validates the aggregate result. */
    public onResult<const N extends VigorAllPolicyMiddlewaresFluent<T>["onResult"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onResult: [{ _mode: "fluent", func: N }] } } }>>
    public onResult<const N extends VigorAllPolicyMiddlewaresIntercept<T>["onResult"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onResult: [{ _mode: "intercept", func: N }] } } }>>
    public onResult(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { onResult: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that runs before each task is invoked. */
    public beforeEach<const N extends VigorAllEachMiddlewareFn>(func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { beforeEach: [N] } } }>> {
        return this._next({ policy: { middlewares: { beforeEach: [func] } } } as const)
    }
    /** Registers a middleware that runs after each task settles successfully. */
    public afterEach<const N extends VigorAllEachMiddlewareFn>(func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { afterEach: [N] } } }>> {
        return this._next({ policy: { middlewares: { afterEach: [func] } } } as const)
    }
    /** Registers a middleware that runs when an individual task fails. */
    public onErrorEach<const N extends VigorAllEachOnErrorFn>(func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onErrorEach: [N] } } }>> {
        return this._next({ policy: { middlewares: { onErrorEach: [func] } } } as const)
    }
}

export type VigorAllPipeInitialContext<
    T extends VigorAllSchema<T>,
    R = VigorCastResult<T["cast"], VigorAllNaturalResult<T>>
> = VigorDeepMerge<Omit<VigorAllContextSchema<T, unknown>, "result">, { result: R }>

export type VigorAllPipeStepVoid<
    Ctx,
    Arr
> = Arr extends [infer Head, ...infer Tail]
    ? Head extends { _mode: "intercept", func: (...args: any[]) => infer Ret }
        ? VigorAllPipeStepVoid<Ret, Tail>
        : VigorAllPipeStepVoid<Ctx, Tail>
    : Ctx

export type VigorAllPipeStepResult<
    Ctx,
    Arr
> = Arr extends [infer Head, ...infer Tail]
    ? Head extends { _mode: "intercept", func: (...args: any[]) => infer Ret }
        ? VigorAllPipeStepResult<Ret, Tail>
        : Head extends { _mode: "fluent", func: (...args: any[]) => infer FR }
            ? VigorAllPipeStepResult<VigorDeepMerge<Ctx, { result: FR }, { result: "replace" }>, Tail>
            : VigorAllPipeStepResult<Ctx, Tail>
    : Ctx

export type VigorAllPolicyMiddlewaresPipe<
    T extends VigorAllSchema<T>
> = VigorAllPipeStepResult<
    VigorAllPipeStepVoid<
        VigorAllPipeStepVoid<
            VigorAllPipeInitialContext<T>,
            T["policy"]["middlewares"]["before"]
        >,
        T["policy"]["middlewares"]["after"]
    >,
    T["policy"]["middlewares"]["onResult"]
>

export type VigorAllPipeResult<
    T extends VigorAllSchema<T>
> = VigorAllPolicyMiddlewaresPipe<T> extends { result: infer R }
    ? R
    : never
