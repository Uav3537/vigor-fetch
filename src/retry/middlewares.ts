import { createBrand, VigorBrand } from "@core/symbol"
import { VigorRetryBase, VigorRetrySchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorRetryPolicyMiddlewaresTypeLambda } from "./TL"
import { VigorApply } from "@core/HKT"
import { VigorCastResult, VigorDeepMerge, VigorReturnType } from "@core/types"
import type {
    VigorRetryContextSchema,
    VigorRetryBeforeContextSchema,
    VigorRetryAfterContextSchema,
    VigorRetryOnResultContextSchema
} from "./context"

export type VigorRetryPolicyMiddlewaresSchema<
    T extends VigorRetrySchema<T>
> = {
    __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">

    before: (VigorRetryPolicyMiddlewaresFluent<T>["before"] | VigorRetryPolicyMiddlewaresIntercept<T>["before"])[]
    after: (VigorRetryPolicyMiddlewaresFluent<T>["after"] | VigorRetryPolicyMiddlewaresIntercept<T>["after"])[]
    onResult: (VigorRetryPolicyMiddlewaresFluent<T>["onResult"] | VigorRetryPolicyMiddlewaresIntercept<T>["onResult"])[]
    retryIf: (VigorRetryPolicyMiddlewaresFluent<T>["retryIf"] | VigorRetryPolicyMiddlewaresIntercept<T>["retryIf"])[]
    onRetry: (VigorRetryPolicyMiddlewaresFluent<T>["onRetry"] | VigorRetryPolicyMiddlewaresIntercept<T>["onRetry"])[]
    onError: (VigorRetryPolicyMiddlewaresFluent<T>["onError"] | VigorRetryPolicyMiddlewaresIntercept<T>["onError"])[]
}

export const VigorRetryPolicyMiddlewaresBase = {
    __brand: createBrand("Retry", "Policy<Middlewares<Schema"),

    before: [] as [],
    after: [] as [],
    onResult: [] as [],
    retryIf: [] as [],
    onRetry: [] as [],
    onError: [] as []
} as const satisfies VigorRetryPolicyMiddlewaresSchema<any>

export type VigorRetryPolicyMiddlewaresFluent<
    T extends VigorRetrySchema<T>
> = {
    __brand: VigorBrand<"Retry", "Policy<Middlewares<Fluent<Schema">

    before: {
        _mode: "fluent",
        func: (ctx: VigorRetryBeforeContextSchema<T>) => void
    }
    after: {
        _mode: "fluent",
        func: (ctx: VigorRetryAfterContextSchema<T>) => void
    }
    onResult: {
        _mode: "fluent",
        func: (res: VigorRetryOnResultContextSchema<T> extends { result: infer R } ? R : never) => VigorRetryContextSchema<any>["result"]
    }
    retryIf: {
        _mode: "fluent",
        func: (err: VigorRetryContextSchema<T>["error"]) => VigorRetryContextSchema<any>["flags"]["doRetry"]
    }
    onRetry: {
        _mode: "fluent",
        func: (err: VigorRetryContextSchema<T>["error"]) => void
    }
    onError: {
        _mode: "fluent",
        func: (err: VigorRetryContextSchema<T>["error"]) => void
    }
}

export type VigorRetryPolicyMiddlewaresApi<
    T extends VigorRetrySchema<T>
> = {
    setResult: (res: VigorRetryContextSchema<any>["result"]) => void
    throwError: (err: VigorRetryContextSchema<any>["error"]) => void

    abort: (err: VigorRetryContextSchema<any>["error"]) => void
    breakRetry: (err: VigorRetryContextSchema<any>["error"]) => void

    proceedRetry: () => void
    cancelRetry: () => void

    setDelay: (num: VigorRetryContextSchema<any>["system"]["delay"]) => void

    proceedRestart: () => void
    cancelRestart: () => void
}

export type VigorRetryPolicyMiddlewaresIntercept<
    T extends VigorRetrySchema<T>
