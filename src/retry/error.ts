import { VigorError, VigorErrorContext, VigorErrorOptions, VigorResultError } from "@core/error";
import { VigorRetrySchema } from "./main";
import type { VigorRetryContextSchema } from "./context";

export const VigorRetryErrorMessageFuncs = {
    VALUE_REQUIRED: ({ key }: { key: string }) => `Value Required (missing ${key})`,
    RETRY_EXHAUSTED: ({ maxAttempts }: { maxAttempts: number, error: unknown }) => `Retry exhausted, (max ${maxAttempts})`,
    RESTART_EXHAUSTED: ({ maxAttempts }: { maxAttempts: number, error: unknown }) => `Restart exhausted, (max ${maxAttempts})`,
    TIMED_OUT: ({ limit }: { limit: number }) => `Timeout: exceeded ${limit}ms`,
} as const

export type VigorRetryErrorCodes = keyof typeof VigorRetryErrorMessageFuncs

export type VigorRetryErrorDatas<C extends VigorRetryErrorCodes> =
    Parameters<typeof VigorRetryErrorMessageFuncs[C]> extends [infer A]
        ? A
        : undefined;

/**
 * Every retry error code as its own union member, so narrowing by `code`
 * also narrows `data` to that code's payload.
 */
export type VigorRetryErrors<T extends VigorRetrySchema<any> = VigorRetrySchema<any>> = {
    [C in VigorRetryErrorCodes]: VigorRetryError<C, T>
}[VigorRetryErrorCodes]

/**
 * `error` of a failed `requestVerbose()` — this module's errors, or anything else that was thrown.
 *
 * Typed with the request's own schema `T`, so `context` (and anything else
 * that depends on the config) is that request's, not a generic one.
 */
export type VigorRetryRequestError<T extends VigorRetrySchema<any> = any> = VigorResultError<VigorRetryErrors<T>>

/** Codes that may be raised without a run context. */
export type VigorRetryErrorCodesWithOptionalContext = "VALUE_REQUIRED"

/** Codes that are never raised with a run context. */
export type VigorRetryErrorCodesWithoutContext = never

/**
 * The `context` of a `VigorRetryError` with code `C`: the run context when
 * the code always has one, `| undefined` when it may not, `undefined` when
 * it never does. `VALUE_REQUIRED` is also raised by the `custom` algorithm when it has no target, outside a run.
 */
export type VigorRetryErrorContext<C extends VigorRetryErrorCodes, T extends VigorRetrySchema<any> = any> =
    VigorErrorContext<C, VigorRetryContextSchema<T>, VigorRetryErrorCodesWithOptionalContext, VigorRetryErrorCodesWithoutContext>

/** Error type thrown by the retry module. */
export class VigorRetryError<
    C extends VigorRetryErrorCodes,
    T extends VigorRetrySchema<T>
> extends VigorError<
    C,
    VigorRetryErrorDatas<C>,
    VigorRetryErrorContext<C, T>
> {
    /**
     * @param code - One of the retry module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorRetryErrorDatas<C>, VigorRetryErrorContext<C, T>>) {
        const messageFn = VigorRetryErrorMessageFuncs[code] as (arg: VigorRetryErrorDatas<C>) => string
        super(code, messageFn(options.data), options)
    }
}

/**
 * What `isVigorRetryError` narrows `E` to: the typed `VigorRetryError` members
 * already in `E` (so a `requestVerbose()` error keeps its request's
 * `context` type), limited to codes `C`. For an `unknown` input (a `catch`
 * binding, a `request()` rejection) there's no request to take types from,
 * so it's the generic `VigorRetryErrors<any>`.
 */
export type VigorRetryErrorsIn<E, C extends VigorRetryErrorCodes = VigorRetryErrorCodes> =
    // Not `unknown extends E`: an envelope's `X | {} | null | undefined` is
    // equivalent to `unknown` too, yet its `X` members are what to keep.
    [Extract<E, VigorRetryError<any, any>>] extends [never]
        ? Extract<VigorRetryErrors<any>, { code: C }>
        : Extract<Extract<E, VigorRetryError<any, any>>, { code: C }>

/**
 * Narrows an error from a failed result envelope to the retry module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 *
 * Pass one or more `codes` to also check the code: the error is then
 * narrowed to just those codes, so `data` is that code's payload right away.
 *
 * @example
 * if (isVigorRetryError(error, "TIMED_OUT")) {
 *     error.data // that code's payload
 * }
 */
export function isVigorRetryError<E>(error: E): error is E & VigorRetryErrorsIn<E>
export function isVigorRetryError<E, const C extends VigorRetryErrorCodes>(error: E, ...codes: [C, ...C[]]): error is E & VigorRetryErrorsIn<E, C>
export function isVigorRetryError(error: unknown, ...codes: VigorRetryErrorCodes[]): boolean {
    return error instanceof VigorRetryError && (codes.length === 0 || codes.includes(error.code))
}
