import { VigorAll, VigorAllTask } from "@all/main";
import { VigorAllPolicySettings } from "@all/settings";
import { VigorAllPolicyMiddlewares } from "@all/middlewares";
import { VigorFetch } from "@fetch/main";
import { VigorFetchPolicySettings } from "@fetch/settings";
import { VigorFetchPolicyMiddlewares } from "@fetch/middlewares";
import { VigorParse } from "@parse/main";
import { VigorParsePolicySettings } from "@parse/settings";
import { VigorParsePolicyMiddlewares } from "@parse/middlewares";
import { VigorParsePolicyStrategies } from "@parse/strategies";
import { VigorRetry } from "@retry/main";
import { VigorRetryPolicySettings } from "@retry/settings";
import { VigorRetryPolicyMiddlewares } from "@retry/middlewares";
import {
    VigorRetryPolicyAlgorithms,
    VigorRetryPolicyAlgorithmsConstant,
    VigorRetryPolicyAlgorithmsLinear,
    VigorRetryPolicyAlgorithmsBackoff,
    VigorRetryPolicyAlgorithmsCustom,
} from "@retry/algorithms";

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
    }
}

export type VigorInstance = typeof vigorBase & {
    use: <P extends VigorPlugin<any, any>>(
        plugin: P,
        options?: P["options"]
    ) => VigorInstance & ReturnType<P["func"]>
}

/**
 * A plugin never mutates the `VigorInstance` it receives — it reads from it
 * (e.g. to wrap an existing method) and returns `Ext`, the properties to
 * merge into a *new* instance. `use()` owns cloning/merging, so plugins stay
 * pure and `vigor` itself is never touched.
 */
export type VigorPlugin<
    O extends { [str: string]: any } = {},
    Ext extends Record<string, any> = Record<string, any>
> = {
    options: O,
    func: (v: VigorInstance, options: O) => Ext
}

/** Shallow-clones a Vigor instance, including its nested `builders` groups, so callers never get a reference back into the original. */
const cloneVigor = (v: VigorInstance): VigorInstance => ({
    ...v,
    builders: {
        fetch: { ...v.builders.fetch },
        retry: { ...v.builders.retry, algorithm: { ...v.builders.retry.algorithm } },
        parse: { ...v.builders.parse },
        all: { ...v.builders.all },
    }
})

export const vigor: VigorInstance = {
    ...vigorBase,
    use: (plugin, options) => {
        const ext = plugin.func(vigor, options as any)
        return { ...cloneVigor(vigor), ...ext } as VigorInstance & typeof ext
    },
}

type ApiResponse = {
    success: true
    data: any
    errors: []
}|{
    success: false
    data: null
    errors: Array<any>
}