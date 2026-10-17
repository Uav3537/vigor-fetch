import { createBrand, VigorBrand } from "@core/symbol"
import { VigorAllPolicySettingsBase, VigorAllPolicySettingsSchema } from "./settings"
import { VigorAllPolicyMiddlewaresBase, VigorAllPolicyMiddlewaresSchema } from "./middlewares"
import type { VigorAllSchema } from "./main"
import type { VigorResultError } from "@core/error"
import type { VigorAllError } from "./error"

/**
 * A single task. It receives an `AbortSignal` that fires when the task's
 * `timeout` elapses, the batch's `abortSignals` abort, or `failFast` stops
 * the batch — tasks that ignore it keep running in the background, but
 * their result is discarded.
 */
export type VigorAllTask = (signal: AbortSignal) => unknown | Promise<unknown>

/** Extracts (and unwraps `Promise`/`Awaited`) the result type of a single task. */
export type VigorAllTaskResult<F> = F extends (...args: any[]) => infer R ? Awaited<R> : never

/**
 * Maps a tuple of tasks to a tuple of their (awaited) result types, in the
 * same order and length as `N`. If `N` isn't a literal tuple (e.g. the
 * default, unconfigured `target`), this degrades to a plain array type.
 */
export type VigorAllTasksTuple<N extends readonly VigorAllTask[]> = {
    [K in keyof N]: VigorAllTaskResult<N[K]>
}

export type VigorAllPolicySchema<
    T extends VigorAllSchema<T>
> = {
    __brand: VigorBrand<"All", "Policy<Schema">

    target: VigorAllTask[]
    abortSignals: AbortSignal[]
    settings: VigorAllPolicySettingsSchema<T>
    middlewares: VigorAllPolicyMiddlewaresSchema<T>
}

export const VigorAllPolicyBase = {
    __brand: createBrand("All", "Policy<Schema"),

    target: [] as [],
    abortSignals: [] as [],
    settings: VigorAllPolicySettingsBase,
    middlewares: VigorAllPolicyMiddlewaresBase
} as const satisfies VigorAllPolicySchema<any>

/**
 * What a failed task's slot holds as `error`: whatever the task threw, or
 * `VigorAllError("TIMED_OUT")` when it hit `settings.timeout`.
 */
export type VigorAllTaskError = VigorResultError<VigorAllError<"TIMED_OUT", any>>

/**
 * One task's outcome, shaped like `requestVerbose()`'s envelope: what it
 * returned (or what `onErrorEach` recovered it with), or what it failed with.
 */
export type VigorAllSettled<V> =
    | { success: true, data: V, error: null }
    | { success: false, data: null, error: VigorAllTaskError }

/**
 * The naturally-inferred (pre-`.cast<T>()`) result type of `.request()`.
 * When `onlySuccess` is left `false` (the default), every task gets its own
 * tuple slot holding its outcome — `.target(() => 1 as const, () => "a")`
 * infers `[VigorAllSettled<1>, VigorAllSettled<"a">]` — so a failed task
 * can't pass for a result. `onlySuccess: true` keeps only the successful
 * tasks' values, at runtime an arbitrary length, so it becomes an array of
 * the tasks' result types (`(1 | "a")[]`). A non-literal `boolean` could be
 * either, so it gives the union of both.
 */
export type VigorAllNaturalResult<
    T extends VigorAllSchema<T>
> = T["policy"]["target"] extends readonly VigorAllTask[]
    ? VigorAllResultFor<T["policy"]["settings"]["onlySuccess"], VigorAllTasksTuple<T["policy"]["target"]>>
    : unknown[]

/** Distributes over `boolean`, so a non-literal `onlySuccess` yields both shapes. */
type VigorAllResultFor<OnlySuccess, Tuple extends readonly unknown[]> =
    OnlySuccess extends true
        ? Tuple[number][]
        : { [K in keyof Tuple]: VigorAllSettled<Tuple[K]> }
