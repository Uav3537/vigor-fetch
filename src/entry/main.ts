import { VigorAll, VigorAllResult, VigorAllTask } from "@all/main";
import type { VigorAllIn } from "@all/TL";
import { VigorAllPolicySettings } from "@all/settings";
import { VigorAllPolicyMiddlewares } from "@all/middlewares";
import { VigorFetch, VigorFetchResult } from "@fetch/main";
import type { VigorFetchIn } from "@fetch/TL";
import { VigorFetchPolicySettings } from "@fetch/settings";
import { VigorFetchPolicyMiddlewares } from "@fetch/middlewares";
import { VigorParse, VigorParseResult } from "@parse/main";
import type { VigorParseIn } from "@parse/TL";
import { VigorParsePolicySettings } from "@parse/settings";
import { VigorParsePolicyMiddlewares } from "@parse/middlewares";
import { VigorParsePolicyStrategies } from "@parse/strategies";
import { VigorRetry, VigorRetryResult } from "@retry/main";
import type { VigorRetryIn } from "@retry/TL";
import { VigorRetryPolicySettings } from "@retry/settings";
import { VigorRetryPolicyMiddlewares } from "@retry/middlewares";
import {
    VigorRetryPolicyAlgorithms,
    VigorRetryPolicyAlgorithmsConstant,
    VigorRetryPolicyAlgorithmsLinear,
    VigorRetryPolicyAlgorithmsBackoff,
    VigorRetryPolicyAlgorithmsCustom,
} from "@retry/algorithms";
import { isVigorRetryError } from "@retry/error";
import { isVigorParseError } from "@parse/error";
import { isVigorFetchError } from "@fetch/error";
import { isVigorAllError } from "@all/error";

/**
 * The result type `request()` infers for a builder — what `ReturnType`
 * can't give you, since `request<R>()`'s `R` is a free override.
 *
 * @example
 * const users = vigor.fetch(origin).path("users").cast<User[]>()
 * type Users = VigorResultOf<typeof users> // User[]
 */
export type VigorResultOf<B> =
    B extends VigorRetry<infer T> ? VigorRetryResult<VigorRetryIn<T>>
    : B extends VigorParse<infer T> ? VigorParseResult<VigorParseIn<T>>
    : B extends VigorFetch<infer T> ? VigorFetchResult<VigorFetchIn<T>>
    : B extends VigorAll<infer T> ? VigorAllResult<VigorAllIn<T>>
    : never

/**
 * Small named helpers that actually *call* the target/origin method with the
 * generic argument `F`. These exist purely so `ReturnType<typeof xWithY<F>>`
 * can forward `F` into the real merged config type — referencing the method
 * type directly (e.g. `VigorRetry["target"]`) would leave `F` unapplied and
 * collapse back to the method's own parameter type.
 */
function retryWithTarget<const F extends Parameters<VigorRetry["target"]>[0]>(task: F) {
    return new VigorRetry().target(task)
}
function parseWithTarget<const F extends Parameters<VigorParse["target"]>[0]>(response: F) {
    return new VigorParse().target(response)
}
function fetchWithOrigin<const F extends Parameters<VigorFetch["origin"]>[0]>(origin: F) {
    return new VigorFetch().origin(origin)
}
function allWithTargets<const F extends VigorAllTask[]>(tasks: F) {
    return new VigorAll().target(...tasks)
}

/**
 * Overload types for each entry helper. Object literals can't declare
 * overloaded method shorthand directly (`foo(): A; foo(x: B): C { ... }` is a
 * syntax error inside `{ ... }`), so each helper is typed here and the
 * implementation is cast to it below.
 */
type RetryFn = {
    (): VigorRetry
    <const F extends Parameters<VigorRetry["target"]>[0]>(task: F): ReturnType<typeof retryWithTarget<F>>
}
type ParseFn = {
    (): VigorParse
    <const F extends Parameters<VigorParse["target"]>[0]>(response: F): ReturnType<typeof parseWithTarget<F>>
}
type FetchFn = {
    (): VigorFetch
    <const F extends Parameters<VigorFetch["origin"]>[0]>(origin: F): ReturnType<typeof fetchWithOrigin<F>>
}
type AllFn = {
    (): VigorAll
    <const F extends VigorAllTask[]>(...tasks: F): ReturnType<typeof allWithTargets<F>>
}

