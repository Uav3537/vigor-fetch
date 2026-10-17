import { VigorError, VigorErrorContext, VigorErrorOptions, VigorResultError } from "@core/error";
import { VigorAllSchema } from "./main";
import type { VigorAllContextSchema } from "./context";

export const VigorAllErrorMessageFuncs = {
    EMPTY_TARGET: (_: {}) => `Empty target list`,
    TIMED_OUT: ({ limit, index }: { limit: number, index: number }) => `Task #${index} timeout: exceeded ${limit}ms`,
} as const

export type VigorAllErrorCodes = keyof typeof VigorAllErrorMessageFuncs

export type VigorAllErrorDatas<C extends VigorAllErrorCodes> =
    Parameters<typeof VigorAllErrorMessageFuncs[C]> extends [infer A]
        ? A
        : undefined;

/**
 * Every all error code as its own union member, so narrowing by `code`
 * also narrows `data` to that code's payload.
 */
export type VigorAllErrors<T extends VigorAllSchema<any> = VigorAllSchema<any>> = {
    [C in VigorAllErrorCodes]: VigorAllError<C, T>
}[VigorAllErrorCodes]

/**
 * `error` of a failed `requestVerbose()` — this module's errors, or anything else that was thrown (e.g. a task's error under `failFast`).
 *
 * Typed with the request's own schema `T`, so `context` (and anything else
 * that depends on the config) is that request's, not a generic one.
 */
export type VigorAllRequestError<T extends VigorAllSchema<any> = any> = VigorResultError<VigorAllErrors<T>>

/** Codes that may be raised without a run context. */
export type VigorAllErrorCodesWithOptionalContext = never

/** Codes that are never raised with a run context. */
export type VigorAllErrorCodesWithoutContext = "TIMED_OUT"

/**
 * The `context` of a `VigorAllError` with code `C`: the run context when
 * the code always has one, `| undefined` when it may not, `undefined` when
 * it never does. `TIMED_OUT` is raised for a single task (`data.index` says which), not with the batch context.
 */
export type VigorAllErrorContext<C extends VigorAllErrorCodes, T extends VigorAllSchema<any> = any> =
    VigorErrorContext<C, VigorAllContextSchema<T>, VigorAllErrorCodesWithOptionalContext, VigorAllErrorCodesWithoutContext>

/** Error type thrown by the all module. */
export class VigorAllError<
    C extends VigorAllErrorCodes,
    T extends VigorAllSchema<T>
> extends VigorError<
    C,
    VigorAllErrorDatas<C>,
    VigorAllErrorContext<C, T>
> {
    /**
     * @param code - One of the all module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorAllErrorDatas<C>, VigorAllErrorContext<C, T>>) {
        const messageFn = VigorAllErrorMessageFuncs[code] as (arg: VigorAllErrorDatas<C>) => string
        super(code, messageFn(options.data), options)
    }
}

/**
 * What `isVigorAllError` narrows `E` to: the typed `VigorAllError` members
 * already in `E` (so a `requestVerbose()` error keeps its request's
 * `context` type), limited to codes `C`. For an `unknown` input (a `catch`
 * binding, a `request()` rejection) there's no request to take types from,
 * so it's the generic `VigorAllErrors<any>`.
 */
export type VigorAllErrorsIn<E, C extends VigorAllErrorCodes = VigorAllErrorCodes> =
    // Not `unknown extends E`: an envelope's `X | {} | null | undefined` is
    // equivalent to `unknown` too, yet its `X` members are what to keep.
    [Extract<E, VigorAllError<any, any>>] extends [never]
        ? Extract<VigorAllErrors<any>, { code: C }>
        : Extract<Extract<E, VigorAllError<any, any>>, { code: C }>

/**
 * Narrows an error from a failed result envelope to the all module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 *
 * Pass one or more `codes` to also check the code: the error is then
 * narrowed to just those codes, so `data` is that code's payload right away.
 *
 * @example
 * if (isVigorAllError(error, "TIMED_OUT")) {
 *     error.data // that code's payload
 * }
 */
export function isVigorAllError<E>(error: E): error is E & VigorAllErrorsIn<E>
export function isVigorAllError<E, const C extends VigorAllErrorCodes>(error: E, ...codes: [C, ...C[]]): error is E & VigorAllErrorsIn<E, C>
export function isVigorAllError(error: unknown, ...codes: VigorAllErrorCodes[]): boolean {
    return error instanceof VigorAllError && (codes.length === 0 || codes.includes(error.code))
}
