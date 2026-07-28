import { createBrand, VigorBrand } from "@core/symbol"
import { VigorFetchBase, VigorFetchSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorFetchPolicyMiddlewaresTypeLambda } from "./TL"
import { VigorApply } from "@core/HKT"
import { VigorCastResult, VigorDeepMerge } from "@core/types"
import { VigorFetchOptions } from "./context"
import type { VigorFetchContextSchema, VigorFetchBeforeContextSchema, VigorFetchAfterContextSchema, VigorFetchOnResultContextSchema } from "./context"

export type VigorFetchPolicyMiddlewaresSchema<
    T extends VigorFetchSchema<T>
> = {
    __brand: VigorBrand<"Fetch", "Policy<Middlewares<Schema">

    before: (VigorFetchPolicyMiddlewaresFluent<T>["before"] | VigorFetchPolicyMiddlewaresIntercept<T>["before"])[]
    after: (VigorFetchPolicyMiddlewaresFluent<T>["after"] | VigorFetchPolicyMiddlewaresIntercept<T>["after"])[]
    onResult: (VigorFetchPolicyMiddlewaresFluent<T>["onResult"] | VigorFetchPolicyMiddlewaresIntercept<T>["onResult"])[]
    onError: (VigorFetchPolicyMiddlewaresFluent<T>["onError"] | VigorFetchPolicyMiddlewaresIntercept<T>["onError"])[]
}

export const VigorFetchPolicyMiddlewaresBase = {
    __brand: createBrand("Fetch", "Policy<Middlewares<Schema"),

    before: [] as [],
    after: [] as [],
    onResult: [] as [],
    onError: [] as []
} as const satisfies VigorFetchPolicyMiddlewaresSchema<any>

export type VigorFetchPolicyMiddlewaresFluent<
    T extends VigorFetchSchema<T>
> = {
    __brand: VigorBrand<"Fetch", "Policy<Middlewares<Fluent<Schema">

    before: { _mode: "fluent", func: (ctx: VigorFetchBeforeContextSchema<T>) => void }
    after: { _mode: "fluent", func: (ctx: VigorFetchAfterContextSchema<T>) => void }
    onResult: { _mode: "fluent", func: (res: VigorFetchOnResultContextSchema<T> extends { result: infer R } ? R : never) => VigorFetchContextSchema<any>["result"] }
    onError: { _mode: "fluent", func: (err: VigorFetchContextSchema<T>["error"]) => void }
}

export type VigorFetchPolicyMiddlewaresApi<
    T extends VigorFetchSchema<T>
> = {
    setResult: (res: VigorFetchContextSchema<any>["result"]) => void
    throwError: (err: VigorFetchContextSchema<any>["error"]) => void
    setOptions: (opts: VigorFetchOptions) => void
    setHeaders: (headers: VigorFetchOptions["headers"]) => void
    setBody: (body: VigorFetchOptions["body"]) => void
    proceedRestart: () => void
    cancelRestart: () => void
}

export type VigorFetchPolicyMiddlewaresIntercept<
    T extends VigorFetchSchema<T>
