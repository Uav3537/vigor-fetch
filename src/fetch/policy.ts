import { createBrand, VigorBrand, VigorEmpty, VigorEmptyType } from "@core/symbol"
import { VigorFetchExtraOptions, VigorFetchOptions } from "./context"
import { VigorFetchPolicySettingsBase, VigorFetchPolicySettingsSchema } from "./settings"
import { VigorFetchPolicyMiddlewaresBase, VigorFetchPolicyMiddlewaresSchema } from "./middlewares"
import { VigorRetryBase, VigorRetrySchema } from "@retry/main"
import { VigorParseBase, VigorParseSchema } from "@parse/main"
import type { VigorFetchSchema } from "./main"

export type VigorStringable = string | number | boolean | null | undefined | Date

export type VigorFetchPolicySchema<
    T extends VigorFetchSchema<T>
> = {
    __brand: VigorBrand<"Fetch", "Policy<Schema">

    method: VigorFetchOptions["method"] | VigorEmptyType
    origin: string | VigorEmptyType
    path: string[]
    query: Record<string, VigorStringable | VigorStringable[]>[]
    hash: string
    headers: Record<string, string>
    body: BodyInit | object | null | VigorEmptyType
    extra: VigorFetchExtraOptions
    settings: VigorFetchPolicySettingsSchema<T>
    middlewares: VigorFetchPolicyMiddlewaresSchema<T>
    retry: VigorRetrySchema<any>
    parse: VigorParseSchema<any>
}

export const VigorFetchPolicyBase = {
    __brand: createBrand("Fetch", "Policy<Schema"),

    method: VigorEmpty,
    origin: VigorEmpty,
    path: [] as [],
    query: [] as [],
    hash: "",
    headers: {},
    body: VigorEmpty,
    extra: {},
    settings: VigorFetchPolicySettingsBase,
    middlewares: VigorFetchPolicyMiddlewaresBase,
    retry: VigorRetryBase,
    parse: VigorParseBase
} as const satisfies VigorFetchPolicySchema<any>
