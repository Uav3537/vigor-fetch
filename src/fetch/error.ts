import { VigorError, VigorErrorContext, VigorErrorOptions, VigorResultError } from "@core/error";
import { VigorRetryError, VigorRetryErrorMessageFuncs } from "@retry/error";
import { VigorParseError, VigorParseErrorMessageFuncs } from "@parse/error";
import { VigorFetchSchema } from "./main";
import type { VigorFetchContextSchema } from "./context";
import type { VigorApiFailure, VigorResolvedMethod } from "./api";

export const VigorFetchErrorMessageFuncs = {
    ...VigorRetryErrorMessageFuncs,
    ...VigorParseErrorMessageFuncs,
    VALUE_REQUIRED: ({ key }: { key: string }) => `Value Required (missing ${key})`,
    INVALID_BODY: ({ received }: { received: unknown }) => `Invalid Body type: ${typeof received}`,
    BODY_NOT_ALLOWED: ({ method }: { method: string }) => `A ${method} request cannot have a body`,
    INVALID_PROTOCOL: ({ origin, base }: { origin: string, base: string | undefined }) => base
        ? `Invalid URL: could not resolve "${origin}" against base "${base}"`
        : `Invalid URL: "${origin}" is not an absolute URL, and no base (window.location) is available to resolve it against — pass an absolute origin (e.g. "https://api.example.com") when running outside a browser`,
    FETCH_FAILED: ({ status, statusText }: { status: number, statusText: string, response: Response, url: string, parsed: unknown }) => `Fetch Failed: ${status} ${statusText}`,
    RESTART_EXHAUSTED: ({ maxAttempts }: { maxAttempts: number, error: unknown }) => `Restart exhausted, (max ${maxAttempts})`,
    PATH_ESCAPED: ({ url, base }: { url: string, base: string }) => `Path escapes "${base}": the request would go to "${url}" (settings.confinePath)`,
    REDIRECTED: ({ url, status }: { url: string, status: number, response: Response }) => `Redirected (${status}) to "${url}" — navigating away`,
} as const

export type VigorFetchErrorCodes = keyof typeof VigorFetchErrorMessageFuncs

/**
 * The `data` of error code `C`. Most codes have a fixed shape; three depend
 * on the request `T`:
 *
 * - `FETCH_FAILED` — with an API map route that declares failure
 *   `responses`, one member per status, so narrowing `data.status` narrows
 *   `data.parsed` to that status's declared body.
 * - `RETRY_EXHAUSTED` / `RESTART_EXHAUSTED` — `data.error` (the last
 *   error) is typed as this request's errors, so a guard on it keeps them.
 */
export type VigorFetchErrorDatas<C extends VigorFetchErrorCodes, T extends VigorFetchSchema<any> = any> =
    C extends "FETCH_FAILED"
        ? VigorFetchFailedData<T>
        : C extends "RETRY_EXHAUSTED" | "RESTART_EXHAUSTED"
            ? { maxAttempts: number, error: VigorFetchRequestError<T> }
            : Parameters<typeof VigorFetchErrorMessageFuncs[C]> extends [infer A]
                ? A
                : undefined;

/** `FETCH_FAILED`'s `data` without an API map to take types from. */
type VigorFetchFailedDataBase = Parameters<typeof VigorFetchErrorMessageFuncs["FETCH_FAILED"]>[0]

/**
 * `FETCH_FAILED`'s `data` for request `T`: per declared failure status of
 * its matched route, `{ status, ..., parsed }` (`parsed` being `undefined`
 * when the body couldn't be parsed), with `parsed: unknown` for the rest.
 * Without a matching route, or with a `raw` parse (whose `parsed` is the
 * `Response`), it's the plain shape.
 */
export type VigorFetchFailedData<T extends VigorFetchSchema<any>> =
    0 extends (1 & T)
        ? VigorFetchFailedDataBase
        : T["policy"]["parse"]["policy"]["settings"]["raw"] extends true
            ? VigorFetchFailedDataBase
            : VigorApiFailure<T["apiMap"], VigorResolvedMethod<T["policy"]["method"], T["policy"]["body"]>, T["policy"]["path"]> extends infer F
                ? F extends { status: infer S, parsed: infer P }
                    ? { status: S, statusText: string, response: Response, url: string, parsed: P }
                    : never
                : never

/**
 * Every fetch error code as its own union member, so narrowing by `code`
 * also narrows `data` to that code's payload.
 */
export type VigorFetchErrors<T extends VigorFetchSchema<any> = VigorFetchSchema<any>> = {
    [C in VigorFetchErrorCodes]: VigorFetchError<C, T>
}[VigorFetchErrorCodes]