> = {
    __brand: VigorBrand<"Fetch", "Policy<Middlewares<Intercept<Schema">

    before: { _mode: "intercept", func: (ctx: VigorFetchBeforeContextSchema<T>, api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "throwError"|"setOptions"|"setHeaders"|"setBody">) => VigorFetchContextSchema<any> | Promise<VigorFetchContextSchema<any>> }
    after: { _mode: "intercept", func: (ctx: VigorFetchAfterContextSchema<T>, api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult"|"throwError">) => VigorFetchContextSchema<any> | Promise<VigorFetchContextSchema<any>> }
    onResult: { _mode: "intercept", func: (ctx: VigorFetchOnResultContextSchema<T>, api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult"|"throwError">) => VigorFetchContextSchema<any> | Promise<VigorFetchContextSchema<any>> }
    onError: { _mode: "intercept", func: (ctx: VigorFetchContextSchema<T>, api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult"|"throwError"|"proceedRestart"|"cancelRestart">) => VigorFetchContextSchema<any> | Promise<VigorFetchContextSchema<any>> }
}

/**
 * Immutable builder for a fetch policy's middleware pipeline (`before`,
 * `after`, `onResult`, `onError`). Each stage accepts either "fluent"
 * middleware (returns a plain value merged into the context) or
 * "intercept" middleware (receives an explicit API to mutate control flow).
 */
export class VigorFetchPolicyMiddlewares<
    T extends VigorFetchSchema<T> = typeof VigorFetchBase
> extends VigorStatus<VigorFetchSchema<any>, T, VigorFetchPolicyMiddlewaresTypeLambda> {
    constructor(config: T = VigorFetchBase as unknown as T) {
        super(VigorFetchBase as VigorFetchSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, C> {
        return new VigorFetchPolicyMiddlewares(config as unknown as VigorFetchSchema<any>) as unknown as VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, C>
    }

    /** Registers a middleware that runs before the request is sent. */
    public before<const N extends VigorFetchPolicyMiddlewaresFluent<T>["before"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { before: [{ _mode: "fluent", func: N }] } } }>>
    public before<const N extends VigorFetchPolicyMiddlewaresIntercept<T>["before"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { before: [{ _mode: "intercept", func: N }] } } }>>
    public before(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { before: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that runs after the response is received. */
    public after<const N extends VigorFetchPolicyMiddlewaresFluent<T>["after"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { after: [{ _mode: "fluent", func: N }] } } }>>
    public after<const N extends VigorFetchPolicyMiddlewaresIntercept<T>["after"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { after: [{ _mode: "intercept", func: N }] } } }>>
    public after(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { after: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that transforms or validates the parsed result. */
    public onResult<const N extends VigorFetchPolicyMiddlewaresFluent<T>["onResult"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onResult: [{ _mode: "fluent", func: N }] } } }>>
    public onResult<const N extends VigorFetchPolicyMiddlewaresIntercept<T>["onResult"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onResult: [{ _mode: "intercept", func: N }] } } }>>
    public onResult(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { onResult: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that runs when the request ultimately fails. */
    public onError<const N extends VigorFetchPolicyMiddlewaresFluent<T>["onError"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onError: [{ _mode: "fluent", func: N }] } } }>>
    public onError<const N extends VigorFetchPolicyMiddlewaresIntercept<T>["onError"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onError: [{ _mode: "intercept", func: N }] } } }>>
    public onError(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { onError: [{ _mode: type, func }] } } } as const)
    }
}

export type VigorFetchPipeInitialContext<
    T extends VigorFetchSchema<T>,
    R = VigorCastResult<T["cast"], unknown>
> = VigorDeepMerge<Omit<VigorFetchContextSchema<T, unknown>, "result">, { result: R }>

export type VigorFetchPipeStepVoid<
    Ctx,
    Arr
> = Arr extends [infer Head, ...infer Tail]
    ? Head extends { _mode: "intercept", func: (...args: any[]) => infer Ret }
        ? VigorFetchPipeStepVoid<Ret, Tail>
        : VigorFetchPipeStepVoid<Ctx, Tail>
    : Ctx

export type VigorFetchPipeStepResult<
    Ctx,
    Arr
> = Arr extends [infer Head, ...infer Tail]
    ? Head extends { _mode: "intercept", func: (...args: any[]) => infer Ret }
        ? VigorFetchPipeStepResult<Ret, Tail>
        : Head extends { _mode: "fluent", func: (...args: any[]) => infer FR }
            ? VigorFetchPipeStepResult<VigorDeepMerge<Ctx, { result: FR }>, Tail>
            : VigorFetchPipeStepResult<Ctx, Tail>
    : Ctx

export type VigorFetchPolicyMiddlewaresPipe<
    T extends VigorFetchSchema<T>
> = VigorFetchPipeStepVoid<
    VigorFetchPipeStepResult<
        VigorFetchPipeStepResult<
            VigorFetchPipeStepVoid<
                VigorFetchPipeInitialContext<T>,
                T["policy"]["middlewares"]["before"]
            >,
            T["policy"]["middlewares"]["after"]
        >,
        T["policy"]["middlewares"]["onResult"]
    >,
    T["policy"]["middlewares"]["onError"]
>

export type VigorFetchPipeResult<
    T extends VigorFetchSchema<T>
> = VigorFetchPolicyMiddlewaresPipe<T> extends { result: infer R }
    ? R
    : never