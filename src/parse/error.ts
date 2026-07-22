import { VigorError, VigorErrorOptions } from "@core/error";
import { VigorParseSchema } from "./main";

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

/** Error type thrown by the parse module. */
export class VigorParseError<
    C extends VigorParseErrorCodes,
    T extends VigorParseSchema<T>
> extends VigorError<
    C,
    VigorParseErrorDatas<C>,
    T["context"]
> {
    /**
     * @param code - One of the parse module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorParseErrorDatas<C>, T["context"]>) {
        const messageFn = VigorParseErrorMessageFuncs[code] as (arg: VigorParseErrorDatas<C>) => string
        super(code, messageFn(options.data), options)
    }
}