/**
 * `error` of a failed `requestVerbose()`. The nested engines' failures come
 * as fetch errors with their own codes: a retried-out request fails with
 * `VigorFetchError("RETRY_EXHAUSTED")` (its `data.error` holding the last
 * attempt's error), a body that can't be parsed with e.g.
 * `VigorFetchError("PARSER_NOT_FOUND")`.
 *
 * Typed with the request's own schema `T`, so `context` (and anything else
 * that depends on the config) is that request's, not a generic one.
 */
export type VigorFetchRequestError<T extends VigorFetchSchema<any> = any> =
    VigorResultError<VigorFetchErrors<T>>

/** Codes that may be raised without a run context. */
export type VigorFetchErrorCodesWithOptionalContext = "VALUE_REQUIRED"

/** Codes that are never raised with a run context. */
export type VigorFetchErrorCodesWithoutContext = never

/**
 * The `context` of a `VigorFetchError` with code `C`: the run context when
 * the code always has one, `| undefined` when it may not, `undefined` when
 * it never does. `VALUE_REQUIRED` is also raised by `.route()` for a missing param, while building, before any run.
 */
export type VigorFetchErrorContext<C extends VigorFetchErrorCodes, T extends VigorFetchSchema<any> = any> =
    VigorErrorContext<C, VigorFetchContextSchema<T>, VigorFetchErrorCodesWithOptionalContext, VigorFetchErrorCodesWithoutContext>

/** Error type thrown by the fetch module. */
export class VigorFetchError<
    C extends VigorFetchErrorCodes,
    T extends VigorFetchSchema<T>
> extends VigorError<
    C,
    VigorFetchErrorDatas<C, T>,
    VigorFetchErrorContext<C, T>
> {
    /**
     * @param code - One of the fetch module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorFetchErrorDatas<C, T>, VigorFetchErrorContext<C, T>>) {
        const messageFn = VigorFetchErrorMessageFuncs[code] as (arg: VigorFetchErrorDatas<C, T>) => string
        super(code, messageFn(options.data), options)
    }
}

/**
 * What `isVigorFetchError` narrows `E` to: the typed `VigorFetchError` members
 * already in `E` (so a `requestVerbose()` error keeps its request's
 * `context` type), limited to codes `C`. For an `unknown` input (a `catch`
 * binding, a `request()` rejection) there's no request to take types from,
 * so it's the generic `VigorFetchErrors<any>`.
 */
export type VigorFetchErrorsIn<E, C extends VigorFetchErrorCodes = VigorFetchErrorCodes> =
    // Not `unknown extends E`: an envelope's `X | {} | null | undefined` is
    // equivalent to `unknown` too, yet its `X` members are what to keep.
    [Extract<E, VigorFetchError<any, any>>] extends [never]
        ? Extract<VigorFetchErrors<any>, { code: C }>
        : Extract<Extract<E, VigorFetchError<any, any>>, { code: C }>

/**
 * Narrows an error from a failed result envelope to the fetch module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 *
 * Pass one or more `codes` to also check the code: the error is then
 * narrowed to just those codes, so `data` is that code's payload right away.
 *
 * @example
 * if (isVigorFetchError(error, "FETCH_FAILED")) {
 *     error.data // that code's payload
 * }
 */
export function isVigorFetchError<E>(error: E): error is E & VigorFetchErrorsIn<E>
export function isVigorFetchError<E, const C extends VigorFetchErrorCodes>(error: E, ...codes: [C, ...C[]]): error is E & VigorFetchErrorsIn<E, C>
export function isVigorFetchError(error: unknown, ...codes: VigorFetchErrorCodes[]): boolean {
    return error instanceof VigorFetchError && (codes.length === 0 || codes.includes(error.code))
}

/**
 * Re-raises an error of the nested retry/parse engine as a `VigorFetchError`
 * with the same `code`, `data`, and `method`, keeping the original as
 * `cause`. A `data.error` (the underlying error of `RETRY_EXHAUSTED` /
 * `RESTART_EXHAUSTED`) is adopted the same way. Anything else — a fetch
 * error, an error your middleware threw, an abort reason — is returned as-is.
 */
export function adoptVigorFetchError(error: unknown, context: VigorFetchContextSchema<any>): unknown {
    if (!(error instanceof VigorRetryError) && !(error instanceof VigorParseError)) return error
    const data: unknown = error.data
    const adopted = data !== null && typeof data === "object" && "error" in data
        ? { ...data, error: adoptVigorFetchError((data as { error: unknown }).error, context) }
        : data
    return new VigorFetchError(error.code as VigorFetchErrorCodes, {
        method: error.method,
        cause: error,
        data: adopted as VigorFetchErrorDatas<VigorFetchErrorCodes>,
        context
    })
}