> = {
    __brand: VigorBrand<"Retry", "Policy<Middlewares<Intercept<Schema">

    before: {
        _mode: "intercept",
        func: (ctx: VigorRetryBeforeContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "abort"|"throwError"|"breakRetry">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>
    }
    after: {
        _mode: "intercept",
        func: (ctx: VigorRetryAfterContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "throwError">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>
    }
    onResult: {
        _mode: "intercept",
        func: (ctx: VigorRetryOnResultContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "setResult"|"throwError">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>
    }
    retryIf: {
        _mode: "intercept",
        func: (ctx: VigorRetryContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "proceedRetry"|"cancelRetry">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>
    }
    onRetry: {
        _mode: "intercept",
        func: (ctx: VigorRetryContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "throwError"|"setDelay">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>
    }
    onError: {
        _mode: "intercept",
        func: (ctx: VigorRetryContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "setResult"|"throwError"|"proceedRestart"|"cancelRestart">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>
    }
}

/**
 * Immutable builder for a retry policy's middleware pipeline (`before`,
 * `after`, `onResult`, `retryIf`, `onRetry`, `onError`). Each stage accepts
 * either "fluent" middleware (returns a plain value merged into the
 * context) or "intercept" middleware (receives an explicit API to mutate
 * control flow).
 */
export class VigorRetryPolicyMiddlewares<
    T extends VigorRetrySchema<T> = typeof VigorRetryBase
> extends VigorStatus<VigorRetrySchema<any>, T, VigorRetryPolicyMiddlewaresTypeLambda> {
    constructor(config: T = VigorRetryBase as unknown as T) {
        super(VigorRetryBase  as VigorRetrySchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, C> {
        return new VigorRetryPolicyMiddlewares(config as unknown as VigorRetrySchema<any>) as unknown as VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, C>
    }

    /** Registers a middleware that runs before the retried target is invoked. */
    public before<const N extends VigorRetryPolicyMiddlewaresFluent<T>["before"]["func"]>(
        type: "fluent",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { before: [{ _mode: "fluent", func: N }] } }
    }>>
    public before<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["before"]["func"]>(
        type: "intercept",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { before: [{ _mode: "intercept", func: N }] } }
    }>>
    public before(type: "fluent" | "intercept", func: any): any {
        return this._next({
            policy: { middlewares: { before: [{ _mode: type, func }] } }
        } as const);
    }


    /** Registers a middleware that runs after the retried target settles. */
    public after<const N extends VigorRetryPolicyMiddlewaresFluent<T>["after"]["func"]>(
        type: "fluent",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { after: [{ _mode: "fluent", func: N }] } }
    }>>
    public after<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["after"]["func"]>(
        type: "intercept",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { after: [{ _mode: "intercept", func: N }] } }
    }>>
    public after(type: "fluent" | "intercept", func: any): any {
        return this._next({
            policy: { middlewares: { after: [{ _mode: type, func }] } }
        } as const);
    }


    /** Registers a middleware to transform or validate the retry's result. */
    public onResult<const N extends VigorRetryPolicyMiddlewaresFluent<T>["onResult"]["func"]>(
        type: "fluent",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { onResult: [{ _mode: "fluent", func: N }] } }
    }>>
    public onResult<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["onResult"]["func"]>(
        type: "intercept",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { onResult: [{ _mode: "intercept", func: N }] } }
    }>>
    public onResult(type: "fluent" | "intercept", func: any): any {
        return this._next({
            policy: { middlewares: { onResult: [{ _mode: type, func }] } }
        } as const);
    }


    /** Registers a middleware that decides whether a failed attempt should be retried. */
    public retryIf<const N extends VigorRetryPolicyMiddlewaresFluent<T>["retryIf"]["func"]>(
        type: "fluent",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { retryIf: [{ _mode: "fluent", func: N }] } }
    }>>
    public retryIf<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["retryIf"]["func"]>(
        type: "intercept",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { retryIf: [{ _mode: "intercept", func: N }] } }
    }>>
    public retryIf(type: "fluent" | "intercept", func: any): any {
        return this._next({
            policy: { middlewares: { retryIf: [{ _mode: type, func }] } }
        } as const);
    }


    /** Registers a middleware invoked right before a retry attempt is scheduled. */
    public onRetry<const N extends VigorRetryPolicyMiddlewaresFluent<T>["onRetry"]["func"]>(
        type: "fluent",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { onRetry: [{ _mode: "fluent", func: N }] } }
    }>>
    public onRetry<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["onRetry"]["func"]>(
        type: "intercept",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { onRetry: [{ _mode: "intercept", func: N }] } }
    }>>
    public onRetry(type: "fluent" | "intercept", func: any): any {
        return this._next({
            policy: { middlewares: { onRetry: [{ _mode: type, func }] } }
        } as const);
    }


    /** Registers a middleware invoked when retries/restarts are exhausted. */
    public onError<const N extends VigorRetryPolicyMiddlewaresFluent<T>["onError"]["func"]>(
        type: "fluent",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { onError: [{ _mode: "fluent", func: N }] } }
    }>>
    public onError<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["onError"]["func"]>(
        type: "intercept",
        func: N
    ): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: { middlewares: { onError: [{ _mode: "intercept", func: N }] } }
    }>>
    public onError(type: "fluent" | "intercept", func: any): any {
        return this._next({
            policy: { middlewares: { onError: [{ _mode: type, func }] } }
        } as const);
    }
}

