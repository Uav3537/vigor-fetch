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

/**
 * Constructor options. `T` is the context type for the error's code (see
 * {@link VigorErrorContext}): `context` is required when the code always
 * has one, optional when it may not, and must be left out when it never does.
 */
export type VigorErrorOptions<D, T> = {
    cause?: unknown;
    data: D;

    method: string
} & (
    [T] extends [undefined]
        ? { context?: undefined }
        : undefined extends T
            ? { context?: T }
            : { context: T }
)

/**
 * The `context` type of error code `C`. A module lists the codes raised
 * where no run context exists: `None` never carry one (e.g. a parse strategy
 * failing on its own), `Optional` only sometimes (e.g. `VALUE_REQUIRED`,
 * also raised while building). Every other code always carries `Ctx`.
 */
export type VigorErrorContext<C extends string, Ctx, Optional extends string = never, None extends string = never> =
    C extends None
        ? undefined
        : C extends Optional
            ? Ctx | undefined
            : Ctx

/**
 * Base class for all Vigor error types. Subclasses (`VigorRetryError`,
 * `VigorFetchError`, `VigorParseError`, `VigorAllError`) fix `C`, `D`, and
 * `T` to their own error-code union, data shape, and context shape.
 *
 * @typeParam C - Union of error codes for the subclass.
 * @typeParam D - Shape of the structured error data.
 * @typeParam T - Type of `context` for code `C` (see {@link VigorErrorContext}).
 */
export abstract class VigorError<C extends string, D, T = unknown> extends Error {
    public readonly timestamp: Date = new Date();
    public readonly cause?: unknown;
    public readonly code: C;
    public readonly data: D

    public readonly method: string
    /** The run context when the error was raised; its presence depends on the code (see {@link VigorErrorContext}). */
    public readonly context: T

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
        this.context = options.context as T

        Object.setPrototypeOf(this, new.target.prototype);
        (Error as any).captureStackTrace?.(this, new.target);
    }
}

/**
 * Finds the first error in `error`'s chain that `match` accepts, from the
 * outside in: the error itself, then the error it wraps (`data.error` of
 * `RETRY_EXHAUSTED` / `RESTART_EXHAUSTED`), then its `cause`. Each wrapped
 * error is searched fully before moving on. Cycles are skipped.
 *
 * This is what the callback form of the `isVigor*Error` guards uses, so a
 * caller can ask for the error that actually happened (e.g. `FETCH_FAILED`)
 * without unwrapping the retry layers by hand.
 */
export function findInVigorErrorChain(error: unknown, match: (error: unknown) => boolean): unknown {
    const seen = new Set<unknown>()
    const visit = (current: unknown): unknown => {
        if (current === null || current === undefined || seen.has(current)) return undefined
        seen.add(current)
        if (match(current)) return current
        if (typeof current !== "object") return undefined

        const data = (current as { data?: unknown }).data
        if (current instanceof VigorError && data !== null && typeof data === "object" && "error" in data) {
            const found = visit((data as { error: unknown }).error)
            if (found !== undefined) return found
        }
        return visit((current as { cause?: unknown }).cause)
    }
    return visit(error)
}

/**
 * Shared body of the `isVigor*Error` guards. `is` checks one error against a
 * code list (empty means any code of that module).
 *
 * - `(error, ...codes)`: checks `error` itself and returns a boolean.
 * - `(error, codes, callback)`: searches `error`'s chain (see
 *   {@link findInVigorErrorChain}) and calls `callback` with the first match.
 *   Returns what `callback` returns, or `undefined` when nothing matches.
 */
export function runVigorGuard(
    error: unknown,
    args: readonly unknown[],
    is: (error: unknown, codes: readonly unknown[]) => boolean,
): unknown {
    const callback = args[args.length - 1]
    if (typeof callback !== "function") return is(error, args)
    const codes: readonly unknown[] = Array.isArray(args[0]) ? args[0] : [args[0]]
    const found = findInVigorErrorChain(error, e => is(e, codes))
    return found === undefined ? undefined : callback(found)
}
