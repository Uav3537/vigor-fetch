import { createBrand, VigorBrand } from "@core/symbol"
import { VigorParseBase, VigorParseSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorParsePolicyMiddlewaresTypeLambda } from "./TL"
import { VigorApply } from "@core/HKT"
import { VigorDeepMerge } from "@core/types"
import type { VigorParseContextSchema, VigorParseBeforeContextSchema, VigorParseAfterContextSchema, VigorParseOnResultContextSchema, VigorParseOnErrorContextSchema } from "./context"

export type VigorParsePolicyMiddlewaresSchema<
    T extends VigorParseSchema<T>
> = {
    __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">

    before: (VigorParsePolicyMiddlewaresFluent<T>["before"] | VigorParsePolicyMiddlewaresIntercept<T>["before"])[]
    after: (VigorParsePolicyMiddlewaresFluent<T>["after"] | VigorParsePolicyMiddlewaresIntercept<T>["after"])[]
    onResult: (VigorParsePolicyMiddlewaresFluent<T>["onResult"] | VigorParsePolicyMiddlewaresIntercept<T>["onResult"])[]
    onError: (VigorParsePolicyMiddlewaresFluent<T>["onError"] | VigorParsePolicyMiddlewaresIntercept<T>["onError"])[]
}

export const VigorParsePolicyMiddlewaresBase = {
    __brand: createBrand("Parse", "Policy<Middlewares<Schema"),

    before: [] as [],
    after: [] as [],
    onResult: [] as [],
    onError: [] as []
} as const satisfies VigorParsePolicyMiddlewaresSchema<any>

export type VigorParsePolicyMiddlewaresFluent<
    T extends VigorParseSchema<T>
> = {
    __brand: VigorBrand<"Parse", "Policy<Middlewares<Fluent<Schema">

    before: { _mode: "fluent", func: (ctx: VigorParseBeforeContextSchema<T>) => void|Promise<void> }
    after: { _mode: "fluent", func: (ctx: VigorParseAfterContextSchema<T>) => void|Promise<void> }
    onResult: { _mode: "fluent", func: (res: VigorParseOnResultContextSchema<T>["result"]) => VigorParseContextSchema<any>["result"]|Promise<VigorParseContextSchema<any>["result"]> }
    onError: { _mode: "fluent", func: (err: VigorParseContextSchema<T>["error"]) => void|Promise<void> }
}

export type VigorParsePolicyMiddlewaresApi<
    T extends VigorParseSchema<T>
> = {
    setResult: (res: VigorParseContextSchema<any>["result"]) => void
    throwError: (err: VigorParseContextSchema<any>["error"]) => void
    proceedRestart: () => void
    cancelRestart: () => void
}

export type VigorParsePolicyMiddlewaresIntercept<
    T extends VigorParseSchema<T>
> = {
    __brand: VigorBrand<"Parse", "Policy<Middlewares<Intercept<Schema">

    before: { _mode: "intercept", func: (ctx: VigorParseBeforeContextSchema<T>, api: Pick<VigorParsePolicyMiddlewaresApi<T>, "throwError">) => VigorParseContextSchema<any> | Promise<VigorParseContextSchema<any>> }
    after: { _mode: "intercept", func: (ctx: VigorParseAfterContextSchema<T>, api: Pick<VigorParsePolicyMiddlewaresApi<T>, "setResult"|"throwError">) => VigorParseContextSchema<any> | Promise<VigorParseContextSchema<any>> }
    onResult: { _mode: "intercept", func: (ctx: VigorParseOnResultContextSchema<T>, api: Pick<VigorParsePolicyMiddlewaresApi<T>, "setResult"|"throwError">) => VigorParseContextSchema<any> | Promise<VigorParseContextSchema<any>> }
    onError: { _mode: "intercept", func: (ctx: VigorParseOnErrorContextSchema<T>, api: Pick<VigorParsePolicyMiddlewaresApi<T>, "setResult"|"throwError"|"proceedRestart"|"cancelRestart">) => VigorParseContextSchema<any> | Promise<VigorParseContextSchema<any>> }
}

/**
 * Immutable builder for a parse policy's middleware pipeline (`before`,
 * `after`, `onResult`, `onError`). Each stage accepts either "fluent"
 * middleware (returns a plain value merged into the context) or
 * "intercept" middleware (receives an explicit API to mutate control flow).
 */
export class VigorParsePolicyMiddlewares<
    T extends VigorParseSchema<T> = typeof VigorParseBase
> extends VigorStatus<VigorParseSchema<any>, T, VigorParsePolicyMiddlewaresTypeLambda> {
    constructor(config: T = VigorParseBase as unknown as T) {
        super(VigorParseBase as VigorParseSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, C> {
        return new VigorParsePolicyMiddlewares(config as unknown as VigorParseSchema<any>) as unknown as VigorApply<VigorParsePolicyMiddlewaresTypeLambda, C>
    }

    /** Registers a middleware that runs before the response is parsed. */
    public before<const N extends VigorParsePolicyMiddlewaresFluent<T>["before"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { before: [{ _mode: "fluent", func: N }] } } }>>
    public before<const N extends VigorParsePolicyMiddlewaresIntercept<T>["before"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { before: [{ _mode: "intercept", func: N }] } } }>>
    public before(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { before: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that runs after the response has been parsed. */
    public after<const N extends VigorParsePolicyMiddlewaresFluent<T>["after"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { after: [{ _mode: "fluent", func: N }] } } }>>
    public after<const N extends VigorParsePolicyMiddlewaresIntercept<T>["after"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { after: [{ _mode: "intercept", func: N }] } } }>>
    public after(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { after: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that transforms or validates the parsed result. */
    public onResult<const N extends VigorParsePolicyMiddlewaresFluent<T>["onResult"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onResult: [{ _mode: "fluent", func: N }] } } }>>
    public onResult<const N extends VigorParsePolicyMiddlewaresIntercept<T>["onResult"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onResult: [{ _mode: "intercept", func: N }] } } }>>
    public onResult(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { onResult: [{ _mode: type, func }] } } } as const)
    }

    /** Registers a middleware that runs when parsing ultimately fails. */
    public onError<const N extends VigorParsePolicyMiddlewaresFluent<T>["onError"]["func"]>(
        type: "fluent", func: N
    ): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onError: [{ _mode: "fluent", func: N }] } } }>>
    public onError<const N extends VigorParsePolicyMiddlewaresIntercept<T>["onError"]["func"]>(
        type: "intercept", func: N
    ): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, { policy: { middlewares: { onError: [{ _mode: "intercept", func: N }] } } }>>
    public onError(type: "fluent" | "intercept", func: any): any {
        return this._next({ policy: { middlewares: { onError: [{ _mode: type, func }] } } } as const)
    }
}

/** The result the success pipeline produces: the parsed one (or `.cast<T>()`'s), through `after` and `onResult`. */
export type VigorParsePipeResult<
    T extends VigorParseSchema<T>
> = VigorParseOnResultContextSchema<T>["result"]

/** `ctx.result` once the `onError` middlewares ran — what a recovered run (`setResult`) resolves to, as far as types go. */
export type VigorParseErrorPipeResult<
    T extends VigorParseSchema<T>
> = VigorParseOnErrorContextSchema<T>["result"]