export type VigorRetryPipeInitialContext<
    T extends VigorRetrySchema<T>,
    R = VigorCastResult<T["cast"], VigorReturnType<T["policy"]["target"]>>
> = VigorDeepMerge<Omit<VigorRetryContextSchema<T, unknown>, "result">, { result: R }>

export type VigorRetryPipeStepVoid<
    Ctx,
    Arr
> = Arr extends [infer Head, ...infer Tail]
    ? Head extends { _mode: "intercept", func: (...args: any[]) => infer Ret }
        ? VigorRetryPipeStepVoid<Ret, Tail>
        : VigorRetryPipeStepVoid<Ctx, Tail>
    : Ctx

export type VigorRetryPipeStepResult<
    Ctx,
    Arr
> = Arr extends [infer Head, ...infer Tail]
    ? Head extends { _mode: "intercept", func: (...args: any[]) => infer Ret }
        ? VigorRetryPipeStepResult<Ret, Tail>
        : Head extends { _mode: "fluent", func: (...args: any[]) => infer FR }
            ? VigorRetryPipeStepResult<VigorDeepMerge<Ctx, { result: FR }>, Tail>
            : VigorRetryPipeStepResult<Ctx, Tail>
    : Ctx

export type VigorRetryPipeStepRetryIf<
    Ctx,
    Arr
> = Arr extends [infer Head, ...infer Tail]
    ? Head extends { _mode: "intercept", func: (...args: any[]) => infer Ret }
        ? VigorRetryPipeStepRetryIf<Ret, Tail>
        : Head extends { _mode: "fluent", func: (...args: any[]) => infer FR }
            ? VigorRetryPipeStepRetryIf<VigorDeepMerge<Ctx, { flags: { doRetry: FR } }>, Tail>
            : VigorRetryPipeStepRetryIf<Ctx, Tail>
    : Ctx

export type VigorRetryPolicyMiddlewaresPipe<
    T extends VigorRetrySchema<T>
> = VigorRetryPipeStepVoid<
    VigorRetryPipeStepVoid<
        VigorRetryPipeStepRetryIf<
            VigorRetryPipeStepResult<
                VigorRetryPipeStepVoid<
                    VigorRetryPipeStepVoid<
                        VigorRetryPipeInitialContext<T>,
                        T["policy"]["middlewares"]["before"]
                    >,
                    T["policy"]["middlewares"]["after"]
                >,
                T["policy"]["middlewares"]["onResult"]
            >,
            T["policy"]["middlewares"]["retryIf"]
        >,
        T["policy"]["middlewares"]["onRetry"]
    >,
    T["policy"]["middlewares"]["onError"]
>

export type VigorRetryPipeResult<
    T extends VigorRetrySchema<T>
> = VigorRetryPolicyMiddlewaresPipe<T> extends { result: infer R }
    ? R
    : never