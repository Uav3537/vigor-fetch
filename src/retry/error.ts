import { VigorError, VigorErrorOptions, VigorResultError } from "@core/error";
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

/** `error` of a failed `requestVerbose()` — this module's errors, or anything else that was thrown. */
export type VigorRetryRequestError<T extends VigorRetrySchema<any> = any> = VigorResultError<VigorRetryErrors<T>>

/** Error type thrown by the retry module. */
export class VigorRetryError<
    C extends VigorRetryErrorCodes,
    T extends VigorRetrySchema<T>
> extends VigorError<
    C,
    VigorRetryErrorDatas<C>,
    VigorRetryContextSchema<T>
> {
    /**
     * @param code - One of the retry module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorRetryErrorDatas<C>, VigorRetryContextSchema<T>>) {
        const messageFn = VigorRetryErrorMessageFuncs[code] as (arg: VigorRetryErrorDatas<C>) => string
        super(code, messageFn(options.data), options)
    }
}

/**
 * Narrows an error from a failed result envelope to the retry module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 */
export const isVigorRetryError = (error: unknown): error is VigorRetryErrors =>
    error instanceof VigorRetryError
