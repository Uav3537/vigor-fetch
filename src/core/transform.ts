/**
 * Registry of named result transforms: how a function changes the type of
 * what it's given, written as a type of `In` (the input) and `Arg` (the
 * argument it was created with, `undefined` when none). Empty here; add
 * entries with declaration merging. The type parameters must be named and
 * listed exactly like this (`<In, Arg>`) for the declarations to merge.
 *
 * A fluent `onResult` middleware made with `vigor.transform()` then turns
 * the result into its entry's type — computed from the result it actually
 * gets, so it works on a builder before its API map or path is set (where a
 * plain callback's parameter is still `unknown`), and per status.
 *
 * @example
 * declare module "vigor-fetch" {
 *     interface VigorTransforms<In, Arg> {
 *         unwrap: In extends { data: infer D } ? D : never
 *         wrap: { value: In }
 *         pick: Arg extends keyof In ? In[Arg] : never
 *     }
 * }
 * const unwrap = vigor.transform("unwrap", r => r.data)
 * const pick = <K extends string>(key: K) => vigor.transform("pick", key, r => r[key])
 *
 * const base = vigor.fetch(origin).middlewares(m => m.onResult("fluent", unwrap))
 * const me = await base.apiMap<Api>().path("append", "me").request() // the route's `data`
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface VigorTransforms<In, Arg> {}

/** The names registered in {@link VigorTransforms}. */
export type VigorTransformKey = keyof VigorTransforms<unknown, unknown>

/** Type-only tag carrying a transform's registry key and argument. Never present at runtime. */
declare const VigorTransformTag: unique symbol

/**
 * A function made with `vigor.transform()`: at runtime the function itself,
 * typed as the {@link VigorTransforms} entry `K` (with argument `Arg`).
 */
export type VigorTransform<K extends VigorTransformKey = VigorTransformKey, Arg = unknown> =
    ((input: any) => any) & { readonly [VigorTransformTag]: { key: K, arg: Arg } }

/** Whether `F` was made with `vigor.transform()`. */
export type VigorIsTransform<F> = F extends { readonly [VigorTransformTag]: unknown } ? true : false

/** What transform `F` turns `In` into: its registry entry for `In` and its argument. */
export type VigorTransformResult<F, In> =
    F extends { readonly [VigorTransformTag]: { key: infer K extends VigorTransformKey, arg: infer A } }
        ? VigorTransforms<In, A>[K]
        : never

/** `vigor.transform`'s overloads. */
export type VigorTransformFn = {
    /** A transform without an argument: `Arg` is `undefined`. */
    <const K extends VigorTransformKey>(key: K, func: (input: any) => unknown): VigorTransform<K, undefined>
    /** A transform created with an argument, passed to its entry as `Arg`. */
    <const K extends VigorTransformKey, const A>(key: K, arg: A, func: (input: any) => unknown): VigorTransform<K, A>
}

/**
 * Tags `func` as transform `key` (see {@link VigorTransforms}). Purely a
 * type: the function is returned as it is, and runs like any fluent
 * `onResult` middleware. Its entry is trusted — nothing checks that the
 * function really returns that type, so keep the two side by side.
 */
export const createVigorTransform = ((_key: PropertyKey, ...rest: unknown[]) =>
    rest[rest.length - 1]) as VigorTransformFn
