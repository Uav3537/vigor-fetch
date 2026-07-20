import { createBrand, VigorBrand } from "@core/symbol"
import { VigorAllPolicySettingsBase, VigorAllPolicySettingsSchema } from "./settings"
import { VigorAllPolicyMiddlewaresBase, VigorAllPolicyMiddlewaresSchema } from "./middlewares"
import type { VigorAllSchema } from "./main"

export type VigorAllTask = () => unknown | Promise<unknown>

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

    target: [] as VigorAllTask[],
    settings: VigorAllPolicySettingsBase,
    middlewares: VigorAllPolicyMiddlewaresBase
} as const satisfies VigorAllPolicySchema<any>
