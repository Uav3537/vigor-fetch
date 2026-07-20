import { createBrand, VigorBrand } from "@core/symbol"
import { VigorAllBase, VigorAllSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorAllPolicyMiddlewaresTypeLambda } from "./TL"
import { VigorApply } from "@core/HKT"
import { VigorAllEachContextSchema } from "./context"

export type VigorAllEachMiddlewareFn = (ctx: VigorAllEachContextSchema<any>) => void | Promise<void>
export type VigorAllEachOnErrorFn = (ctx: VigorAllEachContextSchema<any>, api: { setResult: (r: unknown) => void }) => void | Promise<void>

export type VigorAllPolicyMiddlewaresSchema<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "Policy<Middlewares<Schema">

    before: VigorAllEachMiddlewareFn[]
    after: VigorAllEachMiddlewareFn[]
    onError: VigorAllEachOnErrorFn[]
}

export const VigorAllPolicyMiddlewaresBase = {
    __brand: createBrand("All", "Policy<Middlewares<Schema"),

    before: [] as VigorAllEachMiddlewareFn[],
    after: [] as VigorAllEachMiddlewareFn[],
    onError: [] as VigorAllEachOnErrorFn[]
} as const satisfies VigorAllPolicyMiddlewaresSchema<any>

/** Immutable builder for an all-policy's per-task middleware pipeline (`before`, `after`, `onError`). */
export class VigorAllPolicyMiddlewares<
    T extends VigorAllSchema<T> = typeof VigorAllBase
> extends VigorStatus<VigorAllSchema<any>, T, VigorAllPolicyMiddlewaresTypeLambda> {
    constructor(config: T = VigorAllBase as unknown as T) {
        super(VigorAllBase as VigorAllSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, C> {
        return new VigorAllPolicyMiddlewares(config as unknown as VigorAllSchema<any>) as unknown as VigorApply<VigorAllPolicyMiddlewaresTypeLambda, C>
    }

    /** Registers a middleware that runs before each task is invoked. */
    public before<const N extends VigorAllEachMiddlewareFn>(func: N) {
        return this._next({ policy: { middlewares: { before: [func] } } } as const)
    }
    /** Registers a middleware that runs after each task settles successfully. */
    public after<const N extends VigorAllEachMiddlewareFn>(func: N) {
        return this._next({ policy: { middlewares: { after: [func] } } } as const)
    }
    /** Registers a middleware that runs when an individual task fails. */
    public onError<const N extends VigorAllEachOnErrorFn>(func: N) {
        return this._next({ policy: { middlewares: { onError: [func] } } } as const)
    }
}
