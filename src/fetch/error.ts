import { VigorError, VigorErrorOptions, VigorResultError } from "@core/error";
import type { VigorRetryErrors } from "@retry/error";
import type { VigorParseErrors } from "@parse/error";
import { VigorFetchSchema } from "./main";
import type { VigorFetchContextSchema } from "./context";

export const VigorFetchErrorMessageFuncs = {
    VALUE_REQUIRED: ({ key }: { key: string }) => `Value Required (missing ${key})`,
    INVALID_BODY: ({ received }: { received: unknown }) => `Invalid Body type: ${typeof received}`,
    INVALID_PROTOCOL: ({ origin, base }: { origin: string, base: string | undefined }) => base
        ? `Invalid URL: could not resolve "${origin}" against base "${base}"`
        : `Invalid URL: "${origin}" is not an absolute URL, and no base (window.location) is available to resolve it against — pass an absolute origin (e.g. "https://api.example.com") when running outside a browser`,
    FETCH_FAILED: ({ status, statusText }: { status: number, statusText: string, response: Response, url: string, parsed: unknown }) => `Fetch Failed: ${status} ${statusText}`,
    RESTART_EXHAUSTED: ({ maxAttempts }: { maxAttempts: number, error: unknown }) => `Restart exhausted, (max ${maxAttempts})`,
    REDIRECTED: ({ url, status }: { url: string, status: number, response: Response }) => `Redirected (${status}) to "${url}" — navigating away`,
} as const

export type VigorFetchErrorCodes = keyof typeof VigorFetchErrorMessageFuncs

export type VigorFetchErrorDatas<C extends VigorFetchErrorCodes> =
    Parameters<typeof VigorFetchErrorMessageFuncs[C]> extends [infer A]
        ? A
        : undefined;

/**
 * Every fetch error code as its own union member, so narrowing by `code`
 * also narrows `data` to that code's payload.
 */
export type VigorFetchErrors<T extends VigorFetchSchema<any> = VigorFetchSchema<any>> = {
    [C in VigorFetchErrorCodes]: VigorFetchError<C, T>
}[VigorFetchErrorCodes]

/**
 * `error` of a failed `requestVerbose()`. Includes the nested engines'
 * errors, since fetch surfaces them as-is: a retried-out request fails with
 * `VigorRetryError("RETRY_EXHAUSTED")` (its `cause` holding the last
 * `VigorFetchError`), and a body that can't be parsed fails with a
 * `VigorParseError`.
 */
export type VigorFetchRequestError<T extends VigorFetchSchema<any> = any> =
    VigorResultError<VigorFetchErrors<T> | VigorRetryErrors | VigorParseErrors>

/** Error type thrown by the fetch module. */
export class VigorFetchError<
    C extends VigorFetchErrorCodes,
    T extends VigorFetchSchema<T>
> extends VigorError<
    C,
    VigorFetchErrorDatas<C>,
    VigorFetchContextSchema<T>
> {
    /**
     * @param code - One of the fetch module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorFetchErrorDatas<C>, VigorFetchContextSchema<T>>) {
        const messageFn = VigorFetchErrorMessageFuncs[code] as (arg: VigorFetchErrorDatas<C>) => string
        super(code, messageFn(options.data), options)
    }
}

/**
 * Narrows an error from a failed result envelope to the fetch module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 */
export const isVigorFetchError = (error: unknown): error is VigorFetchErrors =>
    error instanceof VigorFetchError
