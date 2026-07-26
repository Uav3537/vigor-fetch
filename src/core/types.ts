import { VigorExcludeEmpty } from "./symbol"

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

export type VigorDeepMerge<
    A,
    B
> =
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
                                        ? VigorDeepMerge<
                                            A[K],
                                            B[K]
                                        >
                                        : B[K]
                                    : K extends keyof A
                                        ? A[K]
                                        : never
                        }>
                        : B
                    : B

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
 * `target()`/`strategies()`/etc. were called before or after it. Otherwise the
 * naturally-inferred `Natural` type (e.g. derived from the target function's
 * return type through the middleware pipeline) is used.
 */
export type VigorCastResult<Cast, Natural> =
    [VigorExcludeEmpty<Cast>] extends [never]
        ? Natural
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