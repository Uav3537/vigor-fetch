import { VigorError, VigorErrorOptions } from "@core/error";
import { VigorAllSchema } from "./main";
import type { VigorAllContextSchema } from "./context";

export const VigorAllErrorMessageFuncs = {
    EMPTY_TARGET: (_: {}) => `Empty target list`,
} as const

export type VigorAllErrorCodes = keyof typeof VigorAllErrorMessageFuncs

export type VigorAllErrorDatas<C extends VigorAllErrorCodes> =
    Parameters<typeof VigorAllErrorMessageFuncs[C]> extends [infer A]
        ? A
        : undefined;

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
