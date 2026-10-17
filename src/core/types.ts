import { VigorEmptyType } from "./symbol"

export type VigorPrimitive =
    | string
    | number
    | bigint
    | boolean
    | symbol
    | null
    | undefined

export type VigorBuiltin =
    | VigorPrimitive
    | Date
    | RegExp
    | Function
    | Map<any, any>
    | Set<any>
    | WeakMap<any, any>
    | WeakSet<any>
    | Promise<any>
    | Error
    // Platform classes: `_merge` only recurses into plain objects, so these
    // are replaced as a whole and must not be deep-merged member by member.
    | Request
    | Response
    | Headers
    | AbortSignal
    | Blob
    | FormData
    | URLSearchParams
    | ReadableStream<any>
    | ArrayBuffer
    | ArrayBufferView

export type VigorDeepPartial<T> =
    unknown extends T
        ? T
        : T extends VigorBuiltin
            ? T
            : T extends readonly (infer U)[]
                ? readonly VigorDeepPartial<U>[]
                : {
                    [K in keyof T]?:
                        VigorDeepPartial<T[K]>
                }

export type VigorSimplify<T> = {
    [K in keyof T]: T[K]
} & {}

/**
 * Type-level mirror of `VigorStatus._merge`: objects merge key by key, arrays
 * concatenate, anything else is overwritten. `S` is the same per-path
 * strategy tree `_merge` takes — a `"replace"` leaf replaces at that path.
 * An `undefined` value keeps the source value, like it does at runtime.
 */
export type VigorDeepMerge<
    A,
    B,
    S = undefined
> =
    [S] extends ["replace"]
        ? VigorReplaceWith<A, B>
        : 0 extends (1 & B)
            ? B
            : 0 extends (1 & A)
                ? B
                : VigorDeepMergeValue<A, B, S>

type VigorDeepMergeValue<A, B, S> =
    A extends VigorBuiltin
        ? B
        : B extends VigorBuiltin
            ? B
            : A extends readonly any[]
                ? B extends readonly any[]
                    ? [...A, ...B]
                    : B
                : A extends object
                    ? B extends object
                        ? VigorSimplify<{
                            [K in
                                keyof A |
                                keyof B]:
                                K extends keyof B
                                    ? K extends keyof A
                                        ? VigorDeepMergeKey<
                                            A[K],
                                            B[K],
                                            VigorStrategyAt<S, K>
                                        >
                                        : B[K]
                                    : K extends keyof A
                                        ? A[K]
                                        : never
                        }>
                        : B
                    : B

/**
 * `B` replacing `A`. Config lists are mutable arrays, while a `const`-inferred
 * array is `readonly`, so an array replacing a mutable array is made mutable
 * (like a concatenation `[...A, ...B]` is). Anything else is kept exactly.
 */
type VigorReplaceWith<A, B> =
    [A] extends [any[]]
        ? B extends readonly any[] ? [...B] : B
        : B

/**
 * Merges one key: an `undefined` (or optional) value keeps the source value.
 * A `"replace"` path always takes `B` — `.cast<undefined>()` replaces too
 * (its runtime value is a placeholder, never `undefined`).
 */
type VigorDeepMergeKey<A, B, S> =
    [S] extends ["replace"]
        ? VigorReplaceWith<A, B>
        : unknown extends B
            ? B
            : undefined extends B
                ? A | VigorDeepMerge<A, Exclude<B, undefined>, S>
                : VigorDeepMerge<A, B, S>

/** The strategy subtree for key `K`, or `undefined` when there is none. */
type VigorStrategyAt<S, K> =
    S extends object
        ? K extends keyof S
            ? S[K]
            : undefined
        : undefined

/** All keys of `T`, across every member when `T` is a union. */
type VigorKeysOf<T> = T extends unknown ? keyof T : never

/** `T[K]`, across every member of a union `T` that has `K`. */
type VigorPropOf<T, K> = T extends unknown ? K extends keyof T ? T[K] : never : never

/**
 * Intersected with a config-object parameter `N` to reject keys `Shape`
 * doesn't have, at any depth. A generic `const N` gets no excess-property
 * check, so without this `{ maxAttempts: 3, timeot: 5 }` would compile.
 */
export type VigorNoExtraKeys<N, Shape> =
    N extends VigorBuiltin | readonly any[]
        ? unknown
        : unknown extends Shape
            ? unknown
            : {
                [K in Exclude<keyof N, VigorKeysOf<Shape>>]: never
            } & {
                [K in keyof N & VigorKeysOf<Shape>]: VigorNoExtraKeys<N[K], NonNullable<VigorPropOf<Shape, K>>>
            }

export type VigorReplaceType<
    T,
    K extends keyof T,
    V
> = VigorSimplify<{
    [P in keyof T]:
        P extends K
            ? V
            : T[P]
}>

export type VigorConcat<T extends readonly any[], U extends readonly any[]> = [...T, ...U];

export type VigorLastOf<T extends readonly any[]> = T extends [...infer _, infer L] ? L : never;

export type VigorReturnType<T> = T extends (...args: Array<any>) => any
    ? Awaited<ReturnType<T>>
    : never

/**
 * Resolves the effective result type for a builder that supports `.cast<T>()`.
 *
 * If `Cast` is anything other than the `VigorEmpty` sentinel (i.e. `.cast<T>()`
 * was called at least once), it always wins — regardless of how many times
 * `target()`/`strategies()`/etc. were called before or after it, and even
 * when it is `never` or `any`. Otherwise the naturally-inferred `Natural` type
 * (e.g. derived from the target function's return type through the
 * middleware pipeline) is used.
 */
export type VigorCastResult<Cast, Natural> =
    0 extends (1 & Cast)
        ? Cast
        : [Cast] extends [VigorEmptyType]
            ? [VigorEmptyType] extends [Cast]
                ? Natural
                : Cast
            : Cast

export type VigorMergeMode = "merge" | "replace" | "concat"

export type VigorMergeStrategy<T> =
    T extends VigorBuiltin
        ? VigorMergeMode | undefined
        : T extends readonly any[]
            ? VigorMergeMode
            : {
                [K in keyof T]?: VigorMergeStrategy<T[K]> | VigorMergeMode
            }