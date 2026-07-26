import { VigorError, VigorErrorOptions } from "@core/error";
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