/** Everything `vigor` exposes except `use` — kept separate so `VigorInstance` (below) can self-reference without a circular-inference error. */
const vigorBase = {
    retry: ((task?: Parameters<VigorRetry["target"]>[0]) =>
        task !== undefined ? retryWithTarget(task) : new VigorRetry()) as RetryFn,

    parse: ((response?: Parameters<VigorParse["target"]>[0]) =>
        response !== undefined ? parseWithTarget(response) : new VigorParse()) as ParseFn,

    fetch: ((origin?: Parameters<VigorFetch["origin"]>[0]) =>
        origin !== undefined ? fetchWithOrigin(origin) : new VigorFetch()) as FetchFn,

    all: ((...tasks: VigorAllTask[]) =>
        tasks.length > 0 ? allWithTargets(tasks) : new VigorAll()) as AllFn,

    builders: {
        fetch: {
            settings:    () => new VigorFetchPolicySettings(),
            middlewares: () => new VigorFetchPolicyMiddlewares(),
        },
        retry: {
            settings:    () => new VigorRetryPolicySettings(),
            middlewares: () => new VigorRetryPolicyMiddlewares(),
            algorithms:  () => new VigorRetryPolicyAlgorithms(),
            algorithm: {
                constant: () => new VigorRetryPolicyAlgorithmsConstant(),
                linear:   () => new VigorRetryPolicyAlgorithmsLinear(),
                backoff:  () => new VigorRetryPolicyAlgorithmsBackoff(),
                custom:   () => new VigorRetryPolicyAlgorithmsCustom(),
            },
        },
        parse: {
            settings:    () => new VigorParsePolicySettings(),
            middlewares: () => new VigorParsePolicyMiddlewares(),
            strategies:  () => new VigorParsePolicyStrategies(),
        },
        all: {
            settings:    () => new VigorAllPolicySettings(),
            middlewares: () => new VigorAllPolicyMiddlewares(),
        },
    },

    guards: {
        retry: isVigorRetryError,
        parse: isVigorParseError,
        fetch: isVigorFetchError,
        all:   isVigorAllError,
    }
}

/** `A` with `B`'s properties replacing same-named ones, like `{ ...A, ...B }`. */
type VigorOverride<A, B> = Omit<A, keyof B> & B

/**
 * `Ext` accumulates every plugin extension applied so far, so `use().use()`
 * keeps all of them. A later extension replaces an earlier property of the
 * same name (including a built-in one), exactly as `use()` does at runtime.
 */
export type VigorInstance<Ext = {}> = VigorOverride<typeof vigorBase, Ext> & {
    use: <P extends VigorPlugin<any, any>>(
        plugin: P,
        options?: Partial<P["options"]>
    ) => VigorInstance<VigorOverride<Ext, ReturnType<P["func"]>>>
}

/**
 * A plugin never mutates the `VigorInstance` it receives — it reads from it
 * (e.g. to wrap an existing method) and returns `Ext`, the properties to
 * merge into a *new* instance. `use()` owns cloning/merging, so plugins stay
 * pure and `vigor` itself is never touched.
 *
 * `options` holds the defaults: `func` receives them with whatever was
 * passed to `use()` shallow-merged on top, so it always gets a full `O`.
 */
export type VigorPlugin<
    O extends { [str: string]: any } = {},
    Ext extends Record<string, any> = Record<string, any>
> = {
    options: O,
    func: (v: VigorInstance, options: O) => Ext
}

/** Shallow-clones a Vigor instance, including its nested `builders`/`guards` groups, so callers never get a reference back into the original. */
/** Runtime shape of an instance without its `use` (plus whatever plugins added). */
type VigorInstanceFields = typeof vigorBase & Record<string, unknown>

const cloneVigor = (v: VigorInstanceFields): VigorInstanceFields => ({
    ...v,
    builders: {
        fetch: { ...v.builders.fetch },
        retry: { ...v.builders.retry, algorithm: { ...v.builders.retry.algorithm } },
        parse: { ...v.builders.parse },
        all: { ...v.builders.all },
    },
    guards: { ...v.guards }
})

/**
 * Builds an instance whose `use()` extends *that* instance (not the root
 * `vigor`), so chained plugins see and keep each other's extensions.
 */
const createVigor = (fields: VigorInstanceFields): VigorInstance => {
    const instance = {
        ...fields,
        use: (plugin: VigorPlugin<any, any>, options?: unknown) => {
            const ext = plugin.func(instance, { ...plugin.options, ...(options as object | undefined) })
            const { use: _, ...rest } = { ...cloneVigor(instance), ...ext }
            return createVigor(rest as VigorInstanceFields)
        },
    } as unknown as VigorInstance
    return instance
}

export const vigor: VigorInstance = createVigor(vigorBase)