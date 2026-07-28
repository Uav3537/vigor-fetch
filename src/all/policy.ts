import { createBrand, VigorBrand } from "@core/symbol"
import { VigorAllPolicySettingsBase, VigorAllPolicySettingsSchema } from "./settings"
import { VigorAllPolicyMiddlewaresBase, VigorAllPolicyMiddlewaresSchema } from "./middlewares"
import type { VigorAllSchema } from "./main"

export type VigorAllTask = () => unknown | Promise<unknown>

/** Extracts (and unwraps `Promise`/`Awaited`) the result type of a single task. */
export type VigorAllTaskResult<F> = F extends () => infer R ? Awaited<R> : never

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
    settings: VigorAllPolicySettingsSchema<T>
    middlewares: VigorAllPolicyMiddlewaresSchema<T>
}

export const VigorAllPolicyBase = {
    __brand: createBrand("All", "Policy<Schema"),

    target: [] as [],
    settings: VigorAllPolicySettingsBase,
    middlewares: VigorAllPolicyMiddlewaresBase
} as const satisfies VigorAllPolicySchema<any>

/**
 * The naturally-inferred (pre-`.cast<T>()`) result type of `.request()`.
 * When `onlySuccess` is left `false` (the default), every task's result
 * lands at its own tuple slot — `.target(() => 1 as const, () => "a")`
 * infers `[1, "a"]`, not `unknown[]`. `onlySuccess: true` filters the
 * array at runtime to an arbitrary length, so it falls back to a plain
 * array type instead of a tuple.
 */
export type VigorAllNaturalResult<
    T extends VigorAllSchema<T>
> = T["policy"]["settings"]["onlySuccess"] extends true
    ? unknown[]
    : T["policy"]["target"] extends readonly VigorAllTask[]
        ? VigorAllTasksTuple<T["policy"]["target"]>
        : unknown[]
