import { createBrand, isVigorEmpty, VigorBrand, VigorEmpty, VigorEmptyType, VigorExcludeEmpty } from "@core/symbol"
import { VigorRetryBase, VigorRetrySchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorRetryPolicyAlgorithmsTypeLambda, VigorRetryPolicyAlgorithmsConstantTypeLambda, VigorRetryPolicyAlgorithmsLinearTypeLambda, VigorRetryPolicyAlgorithmsBackoffTypeLambda, VigorRetryPolicyAlgorithmsCustomTypeLambda } from "./TL"
import { VigorApply } from "@core/HKT"
import { VigorDeepPartial } from "@core/types"
import { VigorRetryError } from "./error"

/** Returns a random offset in the range `[-jitter, +jitter]` to randomize a computed delay. */
export function VigorJitter(jitter: number): number {
    return (Math.random() * 2 - 1) * jitter
}

export type VigorRetryPolicyAlgorithmsConstantSchema<
    T extends VigorRetryPolicyAlgorithmsConstantSchema<T>
> = {
    __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">

    _tag: "constant"
    jitter: number
    interval: number

    _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<T>) => number
}

export const VigorRetryPolicyAlgorithmsConstantBase = {
    __brand: createBrand("Retry", "Policy<Algorithms<Constant<Schema"),

    _tag: "constant",
    jitter: 1000,
    interval: 2000,

    _calculateDelay: (att, config) => {
        const { interval, jitter } = config

        const min = jitter
        let delay = Math.max(min, interval)
        delay += VigorJitter(jitter)

        return delay
    }
} as const satisfies VigorRetryPolicyAlgorithmsConstantSchema<any>

/** Immutable builder for the constant-interval retry delay algorithm. */
export class VigorRetryPolicyAlgorithmsConstant<
    T extends VigorRetryPolicyAlgorithmsConstantSchema<T> = typeof VigorRetryPolicyAlgorithmsConstantBase
