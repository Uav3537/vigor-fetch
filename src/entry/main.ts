import { VigorAll } from "@all/main";
import { VigorFetch } from "@fetch/main";
import { VigorParse } from "@parse/main";
import { VigorRetry } from "@retry/main";

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
    all: (...tasks: Parameters<VigorAll["target"]>[0][]) => tasks.length > 0 ? new VigorAll().target(...tasks) : new VigorAll()
} as const