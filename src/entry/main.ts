import { VigorAll } from "@all/main";
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

/** Everything `vigor` exposes except `use` — kept separate so `VigorInstance` (below) can self-reference without a circular-inference error. */
const vigorBase = {
    retry: (...task: [task?: Parameters<VigorRetry["target"]>[0]]): VigorRetry<any> => task[0] !== undefined ? new VigorRetry().target(task[0]) : new VigorRetry(),
    parse: (...response: [response?: Parameters<VigorParse["target"]>[0]]): VigorParse<any> => response[0] !== undefined ? new VigorParse().target(response[0]) : new VigorParse(),
    fetch: (...origin: [origin?: Parameters<VigorFetch["origin"]>[0]]): VigorFetch<any> => origin[0] !== undefined ? new VigorFetch().origin(origin[0]) : new VigorFetch(),
    all: (...tasks: Parameters<VigorAll["target"]>) => tasks.length > 0 ? new VigorAll().target(...tasks) : new VigorAll(),
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