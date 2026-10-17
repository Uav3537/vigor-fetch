import { VigorError, VigorErrorContext, VigorErrorOptions, VigorResultError } from "@core/error";
import { VigorParseSchema } from "./main";
import type { VigorParseContextSchema } from "./context";

/** A short description of why one strategy failed, for `PARSER_ALL_FAILED`'s message. */
const describeVigorParseFailure = (error: unknown): string =>
    error instanceof Error ? `${error.name}: ${error.message}` : String(error)

export const VigorParseErrorMessageFuncs = {
    VALUE_REQUIRED: ({ key }: { key: string }) => `Value Required (missing ${key})`,
    INVALID_CONTENT_TYPE: ({ received }: { received: unknown }) => `Invalid Content-Type header: ${String(received)}`,
    PARSER_NOT_FOUND: ({ received, expected }: { received: unknown, expected: Array<string> }) => `Parser not found for Content-Type "${String(received)}" (known: ${expected.join(", ")})`,
    PARSER_ALL_FAILED: ({ tried, errors }: { tried: Array<string>, errors: Array<unknown> }) =>
        `All parsers failed: ${tried.map((name, i) => `${name} (${describeVigorParseFailure(errors[i])})`).join(", ")}`,
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

/**
 * `error` of a failed `requestVerbose()` — this module's errors, or anything else that was thrown.
 *
 * Typed with the request's own schema `T`, so `context` (and anything else
 * that depends on the config) is that request's, not a generic one.
 */
export type VigorParseRequestError<T extends VigorParseSchema<any> = any> = VigorResultError<VigorParseErrors<T>>

/** Codes that may be raised without a run context. */
export type VigorParseErrorCodesWithOptionalContext = "PARSER_ALL_FAILED"

/** Codes that are never raised with a run context. */
export type VigorParseErrorCodesWithoutContext = "INVALID_CONTENT_TYPE" | "PARSER_NOT_FOUND"

/*
 * `PARSER_ALL_FAILED`'s `data.errors[i]` is why `data.tried[i]` failed, and
 * its `cause` is the last of them — so a bad JSON body keeps its `SyntaxError`.
 *
 * `PARSER_NOT_FOUND` is no longer raised by the built-in strategies (an
 * unknown `Content-Type` falls back to a `Blob`); it stays available to
 * custom strategies.
 */

/**
 * The `context` of a `VigorParseError` with code `C`: the run context when
 * the code always has one, `| undefined` when it may not, `undefined` when
 * it never does. The strategies raise their errors on their own, with only the body: `INVALID_CONTENT_TYPE` and `PARSER_NOT_FOUND` never carry a context, and `PARSER_ALL_FAILED` only does when `request()` raises it (`VigorParseSniffStrategy` raises it too).
 */
export type VigorParseErrorContext<C extends VigorParseErrorCodes, T extends VigorParseSchema<any> = any> =
    VigorErrorContext<C, VigorParseContextSchema<T>, VigorParseErrorCodesWithOptionalContext, VigorParseErrorCodesWithoutContext>

/** Error type thrown by the parse module. */
export class VigorParseError<
    C extends VigorParseErrorCodes,
    T extends VigorParseSchema<T>
> extends VigorError<
    C,
    VigorParseErrorDatas<C>,
    VigorParseErrorContext<C, T>
> {
    /**
     * @param code - One of the parse module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorParseErrorDatas<C>, VigorParseErrorContext<C, T>>) {
        const messageFn = VigorParseErrorMessageFuncs[code] as (arg: VigorParseErrorDatas<C>) => string
        super(code, messageFn(options.data), options)
    }
}

/**
 * What `isVigorParseError` narrows `E` to: the typed `VigorParseError` members
 * already in `E` (so a `requestVerbose()` error keeps its request's
 * `context` type), limited to codes `C`. For an `unknown` input (a `catch`
 * binding, a `request()` rejection) there's no request to take types from,
 * so it's the generic `VigorParseErrors<any>`.
 */
export type VigorParseErrorsIn<E, C extends VigorParseErrorCodes = VigorParseErrorCodes> =
    // Not `unknown extends E`: an envelope's `X | {} | null | undefined` is
    // equivalent to `unknown` too, yet its `X` members are what to keep.
    [Extract<E, VigorParseError<any, any>>] extends [never]
        ? Extract<VigorParseErrors<any>, { code: C }>
        : Extract<Extract<E, VigorParseError<any, any>>, { code: C }>

/**
 * Narrows an error from a failed result envelope to the parse module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 *
 * Pass one or more `codes` to also check the code: the error is then
 * narrowed to just those codes, so `data` is that code's payload right away.
 *
 * @example
 * if (isVigorParseError(error, "PARSER_NOT_FOUND")) {
 *     error.data // that code's payload
 * }
 */
export function isVigorParseError<E>(error: E): error is E & VigorParseErrorsIn<E>
export function isVigorParseError<E, const C extends VigorParseErrorCodes>(error: E, ...codes: [C, ...C[]]): error is E & VigorParseErrorsIn<E, C>
export function isVigorParseError(error: unknown, ...codes: VigorParseErrorCodes[]): boolean {
    return error instanceof VigorParseError && (codes.length === 0 || codes.includes(error.code))
}
