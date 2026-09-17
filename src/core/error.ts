/**
 * The `error` of a failed result envelope: `E` is the module's own typed
 * errors, and `{} | null | undefined` stands for anything else that reached
 * the caller — an error thrown by your own target/middleware, an abort
 * reason, a network `TypeError`, even a bare `throw null`.
 *
 * Because of that tail, reading `error.code` directly doesn't compile. Narrow
 * first (`isVigorRetryError(err)`), and `code` then narrows `data` to that
 * code's payload.
 */
export type VigorResultError<E> = E | {} | null | undefined

export type VigorErrorOptions<D, T> = {
    cause?: unknown;
    data: D;

    method: string
    context?: T
}

/**
 * Base class for all Vigor error types. Subclasses (`VigorRetryError`,
 * `VigorFetchError`, `VigorParseError`, `VigorAllError`) fix `C`, `D`, and
 * `T` to their own error-code union, data shape, and context shape.
 *
 * @typeParam C - Union of error codes for the subclass.
 * @typeParam D - Shape of the structured error data.
 * @typeParam T - Shape of the domain context.
 */
export abstract class VigorError<C extends string, D, T> extends Error {
    public readonly timestamp: Date = new Date();
    public readonly cause?: unknown;
    public readonly code: C;
    public readonly data: D

    public readonly method: string
    public readonly context: T|undefined

    /**
     * @param code - Machine-readable error code.
     * @param message - Human-readable message (rendered after the `[code]` prefix).
     * @param options - Additional error metadata (cause, data, method, context).
     */
    constructor(
        code: C,
        message: string,
        options: VigorErrorOptions<D, T>
    ) {
        super(`[${code}] ${message}`);
        this.name = new.target.name
        this.code = code
        this.cause = options.cause
        this.data = options.data;

        this.method = options.method
        this.context = options.context

        Object.setPrototypeOf(this, new.target.prototype);
        (Error as any).captureStackTrace?.(this, new.target);
    }
}
