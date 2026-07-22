import { VigorError, VigorErrorOptions } from "@core/error";
import { VigorFetchSchema } from "./main";

export const VigorFetchErrorMessageFuncs = {
    VALUE_REQUIRED: ({ key }: { key: string }) => `Value Required (missing ${key})`,
    INVALID_BODY: ({ received }: { received: unknown }) => `Invalid Body type: ${typeof received}`,
    INVALID_PROTOCOL: ({ origin, base }: { origin: string, base: string | undefined }) => base
        ? `Invalid URL: could not resolve "${origin}" against base "${base}"`
        : `Invalid URL: "${origin}" is not an absolute URL, and no base (window.location) is available to resolve it against — pass an absolute origin (e.g. "https://api.example.com") when running outside a browser`,
    FETCH_FAILED: ({ status, statusText }: { status: number, statusText: string, response: Response, url: string, parsed: unknown }) => `Fetch Failed: ${status} ${statusText}`,
    RESTART_EXHAUSTED: ({ maxAttempts }: { maxAttempts: number, error: unknown }) => `Restart exhausted, (max ${maxAttempts})`,
} as const

export type VigorFetchErrorCodes = keyof typeof VigorFetchErrorMessageFuncs

export type VigorFetchErrorDatas<C extends VigorFetchErrorCodes> =
    Parameters<typeof VigorFetchErrorMessageFuncs[C]> extends [infer A]
        ? A
        : undefined;

/** Error type thrown by the fetch module. */
export class VigorFetchError<
    C extends VigorFetchErrorCodes,
    T extends VigorFetchSchema<T>
> extends VigorError<
    C,
    VigorFetchErrorDatas<C>,
    T["context"]
> {
    /**
     * @param code - One of the fetch module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorFetchErrorDatas<C>, T["context"]>) {
        const messageFn = VigorFetchErrorMessageFuncs[code] as (arg: VigorFetchErrorDatas<C>) => string
        super(code, messageFn(options.data), options)
    }
}
