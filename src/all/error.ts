import { VigorError, VigorErrorOptions, VigorResultError } from "@core/error";
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

/** `error` of a failed `requestVerbose()` — this module's errors, or anything else that was thrown (e.g. a task's error under `failFast`). */
export type VigorAllRequestError<T extends VigorAllSchema<any> = any> = VigorResultError<VigorAllErrors<T>>

/** Error type thrown by the all module. */
export class VigorAllError<
    C extends VigorAllErrorCodes,
    T extends VigorAllSchema<T>
> extends VigorError<
    C,
    VigorAllErrorDatas<C>,
    VigorAllContextSchema<T>
> {
    /**
     * @param code - One of the all module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorAllErrorDatas<C>, VigorAllContextSchema<T>>) {
        const messageFn = VigorAllErrorMessageFuncs[code] as (arg: VigorAllErrorDatas<C>) => string
        super(code, messageFn(options.data), options)
    }
}

/**
 * Narrows an error from a failed result envelope to the all module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 */
export const isVigorAllError = (error: unknown): error is VigorAllErrors =>
    error instanceof VigorAllError