> extends VigorStatus<VigorRetryPolicyAlgorithmsConstantSchema<any>, T, VigorRetryPolicyAlgorithmsConstantTypeLambda> {
    constructor(config: T = VigorRetryPolicyAlgorithmsConstantBase as unknown as T) {
        super(VigorRetryPolicyAlgorithmsConstantBase as VigorRetryPolicyAlgorithmsConstantSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorRetryPolicyAlgorithmsConstantTypeLambda, C> {
        return new VigorRetryPolicyAlgorithmsConstant(config as unknown as VigorRetryPolicyAlgorithmsConstantSchema<any>) as any
    }
    /** Sets the amount of random jitter added to the computed delay. */
    public jitter<const N extends VigorRetryPolicyAlgorithmsConstantSchema<any>["jitter"]>(num: N) {
        return this._next({ jitter: num } as const)
    }
    /** Sets the fixed delay interval, in milliseconds. */
    public interval<const N extends VigorRetryPolicyAlgorithmsConstantSchema<any>["interval"]>(num: N) {
        return this._next({ interval: num } as const)
    }
}

export type VigorRetryPolicyAlgorithmsLinearSchema<
    T extends VigorRetryPolicyAlgorithmsLinearSchema<T>
> = {
    __brand: VigorBrand<"Retry", "Policy<Algorithms<Linear<Schema">

    _tag: "linear"
    jitter: number
    initial: number
    increment: number
    minDelay: number
    maxDelay: number

    _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsLinearSchema<T>) => number
}

export const VigorRetryPolicyAlgorithmsLinearBase = {
    __brand: createBrand("Retry", "Policy<Algorithms<Linear<Schema"),

    _tag: "linear",
    jitter: 1000,
    initial: 500,
    increment: 1000,
    minDelay: 0,
    maxDelay: 10000,

    _calculateDelay: (att, config) => {
        const { initial, jitter, increment, minDelay, maxDelay } = config

        const range = maxDelay - minDelay
        const j = Math.min(jitter, range / 2)

        const min = minDelay + j
        const max = maxDelay - j

        let delay = initial + increment * att
        delay = Math.max(min, Math.min(max, delay))
        delay += VigorJitter(j)

        return delay
    }
} as const satisfies VigorRetryPolicyAlgorithmsLinearSchema<any>

/** Immutable builder for the linearly-increasing retry delay algorithm. */
export class VigorRetryPolicyAlgorithmsLinear<
    T extends VigorRetryPolicyAlgorithmsLinearSchema<T> = typeof VigorRetryPolicyAlgorithmsLinearBase
> extends VigorStatus<VigorRetryPolicyAlgorithmsLinearSchema<any>, T, VigorRetryPolicyAlgorithmsLinearTypeLambda> {
    constructor(config: T = VigorRetryPolicyAlgorithmsLinearBase as unknown as T) {
        super(VigorRetryPolicyAlgorithmsLinearBase as VigorRetryPolicyAlgorithmsLinearSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorRetryPolicyAlgorithmsLinearTypeLambda, C> {
        return new VigorRetryPolicyAlgorithmsLinear(config as unknown as VigorRetryPolicyAlgorithmsLinearSchema<any>) as any
    }
    /** Sets the amount of random jitter added to the computed delay. */
    public jitter<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["jitter"]>(num: N) {
        return this._next({ jitter: num } as const)
    }
    /** Sets the initial delay, in milliseconds, before the first retry. */
    public initial<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["initial"]>(num: N) {
        return this._next({ initial: num } as const)
    }
    /** Sets how much the delay grows, in milliseconds, per attempt. */
    public increment<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["increment"]>(num: N) {
        return this._next({ increment: num } as const)
    }
    /** Sets the minimum allowed delay, in milliseconds. */
    public minDelay<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["minDelay"]>(num: N) {
        return this._next({ minDelay: num } as const)
    }
    /** Sets the maximum allowed delay, in milliseconds. */
    public maxDelay<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["maxDelay"]>(num: N) {
        return this._next({ maxDelay: num } as const)
    }
}

export type VigorRetryPolicyAlgorithmsBackoffSchema<
    T extends VigorRetryPolicyAlgorithmsBackoffSchema<T>
> = {
    __brand: VigorBrand<"Retry", "Policy<Algorithms<Backoff<Schema">

    _tag: "backoff"
    jitter: number
    initial: number
    multiplier: number
    unit: number
    minDelay: number
    maxDelay: number

    _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsBackoffSchema<T>) => number
}

export const VigorRetryPolicyAlgorithmsBackoffBase = {
    __brand: createBrand("Retry", "Policy<Algorithms<Backoff<Schema"),

    _tag: "backoff",
    jitter: 800,
    initial: 0,
    multiplier: 1.7,
    unit: 1000,
    minDelay: 500,
    maxDelay: 10000,

    _calculateDelay: (att, config) => {
        const { jitter, initial, multiplier, unit, minDelay, maxDelay } = config

        const range = maxDelay - minDelay
        const j = Math.min(jitter, range / 2)

        const min = minDelay + j
        const max = maxDelay - j

        let delay = initial + unit * Math.pow(multiplier, att)
        delay = Math.max(min, Math.min(max, delay))
        delay += VigorJitter(j)

        return delay
    }
} as const satisfies VigorRetryPolicyAlgorithmsBackoffSchema<any>

/** Immutable builder for the exponential-backoff retry delay algorithm. */
export class VigorRetryPolicyAlgorithmsBackoff<
    T extends VigorRetryPolicyAlgorithmsBackoffSchema<T> = typeof VigorRetryPolicyAlgorithmsBackoffBase
> extends VigorStatus<VigorRetryPolicyAlgorithmsBackoffSchema<any>, T, VigorRetryPolicyAlgorithmsBackoffTypeLambda> {
    constructor(config: T = VigorRetryPolicyAlgorithmsBackoffBase as unknown as T) {
        super(VigorRetryPolicyAlgorithmsBackoffBase as VigorRetryPolicyAlgorithmsBackoffSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorRetryPolicyAlgorithmsBackoffTypeLambda, C> {
        return new VigorRetryPolicyAlgorithmsBackoff(config as unknown as VigorRetryPolicyAlgorithmsBackoffSchema<any>) as any
    }
    /** Sets the amount of random jitter added to the computed delay. */
    public jitter<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["jitter"]>(num: N) {
        return this._next({ jitter: num } as const)
    }
    /** Sets the initial delay, in milliseconds, before backoff growth is applied. */
    public initial<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["initial"]>(num: N) {
        return this._next({ initial: num } as const)
    }
    /** Sets the exponential growth factor applied per attempt. */
    public multiplier<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["multiplier"]>(num: N) {
        return this._next({ multiplier: num } as const)
    }
    /** Sets the base unit, in milliseconds, the multiplier is scaled by. */
    public unit<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["unit"]>(num: N) {
        return this._next({ unit: num } as const)
    }
    /** Sets the minimum allowed delay, in milliseconds. */
    public minDelay<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["minDelay"]>(num: N) {
        return this._next({ minDelay: num } as const)
    }
    /** Sets the maximum allowed delay, in milliseconds. */
    public maxDelay<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["maxDelay"]>(num: N) {
        return this._next({ maxDelay: num } as const)
    }
}


export type VigorRetryPolicyAlgorithmsCustomSchema<
    T extends VigorRetryPolicyAlgorithmsCustomSchema<T>
> = {
    __brand: VigorBrand<"Retry", "Policy<Algorithms<Custom<Schema">

    _tag: "custom"
    jitter: number
    minDelay: number
    maxDelay: number
    target: ((att: number) => number)|VigorEmptyType

    _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsCustomSchema<T>) => number
}

export const VigorRetryPolicyAlgorithmsCustomBase = {
    __brand: createBrand("Retry", "Policy<Algorithms<Custom<Schema"),

    _tag: "custom",
    jitter: 800,
    minDelay: 500,
    maxDelay: 10000,
    target: VigorEmpty,

    _calculateDelay: (att, config) => {
        const { jitter, minDelay, maxDelay, target } = config
        if (isVigorEmpty(target)) throw new VigorRetryError("VALUE_REQUIRED", {
            method: "_calculateDelay",
            data: {
                key: "target"
            }
        })

        const range = maxDelay - minDelay
        const j = Math.min(jitter, range / 2)

        const min = minDelay + j
        const max = maxDelay - j

        let delay = target(att)
        delay = Math.max(min, Math.min(max, delay))
        delay += VigorJitter(j)

        return delay
    }
} as const satisfies VigorRetryPolicyAlgorithmsCustomSchema<any>

/** Immutable builder for a user-supplied custom retry delay algorithm. */
export class VigorRetryPolicyAlgorithmsCustom<
    T extends VigorRetryPolicyAlgorithmsCustomSchema<T> = typeof VigorRetryPolicyAlgorithmsCustomBase
> extends VigorStatus<VigorRetryPolicyAlgorithmsCustomSchema<any>, T, VigorRetryPolicyAlgorithmsCustomTypeLambda> {
    constructor(config: T = VigorRetryPolicyAlgorithmsCustomBase as unknown as T) {
        super(VigorRetryPolicyAlgorithmsCustomBase as VigorRetryPolicyAlgorithmsCustomSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorRetryPolicyAlgorithmsCustomTypeLambda, C> {
        return new VigorRetryPolicyAlgorithmsCustom(config as unknown as VigorRetryPolicyAlgorithmsCustomSchema<any>) as any
    }
    /** Sets the amount of random jitter added to the computed delay. */
    public jitter<const N extends VigorRetryPolicyAlgorithmsCustomSchema<any>["jitter"]>(num: N) {
        return this._next({ jitter: num } as const)
    }
    /** Sets the minimum allowed delay, in milliseconds. */
    public minDelay<const N extends VigorRetryPolicyAlgorithmsCustomSchema<any>["minDelay"]>(num: N) {
        return this._next({ minDelay: num } as const)
    }
    /** Sets the maximum allowed delay, in milliseconds. */
    public maxDelay<const N extends VigorRetryPolicyAlgorithmsCustomSchema<any>["maxDelay"]>(num: N) {
        return this._next({ maxDelay: num } as const)
    }
    /** Sets the user-supplied function computing the raw delay for an attempt. */
    public target<const N extends VigorExcludeEmpty<VigorRetryPolicyAlgorithmsCustomSchema<any>["target"]>>(func: N) {
        return this._next({ target: func } as const)
    }
}

export type VigorRetryPolicyAlgorithmsSchema<
    T extends VigorRetrySchema<T>
> = (VigorRetryPolicyAlgorithmsConstantSchema<any> |
    VigorRetryPolicyAlgorithmsLinearSchema<any> |
    VigorRetryPolicyAlgorithmsBackoffSchema<any> |
    VigorRetryPolicyAlgorithmsCustomSchema<any>) & {
        _calculateDelay: (att: number, config: any) => number
    }

export const VigorRetryPolicyAlgorithmsBase =
    VigorRetryPolicyAlgorithmsConstantBase satisfies VigorRetryPolicyAlgorithmsSchema<any>

/**
 * Immutable builder for selecting a retry policy's delay algorithm.
 *
 * Switching algorithms (`constant`/`linear`/`backoff`/`custom`) always
 * replaces the previous algorithm's config wholesale via the `"replace"`
 * merge strategy, since the different algorithms' fields are not
 * compatible with one another.
 */
export class VigorRetryPolicyAlgorithms<
    T extends VigorRetrySchema<T> = typeof VigorRetryBase
> extends VigorStatus<VigorRetrySchema<any>, T, VigorRetryPolicyAlgorithmsTypeLambda> {
    constructor(config: T = VigorRetryBase as unknown as T) {
        super(VigorRetryBase as VigorRetrySchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorRetryPolicyAlgorithmsTypeLambda, C> {
        return new VigorRetryPolicyAlgorithms(config as unknown as VigorRetrySchema<any>) as any
    }

    /** Switches to the constant-interval delay algorithm. */
    public constant<
        const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsConstantSchema<any>, "_tag" | "__brand">>
    >(input?: N) {
        const leaf = this._merge(VigorRetryPolicyAlgorithmsConstantBase, input ?? {})
        return this._next({
            policy: { algorithms: leaf }
        } as const, { policy: { algorithms: "replace" } })
    }
    /** Switches to the linearly-increasing delay algorithm. */
    public linear<
        const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsLinearSchema<any>, "_tag" | "__brand">>
    >(input?: N) {
        const leaf = this._merge(VigorRetryPolicyAlgorithmsLinearBase, input ?? {})
        return this._next({
            policy: { algorithms: leaf }
        } as const, { policy: { algorithms: "replace" } })
    }
    /** Switches to the exponential-backoff delay algorithm. */
    public backoff<
        const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsBackoffSchema<any>, "_tag" | "__brand">>
    >(input?: N) {
        const leaf = this._merge(VigorRetryPolicyAlgorithmsBackoffBase, input ?? {})
        return this._next({
            policy: { algorithms: leaf }
        } as const, { policy: { algorithms: "replace" } })
    }
    /** Switches to a user-supplied custom delay algorithm. */
    public custom<
        const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsCustomSchema<any>, "_tag" | "__brand">>
    >(input?: N) {
        const leaf = this._merge(VigorRetryPolicyAlgorithmsCustomBase, input ?? {})
        return this._next({
            policy: { algorithms: leaf }
        } as const, { policy: { algorithms: "replace" } })
    }
}
