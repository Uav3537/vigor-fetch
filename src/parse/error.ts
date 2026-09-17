import { VigorError, VigorErrorOptions, VigorResultError } from "@core/error";
import { VigorParseSchema } from "./main";
import type { VigorParseContextSchema } from "./context";

export const VigorParseErrorMessageFuncs = {
    VALUE_REQUIRED: ({ key }: { key: string }) => `Value Required (missing ${key})`,
    INVALID_CONTENT_TYPE: ({ received }: { received: unknown }) => `Invalid Content-Type header: ${String(received)}`,
    PARSER_NOT_FOUND: ({ received, expected }: { received: unknown, expected: Array<string> }) => `Parser not found for Content-Type "${String(received)}" (known: ${expected.join(", ")})`,
    PARSER_ALL_FAILED: ({ tried }: { tried: Array<string> }) => `All parsers failed, tried: ${tried.join(", ")}`,
    RESTART_EXHAUSTED: ({ maxAttempts }: { maxAttempts: number, error: unknown }) => `Restart exhausted, (max ${maxAttempts})`,
} as const

export type VigorParseErrorCodes = keyof typeof VigorParseErrorMessageFuncs

export type VigorParseErrorDatas<C extends VigorParseErrorCodes> =
    Parameters<typeof VigorParseErrorMessageFuncs[C]> extends [infer A]
        ? A
        : undefined;

/**
 * Every parse error code as its own union member, so narrowing by `code`
 * also narrows `data` to that code's payload.
 */
export type VigorParseErrors<T extends VigorParseSchema<any> = VigorParseSchema<any>> = {
    [C in VigorParseErrorCodes]: VigorParseError<C, T>
}[VigorParseErrorCodes]

/** `error` of a failed `requestVerbose()` — this module's errors, or anything else that was thrown. */
export type VigorParseRequestError<T extends VigorParseSchema<any> = any> = VigorResultError<VigorParseErrors<T>>

/** Error type thrown by the parse module. */
export class VigorParseError<
    C extends VigorParseErrorCodes,
    T extends VigorParseSchema<T>
> extends VigorError<
    C,
    VigorParseErrorDatas<C>,
    VigorParseContextSchema<T>
> {
    /**
     * @param code - One of the parse module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorParseErrorDatas<C>, VigorParseContextSchema<T>>) {
        const messageFn = VigorParseErrorMessageFuncs[code] as (arg: VigorParseErrorDatas<C>) => string
        super(code, messageFn(options.data), options)
    }
}

/**
 * Narrows an error from a failed result envelope to the parse module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 */
export const isVigorParseError = (error: unknown): error is VigorParseErrors =>
    error instanceof VigorParseError
