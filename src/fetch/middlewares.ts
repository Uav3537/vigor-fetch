import { createBrand, VigorBrand } from "@core/symbol"
import { VigorFetchBase, VigorFetchSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorFetchPolicyMiddlewaresTypeLambda } from "./TL"
import { VigorApply } from "@core/HKT"
import { VigorDeepMerge } from "@core/types"
import { VigorFetchOptions } from "./context"

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

    before: { _mode: "fluent", func: (ctx: T["context"]) => void }
    after: { _mode: "fluent", func: (ctx: T["context"]) => void }
    onResult: { _mode: "fluent", func: (res: T["context"]["result"]) => VigorFetchSchema<any>["context"]["result"] }
    onError: { _mode: "fluent", func: (err: T["context"]["error"]) => void }
}

export type VigorFetchPolicyMiddlewaresApi<
    T extends VigorFetchSchema<T>
> = {
    setResult: (res: VigorFetchSchema<any>["context"]["result"]) => void
    throwError: (err: VigorFetchSchema<any>["context"]["error"]) => void
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

    before: { _mode: "intercept", func: (ctx: T["context"], api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "throwError"|"setOptions"|"setHeaders"|"setBody">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]> }
    after: { _mode: "intercept", func: (ctx: T["context"], api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult"|"throwError">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]> }
    onResult: { _mode: "intercept", func: (ctx: T["context"], api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult"|"throwError">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]> }
    onError: { _mode: "intercept", func: (ctx: T["context"], api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult"|"throwError"|"proceedRestart"|"cancelRestart">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]> }
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
    public before<const N extends VigorFetchPolicyMiddlewaresFluent<any>["before"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { before: [{ _mode: "fluent", func: N }] } } }>>
    public before<const N extends VigorFetchPolicyMiddlewaresIntercept<any>["before"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { before: [{ _mode: "intercept", func: N }] } } }>>
    public before(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { before: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that runs after the response is received. */
    public after<const N extends VigorFetchPolicyMiddlewaresFluent<any>["after"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { after: [{ _mode: "fluent", func: N }] } } }>>
    public after<const N extends VigorFetchPolicyMiddlewaresIntercept<any>["after"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { after: [{ _mode: "intercept", func: N }] } } }>>
    public after(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { after: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that transforms or validates the parsed result. */
    public onResult<const N extends VigorFetchPolicyMiddlewaresFluent<any>["onResult"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onResult: [{ _mode: "fluent", func: N }] } } }>>
    public onResult<const N extends VigorFetchPolicyMiddlewaresIntercept<any>["onResult"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onResult: [{ _mode: "intercept", func: N }] } } }>>
    public onResult(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { onResult: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that runs when the request ultimately fails. */
    public onError<const N extends VigorFetchPolicyMiddlewaresFluent<any>["onError"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onError: [{ _mode: "fluent", func: N }] } } }>>
    public onError<const N extends VigorFetchPolicyMiddlewaresIntercept<any>["onError"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onError: [{ _mode: "intercept", func: N }] } } }>>
    public onError(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { onError: [{ _mode: type, func }] } } } as const)
    }
}
