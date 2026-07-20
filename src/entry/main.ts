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

export type VigorPlugin<O extends {[str: string]: any}>  = {
    options: O,
    func: (v: typeof vigor, options: O) => void
}

export const vigor = {
    use: <P extends VigorPlugin<any>>(plugin: P, options?: P["options"]) => {
        plugin.func(vigor, options)
    },
    retry: (task?:  Parameters<VigorRetry["target"]>[0]) => task ? new VigorRetry().target(task) : new VigorRetry(),
    parse: (response?: Parameters<VigorParse["target"]>[0]) => response ? new VigorParse().target(response) : new VigorParse(),
    fetch: (origin?: Parameters<VigorFetch["origin"]>[0]) => origin ? new VigorFetch().origin(origin) : new VigorFetch(),
    all: (...tasks: Parameters<VigorAll["target"]>[0][]) => tasks.length > 0 ? new VigorAll().target(...tasks) : new VigorAll(),
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
} as const