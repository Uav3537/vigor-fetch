import { createBrand, VigorBrand } from "@core/symbol"
import { VigorFetchBase, VigorFetchSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorFetchPolicyMiddlewaresTypeLambda } from "./TL"
import { VigorApply } from "@core/HKT"
import { VigorDeepMerge } from "@core/types"
import { VigorFetchOptions } from "./context"
import type { VigorParseResult, VigorParseSchema } from "@parse/main"
import type { VigorApiNoMatchType, VigorApiResponse, VigorResolvedMethod } from "./api"
import type { VigorFetchContextSchema, VigorFetchBeforeContextSchema, VigorFetchAfterContextSchema, VigorFetchOnResultContextSchema, VigorFetchOnErrorContextSchema } from "./context"

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

    before: { _mode: "fluent", func: (ctx: VigorFetchBeforeContextSchema<T>) => void|Promise<void> }
    after: { _mode: "fluent", func: (ctx: VigorFetchAfterContextSchema<T>) => void|Promise<void> }
    onResult: { _mode: "fluent", func: (res: VigorFetchOnResultContextSchema<T>["result"]) => VigorFetchContextSchema<any>["result"]|Promise<VigorFetchContextSchema<any>["result"]> }
    onError: { _mode: "fluent", func: (err: VigorFetchContextSchema<T>["error"]) => void|Promise<void> }
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
    onError: { _mode: "intercept", func: (ctx: VigorFetchOnErrorContextSchema<T>, api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult"|"throwError"|"proceedRestart"|"cancelRestart">) => VigorFetchContextSchema<any> | Promise<VigorFetchContextSchema<any>> }
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

/**
 * What the parse engine produces from the response: its result type
 * (`.cast<T>()`, `raw`, middlewares, `default`), with the `Response` as target.
 */
export type VigorFetchParsedResult<T extends VigorFetchSchema<T>> =
    VigorDeepMerge<T["policy"]["parse"], { policy: { target: Response } }, { policy: { target: "replace" } }> extends infer P
        ? P extends VigorParseSchema<any>
            ? VigorParseResult<P>
            : unknown
        : unknown

/**
 * The result type before `.cast<T>()`: a `raw` parse gives the `Response`
 * itself; otherwise the union of the API map's matched route's success
 * `responses` (see
 * `.apiMap()`), falling back to the parse engine's result where no route
 * matches.
 */
export type VigorFetchNaturalResult<T extends VigorFetchSchema<T>> =
    VigorFetchNaturalFor<T, VigorApiResponse<
        T["apiMap"],
        VigorResolvedMethod<T["policy"]["method"], T["policy"]["body"]>,
        T["policy"]["path"]
    >>

/**
 * The result type before `.cast<T>()` for API-map data `D` (one status's,
 * or the union of all): a `raw` parse gives the `Response`, and where no
 * route matched (`VigorApiNoMatchType`) the parse engine's result is used.
 */
export type VigorFetchNaturalFor<T extends VigorFetchSchema<T>, D> =
    T["policy"]["parse"]["policy"]["settings"]["raw"] extends true
        ? VigorFetchParsedResult<T>
        : Exclude<D, VigorApiNoMatchType> | (VigorApiNoMatchType extends D ? VigorFetchParsedResult<T> : never)

/**
 * The result the success pipeline produces. `Natural` is the result it
 * starts from (before `.cast<T>()`): by default the API map's whole success
 * union, or one status's data to follow that status through the pipeline.
 */
export type VigorFetchPipeResult<
    T extends VigorFetchSchema<T>,
    Natural = VigorFetchNaturalResult<T>
> = VigorFetchOnResultContextSchema<T, Natural>["result"]

/** `ctx.result` once the `onError` middlewares ran — what a recovered request (`setResult`) resolves to, as far as types go. */
export type VigorFetchErrorPipeResult<
    T extends VigorFetchSchema<T>
> = VigorFetchOnErrorContextSchema<T>["result"]
