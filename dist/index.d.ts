interface VigorTypeLambda {
    readonly In?: unknown;
    readonly Target: unknown;
}
type VigorApply<F extends VigorTypeLambda, In> = F extends {
    readonly Target: unknown;
} ? (F & {
    readonly In: In;
})["Target"] : never;

type VigorBrand<Branch extends string, Name extends string> = string & {
    __brand: `@vigor-fetch:::${Branch} <- ${Name}`;
};
declare const VigorDefault: symbol & {
    __brand: VigorBrand<"Core", "Symbol_Default">;
};
type VigorDefaultType = typeof VigorDefault;
declare const VigorEmpty: symbol & {
    __brand: VigorBrand<"Core", "Symbol_Empty">;
};
type VigorEmptyType = typeof VigorEmpty;
type VigorExcludeEmpty<T> = Exclude<T, VigorEmptyType>;

type VigorPrimitive = string | number | bigint | boolean | symbol | null | undefined;
type VigorBuiltin = VigorPrimitive | Date | RegExp | Function | Map<any, any> | Set<any> | WeakMap<any, any> | WeakSet<any>;
type VigorDeepPartial<T> = unknown extends T ? T : T extends VigorBuiltin ? T : T extends readonly (infer U)[] ? readonly VigorDeepPartial<U>[] : {
    [K in keyof T]?: VigorDeepPartial<T[K]>;
};
type VigorSimplify<T> = {
    [K in keyof T]: T[K];
} & {};
type VigorDeepMerge<A, B> = A extends VigorBuiltin ? B : B extends VigorBuiltin ? B : A extends readonly any[] ? B extends readonly any[] ? [...A, ...B] : B : A extends object ? B extends object ? VigorSimplify<{
    [K in keyof A | keyof B]: K extends keyof B ? K extends keyof A ? VigorDeepMerge<A[K], B[K]> : B[K] : K extends keyof A ? A[K] : never;
}> : B : B;
type VigorReplaceType<T, K extends keyof T, V> = VigorSimplify<{
    [P in keyof T]: P extends K ? V : T[P];
}>;
type VigorConcat<T extends readonly any[], U extends readonly any[]> = [...T, ...U];
type VigorLastOf<T extends readonly any[]> = T extends [...infer _, infer L] ? L : never;
type VigorReturnType<T> = T extends (...args: Array<any>) => any ? Awaited<ReturnType<T>> : never;
type VigorMergeMode = "merge" | "replace" | "concat";
type VigorMergeStrategy<T> = T extends VigorBuiltin ? VigorMergeMode | undefined : T extends readonly any[] ? VigorMergeMode : {
    [K in keyof T]?: VigorMergeStrategy<T[K]> | VigorMergeMode;
};

/**
 * Base class for Vigor's immutable, chainable builder objects.
 *
 * Each subclass holds a `base` config and a current `config`, and exposes
 * `_next()` to derive a new instance with a patch merged in. Subclasses
 * implement `_create()` to construct the concrete instance type, and the
 * return type of `_next()` is computed through the `TL` type lambda so
 * chained calls stay precisely typed.
 *
 * @typeParam Base - Shape of the full config for this builder.
 * @typeParam Config - Concrete config type held by this instance (extends `Base`).
 * @typeParam TL - Type lambda mapping a config type to the concrete instance type.
 */
declare abstract class VigorStatus<Base, Config extends Base, TL extends VigorTypeLambda> {
    private readonly _base;
    private readonly _config;
    /**
     * @param base - The default/base config for this builder.
     * @param config - The (possibly partial) config to merge onto `base`.
     */
    constructor(base: Base, config: Config | VigorDeepPartial<Config>);
    /** Constructs a concrete instance of this builder from a merged config. */
    protected abstract _create<C>(config: C): VigorApply<TL, C>;
    /**
     * Derives a new instance by merging `patch` onto the current config.
     *
     * @param patch - Values to overwrite/merge in for this step.
     * @param strategy - Optional tree mirroring the shape of `patch`, whose
     *  leaves may be `"replace" | "concat" | "merge"` to force the merge
     *  behavior at that path. Paths without a strategy fall back to the
     *  default behavior (deep merge for objects, concat for arrays).
     */
    protected _next<const Patch extends VigorDeepPartial<Base>>(patch: Patch, strategy?: VigorMergeStrategy<Patch>): VigorApply<TL, VigorDeepMerge<Config, Patch>>;
    /**
     * Deep-merges `target` onto `source`, honoring an optional per-path
     * `strategy` tree. Objects merge key by key, arrays concatenate (unless
     * `"replace"` is specified), and any other value is overwritten.
     */
    protected _merge<A, B>(source: A, target: B, strategy?: unknown): VigorDeepMerge<A, B>;
    /** The default/base config this builder was constructed with. */
    get base(): Base;
    /** The current, merged config for this builder instance. */
    get config(): Config;
}

type VigorAllPolicySettingsSchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Policy<Settings<Schema">;
    concurrency: number;
    onlySuccess: boolean;
};
declare const VigorAllPolicySettingsBase: {
    readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
    readonly concurrency: 5;
    readonly onlySuccess: false;
};
/** Immutable builder for an all-policy's general settings. */
declare class VigorAllPolicySettings<T extends VigorAllSchema<T> = typeof VigorAllBase> extends VigorStatus<VigorAllSchema<any>, T, VigorAllPolicySettingsTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorAllPolicySettingsTypeLambda, C>;
    /** Sets the maximum number of tasks run concurrently. */
    concurrency<const N extends VigorAllSchema<any>["policy"]["settings"]["concurrency"]>(num: N): VigorAllPolicySettings<VigorAllIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly concurrency: N;
            };
        };
    }>>>;
    /** When enabled, filters the final result down to only the tasks that succeeded. */
    onlySuccess<const N extends VigorAllSchema<any>["policy"]["settings"]["onlySuccess"]>(bool: N): VigorAllPolicySettings<VigorAllIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly onlySuccess: N;
            };
        };
    }>>>;
}

type VigorAllTask = () => unknown | Promise<unknown>;
type VigorAllPolicySchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Policy<Schema">;
    target: VigorAllTask[];
    settings: VigorAllPolicySettingsSchema<T>;
    middlewares: VigorAllPolicyMiddlewaresSchema<T>;
};
declare const VigorAllPolicyBase: {
    readonly __brand: VigorBrand<"All", "Policy<Schema">;
    readonly target: VigorAllTask[];
    readonly settings: {
        readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
        readonly concurrency: 5;
        readonly onlySuccess: false;
    };
    readonly middlewares: {
        readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
        readonly before: VigorAllEachMiddlewareFn[];
        readonly after: VigorAllEachMiddlewareFn[];
        readonly onError: VigorAllEachOnErrorFn[];
    };
};

type VigorAllContextSchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Context<Schema">;
    result: unknown[] | VigorDefaultType;
    policy: T["policy"];
    record: Record<string, any>;
};
type VigorAllEachContextSchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "EachContext<Schema">;
    result: unknown | VigorDefaultType;
    error: unknown;
    flags: {
        overrided: boolean;
    };
    record: Record<string, any>;
};

type VigorAllEachMiddlewareFn = (ctx: VigorAllEachContextSchema<any>) => void | Promise<void>;
type VigorAllEachOnErrorFn = (ctx: VigorAllEachContextSchema<any>, api: {
    setResult: (r: unknown) => void;
}) => void | Promise<void>;
type VigorAllPolicyMiddlewaresSchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
    before: VigorAllEachMiddlewareFn[];
    after: VigorAllEachMiddlewareFn[];
    onError: VigorAllEachOnErrorFn[];
};
declare const VigorAllPolicyMiddlewaresBase: {
    readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
    readonly before: VigorAllEachMiddlewareFn[];
    readonly after: VigorAllEachMiddlewareFn[];
    readonly onError: VigorAllEachOnErrorFn[];
};
/** Immutable builder for an all-policy's per-task middleware pipeline (`before`, `after`, `onError`). */
declare class VigorAllPolicyMiddlewares<T extends VigorAllSchema<T> = typeof VigorAllBase> extends VigorStatus<VigorAllSchema<any>, T, VigorAllPolicyMiddlewaresTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, C>;
    /** Registers a middleware that runs before each task is invoked. */
    before<const N extends VigorAllEachMiddlewareFn>(func: N): VigorAllPolicyMiddlewares<VigorAllIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly middlewares: {
                readonly before: readonly [N];
            };
        };
    }>>>;
    /** Registers a middleware that runs after each task settles successfully. */
    after<const N extends VigorAllEachMiddlewareFn>(func: N): VigorAllPolicyMiddlewares<VigorAllIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly middlewares: {
                readonly after: readonly [N];
            };
        };
    }>>>;
    /** Registers a middleware that runs when an individual task fails. */
    onError<const N extends VigorAllEachOnErrorFn>(func: N): VigorAllPolicyMiddlewares<VigorAllIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly middlewares: {
                readonly onError: readonly [N];
            };
        };
    }>>>;
}

type VigorAllIn<T> = T extends VigorAllSchema<any> ? T : never;
interface VigorAllTypeLambda extends VigorTypeLambda {
    readonly Target: VigorAll<VigorAllIn<this["In"]>>;
}
interface VigorAllPolicySettingsTypeLambda extends VigorTypeLambda {
    readonly Target: VigorAllPolicySettings<VigorAllIn<this["In"]>>;
}
interface VigorAllPolicyMiddlewaresTypeLambda extends VigorTypeLambda {
    readonly Target: VigorAllPolicyMiddlewares<VigorAllIn<this["In"]>>;
}

type VigorAllSchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Schema">;
    policy: VigorAllPolicySchema<T>;
    context: VigorAllContextSchema<T>;
};
declare const VigorAllBase: {
    readonly __brand: VigorBrand<"All", "Schema">;
    readonly policy: {
        readonly __brand: VigorBrand<"All", "Policy<Schema">;
        readonly target: VigorAllTask[];
        readonly settings: {
            readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
            readonly concurrency: 5;
            readonly onlySuccess: false;
        };
        readonly middlewares: {
            readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
            readonly before: VigorAllEachMiddlewareFn[];
            readonly after: VigorAllEachMiddlewareFn[];
            readonly onError: VigorAllEachOnErrorFn[];
        };
    };
    readonly context: {
        readonly __brand: VigorBrand<"All", "Context<Schema">;
        readonly result: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly policy: {
            readonly __brand: VigorBrand<"All", "Policy<Schema">;
            readonly target: VigorAllTask[];
            readonly settings: {
                readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
                readonly concurrency: 5;
                readonly onlySuccess: false;
            };
            readonly middlewares: {
                readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
                readonly before: VigorAllEachMiddlewareFn[];
                readonly after: VigorAllEachMiddlewareFn[];
                readonly onError: VigorAllEachOnErrorFn[];
            };
        };
        readonly record: {};
    };
};
/**
 * Immutable builder that runs a list of independent tasks with bounded
 * concurrency, per-task middleware, and either an all-results or
 * only-successes result mode.
 */
declare class VigorAll<T extends VigorAllSchema<T> = typeof VigorAllBase> extends VigorStatus<VigorAllSchema<T>, T, VigorAllTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorAllTypeLambda, C>;
    /** Sets the list of tasks to run. */
    target<const N extends VigorAllTask[]>(...funcs: N): VigorAll<VigorAllIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly target: N;
        };
    }>>>;
    /** Configures the all-policy's general settings (concurrency, onlySuccess). */
    settings<const N extends VigorDeepPartial<VigorAllPolicySettingsSchema<T>>, R extends VigorAllSchema<any>>(input: N | ((s: VigorAllPolicySettings<T>) => VigorAllPolicySettings<R>) | VigorAllPolicySettings<R>): VigorAll<VigorAllIn<VigorDeepMerge<T, {
        __brand?: VigorBrand<"All", "Schema"> | undefined;
        policy?: {
            __brand?: VigorBrand<"All", "Policy<Schema"> | undefined;
            target?: readonly VigorAllTask[] | undefined;
            settings?: {
                __brand?: VigorBrand<"All", "Policy<Settings<Schema"> | undefined;
                concurrency?: number | undefined;
                onlySuccess?: boolean | undefined;
            } | undefined;
            middlewares?: {
                __brand?: VigorBrand<"All", "Policy<Middlewares<Schema"> | undefined;
                before?: readonly VigorAllEachMiddlewareFn[] | undefined;
                after?: readonly VigorAllEachMiddlewareFn[] | undefined;
                onError?: readonly VigorAllEachOnErrorFn[] | undefined;
            } | undefined;
        } | undefined;
        context?: {
            __brand?: VigorBrand<"All", "Context<Schema"> | undefined;
            result?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | readonly unknown[] | undefined;
            policy?: any;
            record?: {
                [x: string]: any;
            } | undefined;
        } | undefined;
    }>>>;
    /** Configures the all-policy's per-task middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorAllPolicyMiddlewaresSchema<T>>, R extends VigorAllSchema<any>>(input: N | ((s: VigorAllPolicyMiddlewares<T>) => VigorAllPolicyMiddlewares<R>) | VigorAllPolicyMiddlewares<R>): VigorAll<VigorAllIn<VigorDeepMerge<T, {
        __brand?: VigorBrand<"All", "Schema"> | undefined;
        policy?: {
            __brand?: VigorBrand<"All", "Policy<Schema"> | undefined;
            target?: readonly VigorAllTask[] | undefined;
            settings?: {
                __brand?: VigorBrand<"All", "Policy<Settings<Schema"> | undefined;
                concurrency?: number | undefined;
                onlySuccess?: boolean | undefined;
            } | undefined;
            middlewares?: {
                __brand?: VigorBrand<"All", "Policy<Middlewares<Schema"> | undefined;
                before?: readonly VigorAllEachMiddlewareFn[] | undefined;
                after?: readonly VigorAllEachMiddlewareFn[] | undefined;
                onError?: readonly VigorAllEachOnErrorFn[] | undefined;
            } | undefined;
        } | undefined;
        context?: {
            __brand?: VigorBrand<"All", "Context<Schema"> | undefined;
            result?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | readonly unknown[] | undefined;
            policy?: any;
            record?: {
                [x: string]: any;
            } | undefined;
        } | undefined;
    }>>>;
    /** Runs a single task through the before/after/onError middleware pipeline. */
    private _runTask;
    /** Runs all tasks and returns the results array directly, throwing on final failure. */
    request<R extends unknown[] = unknown[]>(): Promise<R>;
    /** Runs all tasks and returns a result/error envelope instead of throwing. */
    requestVerbose<R extends unknown[] = unknown[]>(): Promise<{
        success: false;
        data: null;
        error: unknown;
    } | {
        success: true;
        data: R;
        error: null;
    }>;
    /** Internal execution loop implementing the bounded-concurrency worker pool. */
    private requestRuntime;
}

type VigorFetchPolicySettingsSchema<T extends VigorFetchSchema<T>> = {
    __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
    retryHeaders: string[];
    unretryStatus: number[];
    maxRestarts: number;
    default: ((ctx: T["context"]) => any | Promise<any>) | VigorEmptyType;
};
declare const VigorFetchPolicySettingsBase: {
    readonly __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
    readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"];
    readonly unretryStatus: [400, 401, 403, 404, 405, 413, 422];
    readonly maxRestarts: 3;
    readonly default: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
};
/** Immutable builder for a fetch policy's general settings. */
declare class VigorFetchPolicySettings<T extends VigorFetchSchema<T> = typeof VigorFetchBase> extends VigorStatus<VigorFetchSchema<any>, T, VigorFetchPolicySettingsTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorFetchPolicySettingsTypeLambda, C>;
    /** Sets response headers consulted to compute a server-suggested retry delay. */
    retryHeaders<const N extends VigorFetchSchema<any>["policy"]["settings"]["retryHeaders"]>(...strs: N): VigorFetchPolicySettings<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly retryHeaders: N;
            };
        };
    }>>>;
    /** Sets HTTP status codes that should never be retried. */
    unretryStatus<const N extends VigorFetchSchema<any>["policy"]["settings"]["unretryStatus"]>(...nums: N): VigorFetchPolicySettings<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly unretryStatus: N;
            };
        };
    }>>>;
    /** Sets the maximum number of full restarts allowed. */
    maxRestarts<const N extends VigorFetchSchema<any>["policy"]["settings"]["maxRestarts"]>(num: N): VigorFetchPolicySettings<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly maxRestarts: N;
            };
        };
    }>>>;
    /** Sets the fallback value/factory used when the request ultimately fails. */
    default<const N extends VigorExcludeEmpty<VigorFetchSchema<any>["policy"]["settings"]["default"]>>(func: N): VigorFetchPolicySettings<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly default: N;
            };
        };
    }>>>;
}

type VigorFetchExtraOptions = Omit<RequestInit, "method" | "headers" | "body" | "signal">;
type VigorFetchOptions = VigorFetchExtraOptions & {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";
    headers: Record<string, string>;
    body?: BodyInit | null;
    signal?: AbortSignal;
};
type VigorFetchContextSchema<T extends VigorFetchSchema<T>> = {
    __brand: VigorBrand<"Fetch", "Context<Schema">;
    href: string;
    response: Response | VigorDefaultType;
    result: unknown | VigorDefaultType;
    error: unknown;
    options: VigorFetchOptions | VigorDefaultType;
    flags: {
        overrided: boolean;
        restarted: boolean;
    };
    record: Record<string, any>;
    policy: T["policy"];
};

type VigorFetchPolicyMiddlewaresSchema<T extends VigorFetchSchema<T>> = {
    __brand: VigorBrand<"Fetch", "Policy<Middlewares<Schema">;
    before: (VigorFetchPolicyMiddlewaresFluent<T>["before"] | VigorFetchPolicyMiddlewaresIntercept<T>["before"])[];
    after: (VigorFetchPolicyMiddlewaresFluent<T>["after"] | VigorFetchPolicyMiddlewaresIntercept<T>["after"])[];
    onResult: (VigorFetchPolicyMiddlewaresFluent<T>["onResult"] | VigorFetchPolicyMiddlewaresIntercept<T>["onResult"])[];
    onError: (VigorFetchPolicyMiddlewaresFluent<T>["onError"] | VigorFetchPolicyMiddlewaresIntercept<T>["onError"])[];
};
declare const VigorFetchPolicyMiddlewaresBase: {
    readonly __brand: VigorBrand<"Fetch", "Policy<Middlewares<Schema">;
    readonly before: [];
    readonly after: [];
    readonly onResult: [];
    readonly onError: [];
};
type VigorFetchPolicyMiddlewaresFluent<T extends VigorFetchSchema<T>> = {
    __brand: VigorBrand<"Fetch", "Policy<Middlewares<Fluent<Schema">;
    before: {
        _mode: "fluent";
        func: (ctx: T["context"]) => void;
    };
    after: {
        _mode: "fluent";
        func: (ctx: T["context"]) => void;
    };
    onResult: {
        _mode: "fluent";
        func: (res: T["context"]["result"]) => VigorFetchSchema<any>["context"]["result"];
    };
    onError: {
        _mode: "fluent";
        func: (err: T["context"]["error"]) => void;
    };
};
type VigorFetchPolicyMiddlewaresApi<T extends VigorFetchSchema<T>> = {
    setResult: (res: VigorFetchSchema<any>["context"]["result"]) => void;
    throwError: (err: VigorFetchSchema<any>["context"]["error"]) => void;
    setOptions: (opts: VigorFetchOptions) => void;
    setHeaders: (headers: VigorFetchOptions["headers"]) => void;
    setBody: (body: VigorFetchOptions["body"]) => void;
    proceedRestart: () => void;
    cancelRestart: () => void;
};
type VigorFetchPolicyMiddlewaresIntercept<T extends VigorFetchSchema<T>> = {
    __brand: VigorBrand<"Fetch", "Policy<Middlewares<Intercept<Schema">;
    before: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "throwError" | "setOptions" | "setHeaders" | "setBody">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>;
    };
    after: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>;
    };
    onResult: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>;
    };
    onError: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult" | "throwError" | "proceedRestart" | "cancelRestart">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>;
    };
};
/**
 * Immutable builder for a fetch policy's middleware pipeline (`before`,
 * `after`, `onResult`, `onError`). Each stage accepts either "fluent"
 * middleware (returns a plain value merged into the context) or
 * "intercept" middleware (receives an explicit API to mutate control flow).
 */
declare class VigorFetchPolicyMiddlewares<T extends VigorFetchSchema<T> = typeof VigorFetchBase> extends VigorStatus<VigorFetchSchema<any>, T, VigorFetchPolicyMiddlewaresTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, C>;
    /** Registers a middleware that runs before the request is sent. */
    before<const N extends VigorFetchPolicyMiddlewaresFluent<any>["before"]["func"]>(type: "fluent", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                before: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    before<const N extends VigorFetchPolicyMiddlewaresIntercept<any>["before"]["func"]>(type: "intercept", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                before: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware that runs after the response is received. */
    after<const N extends VigorFetchPolicyMiddlewaresFluent<any>["after"]["func"]>(type: "fluent", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                after: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    after<const N extends VigorFetchPolicyMiddlewaresIntercept<any>["after"]["func"]>(type: "intercept", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                after: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware that transforms or validates the parsed result. */
    onResult<const N extends VigorFetchPolicyMiddlewaresFluent<any>["onResult"]["func"]>(type: "fluent", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onResult: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onResult<const N extends VigorFetchPolicyMiddlewaresIntercept<any>["onResult"]["func"]>(type: "intercept", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onResult: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware that runs when the request ultimately fails. */
    onError<const N extends VigorFetchPolicyMiddlewaresFluent<any>["onError"]["func"]>(type: "fluent", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onError: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onError<const N extends VigorFetchPolicyMiddlewaresIntercept<any>["onError"]["func"]>(type: "intercept", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onError: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
}

type VigorFetchIn<T> = T extends VigorFetchSchema<any> ? T : never;
interface VigorFetchTypeLambda extends VigorTypeLambda {
    readonly Target: VigorFetch<VigorFetchIn<this["In"]>>;
}
interface VigorFetchPolicySettingsTypeLambda extends VigorTypeLambda {
    readonly Target: VigorFetchPolicySettings<VigorFetchIn<this["In"]>>;
}
interface VigorFetchPolicyMiddlewaresTypeLambda extends VigorTypeLambda {
    readonly Target: VigorFetchPolicyMiddlewares<VigorFetchIn<this["In"]>>;
}

type VigorRetryPolicySettingsSchema<T extends VigorRetrySchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
    default: ((ctx: T["context"]) => any | Promise<any>) | VigorEmptyType;
    maxAttempts: number;
    maxRestarts: number;
    timeout: number;
};
declare const VigorRetryPolicySettingsBase: {
    readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
    readonly default: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
    readonly maxAttempts: 5;
    readonly maxRestarts: 3;
    readonly timeout: 20000;
};
/** Immutable builder for a retry policy's general settings. */
declare class VigorRetryPolicySettings<T extends VigorRetrySchema<T> = typeof VigorRetryBase> extends VigorStatus<VigorRetrySchema<any>, T, VigorRetryPolicySettingsTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorRetryPolicySettingsTypeLambda, C>;
    /** Sets the fallback value/factory used when the target ultimately fails. */
    default<const N extends VigorExcludeEmpty<VigorRetrySchema<any>["policy"]["settings"]["default"]>>(func: N): VigorRetryPolicySettings<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly default: N;
            };
        };
    }>>>;
    /** Sets the maximum number of retry attempts before giving up. */
    maxAttempts<const N extends VigorRetrySchema<any>["policy"]["settings"]["maxAttempts"]>(num: N): VigorRetryPolicySettings<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly maxAttempts: N;
            };
        };
    }>>>;
    /** Sets the maximum number of full restarts allowed. */
    maxRestarts<const N extends VigorRetrySchema<any>["policy"]["settings"]["maxRestarts"]>(num: N): VigorRetryPolicySettings<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly maxRestarts: N;
            };
        };
    }>>>;
    /** Sets the timeout, in milliseconds, for a single attempt. */
    timeout<const N extends VigorRetrySchema<any>["policy"]["settings"]["timeout"]>(num: N): VigorRetryPolicySettings<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly timeout: N;
            };
        };
    }>>>;
}

type VigorRetryPolicyMiddlewaresSchema<T extends VigorRetrySchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
    before: (VigorRetryPolicyMiddlewaresFluent<T>["before"] | VigorRetryPolicyMiddlewaresIntercept<T>["before"])[];
    after: (VigorRetryPolicyMiddlewaresFluent<T>["after"] | VigorRetryPolicyMiddlewaresIntercept<T>["after"])[];
    onResult: (VigorRetryPolicyMiddlewaresFluent<T>["onResult"] | VigorRetryPolicyMiddlewaresIntercept<T>["onResult"])[];
    retryIf: (VigorRetryPolicyMiddlewaresFluent<T>["retryIf"] | VigorRetryPolicyMiddlewaresIntercept<T>["retryIf"])[];
    onRetry: (VigorRetryPolicyMiddlewaresFluent<T>["onRetry"] | VigorRetryPolicyMiddlewaresIntercept<T>["onRetry"])[];
    onError: (VigorRetryPolicyMiddlewaresFluent<T>["onError"] | VigorRetryPolicyMiddlewaresIntercept<T>["onError"])[];
};
declare const VigorRetryPolicyMiddlewaresBase: {
    readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
    readonly before: [];
    readonly after: [];
    readonly onResult: [];
    readonly retryIf: [];
    readonly onRetry: [];
    readonly onError: [];
};
type VigorRetryPolicyMiddlewaresFluent<T extends VigorRetrySchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Middlewares<Fluent<Schema">;
    before: {
        _mode: "fluent";
        func: (ctx: T["context"]) => void;
    };
    after: {
        _mode: "fluent";
        func: (ctx: T["context"]) => void;
    };
    onResult: {
        _mode: "fluent";
        func: (res: T["context"]["result"]) => VigorRetrySchema<any>["context"]["result"];
    };
    retryIf: {
        _mode: "fluent";
        func: (err: T["context"]["error"]) => VigorRetrySchema<any>["context"]["flags"]["doRetry"];
    };
    onRetry: {
        _mode: "fluent";
        func: (err: T["context"]["error"]) => void;
    };
    onError: {
        _mode: "fluent";
        func: (err: T["context"]["error"]) => void;
    };
};
type VigorRetryPolicyMiddlewaresApi<T extends VigorRetrySchema<T>> = {
    setResult: (res: VigorRetrySchema<any>["context"]["result"]) => void;
    throwError: (err: VigorRetrySchema<any>["context"]["error"]) => void;
    abort: (err: VigorRetrySchema<any>["context"]["error"]) => void;
    breakRetry: (err: VigorRetrySchema<any>["context"]["error"]) => void;
    proceedRetry: () => void;
    cancelRetry: () => void;
    setDelay: (num: VigorRetrySchema<any>["context"]["system"]["delay"]) => void;
    proceedRestart: () => void;
    cancelRestart: () => void;
};
type VigorRetryPolicyMiddlewaresIntercept<T extends VigorRetrySchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Middlewares<Intercept<Schema">;
    before: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "abort" | "throwError" | "breakRetry">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>;
    };
    after: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "throwError">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>;
    };
    onResult: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>;
    };
    retryIf: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "proceedRetry" | "cancelRetry">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>;
    };
    onRetry: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "throwError" | "setDelay">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>;
    };
    onError: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "setResult" | "throwError" | "proceedRestart" | "cancelRestart">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>;
    };
};
/**
 * Immutable builder for a retry policy's middleware pipeline (`before`,
 * `after`, `onResult`, `retryIf`, `onRetry`, `onError`). Each stage accepts
 * either "fluent" middleware (returns a plain value merged into the
 * context) or "intercept" middleware (receives an explicit API to mutate
 * control flow).
 */
declare class VigorRetryPolicyMiddlewares<T extends VigorRetrySchema<T> = typeof VigorRetryBase> extends VigorStatus<VigorRetrySchema<any>, T, VigorRetryPolicyMiddlewaresTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, C>;
    /** Registers a middleware that runs before the retried target is invoked. */
    before<const N extends VigorRetryPolicyMiddlewaresFluent<any>["before"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                before: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    before<const N extends VigorRetryPolicyMiddlewaresIntercept<any>["before"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                before: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware that runs after the retried target settles. */
    after<const N extends VigorRetryPolicyMiddlewaresFluent<any>["after"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                after: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    after<const N extends VigorRetryPolicyMiddlewaresIntercept<any>["after"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                after: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware to transform or validate the retry's result. */
    onResult<const N extends VigorRetryPolicyMiddlewaresFluent<any>["onResult"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onResult: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onResult<const N extends VigorRetryPolicyMiddlewaresIntercept<any>["onResult"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onResult: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware that decides whether a failed attempt should be retried. */
    retryIf<const N extends VigorRetryPolicyMiddlewaresFluent<any>["retryIf"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                retryIf: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    retryIf<const N extends VigorRetryPolicyMiddlewaresIntercept<any>["retryIf"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                retryIf: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware invoked right before a retry attempt is scheduled. */
    onRetry<const N extends VigorRetryPolicyMiddlewaresFluent<any>["onRetry"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onRetry: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onRetry<const N extends VigorRetryPolicyMiddlewaresIntercept<any>["onRetry"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onRetry: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware invoked when retries/restarts are exhausted. */
    onError<const N extends VigorRetryPolicyMiddlewaresFluent<any>["onError"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onError: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onError<const N extends VigorRetryPolicyMiddlewaresIntercept<any>["onError"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onError: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
}
type VigorRetryPipeInitialContext<T extends VigorRetrySchema<T>, R = VigorReturnType<T["policy"]["target"]>> = VigorDeepMerge<Omit<T["context"], "result">, {
    result: R;
}>;
type VigorRetryPipeStepVoid<Ctx, Arr> = Arr extends [infer Head, ...infer Tail] ? Head extends {
    _mode: "intercept";
    func: (...args: any[]) => infer Ret;
} ? VigorRetryPipeStepVoid<Ret, Tail> : VigorRetryPipeStepVoid<Ctx, Tail> : Ctx;
type VigorRetryPipeStepResult<Ctx, Arr> = Arr extends [infer Head, ...infer Tail] ? Head extends {
    _mode: "intercept";
    func: (...args: any[]) => infer Ret;
} ? VigorRetryPipeStepResult<Ret, Tail> : Head extends {
    _mode: "fluent";
    func: (...args: any[]) => infer FR;
} ? VigorRetryPipeStepResult<VigorDeepMerge<Ctx, {
    result: FR;
}>, Tail> : VigorRetryPipeStepResult<Ctx, Tail> : Ctx;
type VigorRetryPipeStepRetryIf<Ctx, Arr> = Arr extends [infer Head, ...infer Tail] ? Head extends {
    _mode: "intercept";
    func: (...args: any[]) => infer Ret;
} ? VigorRetryPipeStepRetryIf<Ret, Tail> : Head extends {
    _mode: "fluent";
    func: (...args: any[]) => infer FR;
} ? VigorRetryPipeStepRetryIf<VigorDeepMerge<Ctx, {
    flags: {
        doRetry: FR;
    };
}>, Tail> : VigorRetryPipeStepRetryIf<Ctx, Tail> : Ctx;
type VigorRetryPolicyMiddlewaresPipe<T extends VigorRetrySchema<T>> = VigorRetryPipeStepVoid<VigorRetryPipeStepVoid<VigorRetryPipeStepRetryIf<VigorRetryPipeStepResult<VigorRetryPipeStepVoid<VigorRetryPipeStepVoid<VigorRetryPipeInitialContext<T>, T["policy"]["middlewares"]["before"]>, T["policy"]["middlewares"]["after"]>, T["policy"]["middlewares"]["onResult"]>, T["policy"]["middlewares"]["retryIf"]>, T["policy"]["middlewares"]["onRetry"]>, T["policy"]["middlewares"]["onError"]>;
type VigorRetryPipeResult<T extends VigorRetrySchema<T>> = VigorRetryPolicyMiddlewaresPipe<T> extends {
    result: infer R;
} ? R : never;

/** Returns a random offset in the range `[-jitter, +jitter]` to randomize a computed delay. */
declare function VigorJitter(jitter: number): number;
type VigorRetryPolicyAlgorithmsConstantSchema<T extends VigorRetryPolicyAlgorithmsConstantSchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
    _tag: "constant";
    jitter: number;
    interval: number;
    _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<T>) => number;
};
declare const VigorRetryPolicyAlgorithmsConstantBase: {
    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
    readonly _tag: "constant";
    readonly jitter: 1000;
    readonly interval: 2000;
    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
};
/** Immutable builder for the constant-interval retry delay algorithm. */
declare class VigorRetryPolicyAlgorithmsConstant<T extends VigorRetryPolicyAlgorithmsConstantSchema<T> = typeof VigorRetryPolicyAlgorithmsConstantBase> extends VigorStatus<VigorRetryPolicyAlgorithmsConstantSchema<any>, T, VigorRetryPolicyAlgorithmsConstantTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorRetryPolicyAlgorithmsConstantTypeLambda, C>;
    /** Sets the amount of random jitter added to the computed delay. */
    jitter<const N extends VigorRetryPolicyAlgorithmsConstantSchema<any>["jitter"]>(num: N): VigorRetryPolicyAlgorithmsConstant<VigorRetryAlgorithmsConstantIn<VigorDeepMerge<T, {
        readonly jitter: N;
    }>>>;
    /** Sets the fixed delay interval, in milliseconds. */
    interval<const N extends VigorRetryPolicyAlgorithmsConstantSchema<any>["interval"]>(num: N): VigorRetryPolicyAlgorithmsConstant<VigorRetryAlgorithmsConstantIn<VigorDeepMerge<T, {
        readonly interval: N;
    }>>>;
}
type VigorRetryPolicyAlgorithmsLinearSchema<T extends VigorRetryPolicyAlgorithmsLinearSchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Algorithms<Linear<Schema">;
    _tag: "linear";
    jitter: number;
    initial: number;
    increment: number;
    minDelay: number;
    maxDelay: number;
    _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsLinearSchema<T>) => number;
};
declare const VigorRetryPolicyAlgorithmsLinearBase: {
    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Linear<Schema">;
    readonly _tag: "linear";
    readonly jitter: 1000;
    readonly initial: 500;
    readonly increment: 1000;
    readonly minDelay: 0;
    readonly maxDelay: 10000;
    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsLinearSchema<any>) => number;
};
/** Immutable builder for the linearly-increasing retry delay algorithm. */
declare class VigorRetryPolicyAlgorithmsLinear<T extends VigorRetryPolicyAlgorithmsLinearSchema<T> = typeof VigorRetryPolicyAlgorithmsLinearBase> extends VigorStatus<VigorRetryPolicyAlgorithmsLinearSchema<any>, T, VigorRetryPolicyAlgorithmsLinearTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorRetryPolicyAlgorithmsLinearTypeLambda, C>;
    /** Sets the amount of random jitter added to the computed delay. */
    jitter<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["jitter"]>(num: N): VigorRetryPolicyAlgorithmsLinear<VigorRetryAlgorithmsLinearIn<VigorDeepMerge<T, {
        readonly jitter: N;
    }>>>;
    /** Sets the initial delay, in milliseconds, before the first retry. */
    initial<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["initial"]>(num: N): VigorRetryPolicyAlgorithmsLinear<VigorRetryAlgorithmsLinearIn<VigorDeepMerge<T, {
        readonly initial: N;
    }>>>;
    /** Sets how much the delay grows, in milliseconds, per attempt. */
    increment<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["increment"]>(num: N): VigorRetryPolicyAlgorithmsLinear<VigorRetryAlgorithmsLinearIn<VigorDeepMerge<T, {
        readonly increment: N;
    }>>>;
    /** Sets the minimum allowed delay, in milliseconds. */
    minDelay<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["minDelay"]>(num: N): VigorRetryPolicyAlgorithmsLinear<VigorRetryAlgorithmsLinearIn<VigorDeepMerge<T, {
        readonly minDelay: N;
    }>>>;
    /** Sets the maximum allowed delay, in milliseconds. */
    maxDelay<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["maxDelay"]>(num: N): VigorRetryPolicyAlgorithmsLinear<VigorRetryAlgorithmsLinearIn<VigorDeepMerge<T, {
        readonly maxDelay: N;
    }>>>;
}
type VigorRetryPolicyAlgorithmsBackoffSchema<T extends VigorRetryPolicyAlgorithmsBackoffSchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Algorithms<Backoff<Schema">;
    _tag: "backoff";
    jitter: number;
    initial: number;
    multiplier: number;
    unit: number;
    minDelay: number;
    maxDelay: number;
    _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsBackoffSchema<T>) => number;
};
declare const VigorRetryPolicyAlgorithmsBackoffBase: {
    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Backoff<Schema">;
    readonly _tag: "backoff";
    readonly jitter: 800;
    readonly initial: 0;
    readonly multiplier: 1.7;
    readonly unit: 1000;
    readonly minDelay: 500;
    readonly maxDelay: 10000;
    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsBackoffSchema<any>) => number;
};
/** Immutable builder for the exponential-backoff retry delay algorithm. */
declare class VigorRetryPolicyAlgorithmsBackoff<T extends VigorRetryPolicyAlgorithmsBackoffSchema<T> = typeof VigorRetryPolicyAlgorithmsBackoffBase> extends VigorStatus<VigorRetryPolicyAlgorithmsBackoffSchema<any>, T, VigorRetryPolicyAlgorithmsBackoffTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorRetryPolicyAlgorithmsBackoffTypeLambda, C>;
    /** Sets the amount of random jitter added to the computed delay. */
    jitter<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["jitter"]>(num: N): VigorRetryPolicyAlgorithmsBackoff<VigorRetryAlgorithmsBackoffIn<VigorDeepMerge<T, {
        readonly jitter: N;
    }>>>;
    /** Sets the initial delay, in milliseconds, before backoff growth is applied. */
    initial<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["initial"]>(num: N): VigorRetryPolicyAlgorithmsBackoff<VigorRetryAlgorithmsBackoffIn<VigorDeepMerge<T, {
        readonly initial: N;
    }>>>;
    /** Sets the exponential growth factor applied per attempt. */
    multiplier<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["multiplier"]>(num: N): VigorRetryPolicyAlgorithmsBackoff<VigorRetryAlgorithmsBackoffIn<VigorDeepMerge<T, {
        readonly multiplier: N;
    }>>>;
    /** Sets the base unit, in milliseconds, the multiplier is scaled by. */
    unit<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["unit"]>(num: N): VigorRetryPolicyAlgorithmsBackoff<VigorRetryAlgorithmsBackoffIn<VigorDeepMerge<T, {
        readonly unit: N;
    }>>>;
    /** Sets the minimum allowed delay, in milliseconds. */
    minDelay<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["minDelay"]>(num: N): VigorRetryPolicyAlgorithmsBackoff<VigorRetryAlgorithmsBackoffIn<VigorDeepMerge<T, {
        readonly minDelay: N;
    }>>>;
    /** Sets the maximum allowed delay, in milliseconds. */
    maxDelay<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["maxDelay"]>(num: N): VigorRetryPolicyAlgorithmsBackoff<VigorRetryAlgorithmsBackoffIn<VigorDeepMerge<T, {
        readonly maxDelay: N;
    }>>>;
}
type VigorRetryPolicyAlgorithmsCustomSchema<T extends VigorRetryPolicyAlgorithmsCustomSchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Algorithms<Custom<Schema">;
    _tag: "custom";
    jitter: number;
    minDelay: number;
    maxDelay: number;
    target: ((att: number) => number) | VigorEmptyType;
    _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsCustomSchema<T>) => number;
};
declare const VigorRetryPolicyAlgorithmsCustomBase: {
    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Custom<Schema">;
    readonly _tag: "custom";
    readonly jitter: 800;
    readonly minDelay: 500;
    readonly maxDelay: 10000;
    readonly target: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsCustomSchema<any>) => number;
};
/** Immutable builder for a user-supplied custom retry delay algorithm. */
declare class VigorRetryPolicyAlgorithmsCustom<T extends VigorRetryPolicyAlgorithmsCustomSchema<T> = typeof VigorRetryPolicyAlgorithmsCustomBase> extends VigorStatus<VigorRetryPolicyAlgorithmsCustomSchema<any>, T, VigorRetryPolicyAlgorithmsCustomTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorRetryPolicyAlgorithmsCustomTypeLambda, C>;
    /** Sets the amount of random jitter added to the computed delay. */
    jitter<const N extends VigorRetryPolicyAlgorithmsCustomSchema<any>["jitter"]>(num: N): VigorRetryPolicyAlgorithmsCustom<VigorRetryAlgorithmsCustomIn<VigorDeepMerge<T, {
        readonly jitter: N;
    }>>>;
    /** Sets the minimum allowed delay, in milliseconds. */
    minDelay<const N extends VigorRetryPolicyAlgorithmsCustomSchema<any>["minDelay"]>(num: N): VigorRetryPolicyAlgorithmsCustom<VigorRetryAlgorithmsCustomIn<VigorDeepMerge<T, {
        readonly minDelay: N;
    }>>>;
    /** Sets the maximum allowed delay, in milliseconds. */
    maxDelay<const N extends VigorRetryPolicyAlgorithmsCustomSchema<any>["maxDelay"]>(num: N): VigorRetryPolicyAlgorithmsCustom<VigorRetryAlgorithmsCustomIn<VigorDeepMerge<T, {
        readonly maxDelay: N;
    }>>>;
    /** Sets the user-supplied function computing the raw delay for an attempt. */
    target<const N extends VigorExcludeEmpty<VigorRetryPolicyAlgorithmsCustomSchema<any>["target"]>>(func: N): VigorRetryPolicyAlgorithmsCustom<VigorRetryAlgorithmsCustomIn<VigorDeepMerge<T, {
        readonly target: N;
    }>>>;
}
type VigorRetryPolicyAlgorithmsSchema<T extends VigorRetrySchema<T>> = (VigorRetryPolicyAlgorithmsConstantSchema<any> | VigorRetryPolicyAlgorithmsLinearSchema<any> | VigorRetryPolicyAlgorithmsBackoffSchema<any> | VigorRetryPolicyAlgorithmsCustomSchema<any>) & {
    _calculateDelay: (att: number, config: any) => number;
};
declare const VigorRetryPolicyAlgorithmsBase: {
    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
    readonly _tag: "constant";
    readonly jitter: 1000;
    readonly interval: 2000;
    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
};
/**
 * Immutable builder for selecting a retry policy's delay algorithm.
 *
 * Switching algorithms (`constant`/`linear`/`backoff`/`custom`) always
 * replaces the previous algorithm's config wholesale via the `"replace"`
 * merge strategy, since the different algorithms' fields are not
 * compatible with one another.
 */
declare class VigorRetryPolicyAlgorithms<T extends VigorRetrySchema<T> = typeof VigorRetryBase> extends VigorStatus<VigorRetrySchema<any>, T, VigorRetryPolicyAlgorithmsTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorRetryPolicyAlgorithmsTypeLambda, C>;
    /** Switches to the constant-interval delay algorithm. */
    constant<const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsConstantSchema<any>, "_tag" | "__brand">>>(input?: N): VigorRetryPolicyAlgorithms<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly algorithms: {
                __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                _tag: "constant";
                jitter: 1000;
                interval: 2000;
                _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
            };
        };
    }>>>;
    /** Switches to the linearly-increasing delay algorithm. */
    linear<const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsLinearSchema<any>, "_tag" | "__brand">>>(input?: N): VigorRetryPolicyAlgorithms<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly algorithms: {
                __brand: VigorBrand<"Retry", "Policy<Algorithms<Linear<Schema">;
                _tag: "linear";
                jitter: 1000;
                _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsLinearSchema<any>) => number;
                initial: 500;
                increment: 1000;
                minDelay: 0;
                maxDelay: 10000;
            };
        };
    }>>>;
    /** Switches to the exponential-backoff delay algorithm. */
    backoff<const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsBackoffSchema<any>, "_tag" | "__brand">>>(input?: N): VigorRetryPolicyAlgorithms<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly algorithms: {
                __brand: VigorBrand<"Retry", "Policy<Algorithms<Backoff<Schema">;
                _tag: "backoff";
                jitter: 800;
                _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsBackoffSchema<any>) => number;
                initial: 0;
                minDelay: 500;
                maxDelay: 10000;
                multiplier: 1.7;
                unit: 1000;
            };
        };
    }>>>;
    /** Switches to a user-supplied custom delay algorithm. */
    custom<const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsCustomSchema<any>, "_tag" | "__brand">>>(input?: N): VigorRetryPolicyAlgorithms<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly algorithms: {
                target: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                __brand: VigorBrand<"Retry", "Policy<Algorithms<Custom<Schema">;
                _tag: "custom";
                jitter: 800;
                _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsCustomSchema<any>) => number;
                minDelay: 500;
                maxDelay: 10000;
            };
        };
    }>>>;
}

type VigorRetryIn<T> = T extends VigorRetrySchema<any> ? T : never;
type VigorRetryAlgorithmsConstantIn<T> = T extends VigorRetryPolicyAlgorithmsConstantSchema<any> ? T : never;
type VigorRetryAlgorithmsLinearIn<T> = T extends VigorRetryPolicyAlgorithmsLinearSchema<any> ? T : never;
type VigorRetryAlgorithmsBackoffIn<T> = T extends VigorRetryPolicyAlgorithmsBackoffSchema<any> ? T : never;
type VigorRetryAlgorithmsCustomIn<T> = T extends VigorRetryPolicyAlgorithmsCustomSchema<any> ? T : never;
interface VigorRetryTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetry<VigorRetryIn<this["In"]>>;
}
interface VigorRetryPolicySettingsTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicySettings<VigorRetryIn<this["In"]>>;
}
interface VigorRetryPolicyMiddlewaresTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyMiddlewares<VigorRetryIn<this["In"]>>;
}
interface VigorRetryPolicyAlgorithmsTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyAlgorithms<VigorRetryIn<this["In"]>>;
}
interface VigorRetryPolicyAlgorithmsConstantTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyAlgorithmsConstant<VigorRetryAlgorithmsConstantIn<this["In"]>>;
}
interface VigorRetryPolicyAlgorithmsLinearTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyAlgorithmsLinear<VigorRetryAlgorithmsLinearIn<this["In"]>>;
}
interface VigorRetryPolicyAlgorithmsBackoffTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyAlgorithmsBackoff<VigorRetryAlgorithmsBackoffIn<this["In"]>>;
}
interface VigorRetryPolicyAlgorithmsCustomTypeLambda extends VigorTypeLambda {
    readonly Target: VigorRetryPolicyAlgorithmsCustom<VigorRetryAlgorithmsCustomIn<this["In"]>>;
}

type VigorRetryContextSchema<T extends VigorRetrySchema<T>> = {
    __brand: VigorBrand<"Retry", "Context<Schema">;
    result: VigorRetryPipeResult<T> | VigorDefaultType;
    error: unknown;
    system: {
        delay: number | VigorDefaultType;
        attempt: number;
    };
    flags: {
        doRetry: boolean;
        doRestart: boolean;
        brokeRetry: boolean;
        overridden: boolean;
    };
    record: Record<string, any>;
    policy: T["policy"];
};

type VigorRetryPolicySchema<T extends VigorRetrySchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Schema">;
    target: ((signal: AbortSignal) => any | Promise<any>) | VigorEmptyType;
    abortSignals: AbortSignal[];
    settings: VigorRetryPolicySettingsSchema<T>;
    middlewares: VigorRetryPolicyMiddlewaresSchema<T>;
    algorithms: VigorRetryPolicyAlgorithmsSchema<T>;
};
declare const VigorRetryPolicyBase: {
    readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
    readonly target: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
    readonly abortSignals: [];
    readonly settings: {
        readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
        readonly default: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
        readonly maxAttempts: 5;
        readonly maxRestarts: 3;
        readonly timeout: 20000;
    };
    readonly middlewares: {
        readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
        readonly before: [];
        readonly after: [];
        readonly onResult: [];
        readonly retryIf: [];
        readonly onRetry: [];
        readonly onError: [];
    };
    readonly algorithms: {
        readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
        readonly _tag: "constant";
        readonly jitter: 1000;
        readonly interval: 2000;
        readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
    };
};

type VigorRetrySchema<T extends VigorRetrySchema<T>> = {
    __brand: VigorBrand<"Retry", "Schema">;
    policy: VigorRetryPolicySchema<T>;
    context: VigorRetryContextSchema<T>;
};
declare const VigorRetryBase: {
    readonly __brand: VigorBrand<"Retry", "Schema">;
    readonly policy: {
        readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
        readonly target: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
        readonly abortSignals: [];
        readonly settings: {
            readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
            readonly default: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly maxAttempts: 5;
            readonly maxRestarts: 3;
            readonly timeout: 20000;
        };
        readonly middlewares: {
            readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
            readonly before: [];
            readonly after: [];
            readonly onResult: [];
            readonly retryIf: [];
            readonly onRetry: [];
            readonly onError: [];
        };
        readonly algorithms: {
            readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
            readonly _tag: "constant";
            readonly jitter: 1000;
            readonly interval: 2000;
            readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
        };
    };
    readonly context: {
        readonly __brand: VigorBrand<"Retry", "Context<Schema">;
        readonly result: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly error: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly system: {
            readonly delay: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly attempt: 0;
        };
        readonly flags: {
            readonly doRetry: true;
            readonly doRestart: false;
            readonly brokeRetry: false;
            readonly overridden: false;
        };
        readonly record: {};
        readonly policy: {
            readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
            readonly target: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly abortSignals: [];
            readonly settings: {
                readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                readonly default: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly maxAttempts: 5;
                readonly maxRestarts: 3;
                readonly timeout: 20000;
            };
            readonly middlewares: {
                readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                readonly before: [];
                readonly after: [];
                readonly onResult: [];
                readonly retryIf: [];
                readonly onRetry: [];
                readonly onError: [];
            };
            readonly algorithms: {
                readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                readonly _tag: "constant";
                readonly jitter: 1000;
                readonly interval: 2000;
                readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
            };
        };
    };
};
/**
 * Immutable builder that executes a target function with retry, restart,
 * timeout, and abort support, driven by a configurable delay algorithm and
 * middleware pipeline.
 */
declare class VigorRetry<T extends VigorRetrySchema<T> = typeof VigorRetryBase> extends VigorStatus<VigorRetrySchema<T>, T, VigorRetryTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorRetryTypeLambda, C>;
    /** Sets the target function to invoke, with retry/timeout applied. */
    target<const N extends VigorExcludeEmpty<VigorRetrySchema<T>["policy"]["target"]>>(func: N): VigorRetry<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly target: N;
        };
    }>>>;
    /** Sets external abort signals that, when aborted, stop retrying. */
    abortSignals<const N extends VigorRetrySchema<T>["policy"]["abortSignals"]>(...sig: N): VigorRetry<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly abortSignals: N;
        };
    }>>>;
    /** Configures the retry policy's general settings (max attempts, timeout, etc). */
    settings<const N extends VigorDeepPartial<VigorRetryPolicySettingsSchema<T>>, R extends VigorRetrySchema<any>>(input: N | ((s: VigorRetryPolicySettings<T>) => VigorRetryPolicySettings<R>) | VigorRetryPolicySettings<R>): VigorRetry<VigorRetryIn<VigorDeepMerge<T, {
        __brand?: VigorBrand<"Retry", "Schema"> | undefined;
        policy?: {
            __brand?: VigorBrand<"Retry", "Policy<Schema"> | undefined;
            target?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            }) | ((signal: AbortSignal) => any | Promise<any>) | undefined;
            abortSignals?: readonly {
                readonly aborted?: boolean | undefined;
                onabort?: ((this: AbortSignal, ev: Event) => any) | null | undefined;
                readonly reason?: any;
                throwIfAborted?: (() => void) | undefined;
                addEventListener?: {
                    <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                } | undefined;
                removeEventListener?: {
                    <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                } | undefined;
                dispatchEvent?: ((event: Event) => boolean) | undefined;
            }[] | undefined;
            settings?: {
                __brand?: VigorBrand<"Retry", "Policy<Settings<Schema"> | undefined;
                default?: (symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                }) | ((ctx: any) => any | Promise<any>) | undefined;
                maxAttempts?: number | undefined;
                maxRestarts?: number | undefined;
                timeout?: number | undefined;
            } | undefined;
            middlewares?: {
                __brand?: VigorBrand<"Retry", "Policy<Middlewares<Schema"> | undefined;
                before?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "abort" | "throwError" | "breakRetry">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
                after?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
                onResult?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((res: any) => VigorRetrySchema<any>["context"]["result"]) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
                retryIf?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((err: any) => VigorRetrySchema<any>["context"]["flags"]["doRetry"]) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "proceedRetry" | "cancelRetry">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
                onRetry?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((err: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setDelay">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
                onError?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((err: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setResult" | "proceedRestart" | "cancelRestart">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
            } | undefined;
            algorithms?: {
                __brand?: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema"> | undefined;
                _tag?: "constant" | undefined;
                jitter?: number | undefined;
                interval?: number | undefined;
                _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
            } | {
                __brand?: VigorBrand<"Retry", "Policy<Algorithms<Linear<Schema"> | undefined;
                _tag?: "linear" | undefined;
                jitter?: number | undefined;
                initial?: number | undefined;
                increment?: number | undefined;
                minDelay?: number | undefined;
                maxDelay?: number | undefined;
                _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsLinearSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
            } | {
                __brand?: VigorBrand<"Retry", "Policy<Algorithms<Backoff<Schema"> | undefined;
                _tag?: "backoff" | undefined;
                jitter?: number | undefined;
                initial?: number | undefined;
                multiplier?: number | undefined;
                unit?: number | undefined;
                minDelay?: number | undefined;
                maxDelay?: number | undefined;
                _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsBackoffSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
            } | {
                __brand?: VigorBrand<"Retry", "Policy<Algorithms<Custom<Schema"> | undefined;
                _tag?: "custom" | undefined;
                jitter?: number | undefined;
                minDelay?: number | undefined;
                maxDelay?: number | undefined;
                target?: (symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                }) | ((att: number) => number) | undefined;
                _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsCustomSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
            } | undefined;
        } | undefined;
        context?: {
            __brand?: VigorBrand<"Retry", "Context<Schema"> | undefined;
            result?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | undefined;
            error?: unknown;
            system?: {
                delay?: number | (symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                }) | undefined;
                attempt?: number | undefined;
            } | undefined;
            flags?: {
                doRetry?: boolean | undefined;
                doRestart?: boolean | undefined;
                brokeRetry?: boolean | undefined;
                overridden?: boolean | undefined;
            } | undefined;
            record?: {
                [x: string]: any;
            } | undefined;
            policy?: any;
        } | undefined;
    }>>>;
    /** Configures the retry policy's middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorRetryPolicyMiddlewaresSchema<T>>, R extends VigorRetrySchema<any>>(input: N | ((s: VigorRetryPolicyMiddlewares<T>) => VigorRetryPolicyMiddlewares<R>) | VigorRetryPolicyMiddlewares<R>): VigorRetry<VigorRetryIn<VigorDeepMerge<T, {
        __brand?: VigorBrand<"Retry", "Schema"> | undefined;
        policy?: {
            __brand?: VigorBrand<"Retry", "Policy<Schema"> | undefined;
            target?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            }) | ((signal: AbortSignal) => any | Promise<any>) | undefined;
            abortSignals?: readonly {
                readonly aborted?: boolean | undefined;
                onabort?: ((this: AbortSignal, ev: Event) => any) | null | undefined;
                readonly reason?: any;
                throwIfAborted?: (() => void) | undefined;
                addEventListener?: {
                    <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                } | undefined;
                removeEventListener?: {
                    <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                    (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                } | undefined;
                dispatchEvent?: ((event: Event) => boolean) | undefined;
            }[] | undefined;
            settings?: {
                __brand?: VigorBrand<"Retry", "Policy<Settings<Schema"> | undefined;
                default?: (symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                }) | ((ctx: any) => any | Promise<any>) | undefined;
                maxAttempts?: number | undefined;
                maxRestarts?: number | undefined;
                timeout?: number | undefined;
            } | undefined;
            middlewares?: {
                __brand?: VigorBrand<"Retry", "Policy<Middlewares<Schema"> | undefined;
                before?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "abort" | "throwError" | "breakRetry">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
                after?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
                onResult?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((res: any) => VigorRetrySchema<any>["context"]["result"]) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
                retryIf?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((err: any) => VigorRetrySchema<any>["context"]["flags"]["doRetry"]) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "proceedRetry" | "cancelRetry">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
                onRetry?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((err: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setDelay">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
                onError?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((err: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setResult" | "proceedRestart" | "cancelRestart">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                })[] | undefined;
            } | undefined;
            algorithms?: {
                __brand?: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema"> | undefined;
                _tag?: "constant" | undefined;
                jitter?: number | undefined;
                interval?: number | undefined;
                _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
            } | {
                __brand?: VigorBrand<"Retry", "Policy<Algorithms<Linear<Schema"> | undefined;
                _tag?: "linear" | undefined;
                jitter?: number | undefined;
                initial?: number | undefined;
                increment?: number | undefined;
                minDelay?: number | undefined;
                maxDelay?: number | undefined;
                _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsLinearSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
            } | {
                __brand?: VigorBrand<"Retry", "Policy<Algorithms<Backoff<Schema"> | undefined;
                _tag?: "backoff" | undefined;
                jitter?: number | undefined;
                initial?: number | undefined;
                multiplier?: number | undefined;
                unit?: number | undefined;
                minDelay?: number | undefined;
                maxDelay?: number | undefined;
                _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsBackoffSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
            } | {
                __brand?: VigorBrand<"Retry", "Policy<Algorithms<Custom<Schema"> | undefined;
                _tag?: "custom" | undefined;
                jitter?: number | undefined;
                minDelay?: number | undefined;
                maxDelay?: number | undefined;
                target?: (symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                }) | ((att: number) => number) | undefined;
                _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsCustomSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
            } | undefined;
        } | undefined;
        context?: {
            __brand?: VigorBrand<"Retry", "Context<Schema"> | undefined;
            result?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | undefined;
            error?: unknown;
            system?: {
                delay?: number | (symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                }) | undefined;
                attempt?: number | undefined;
            } | undefined;
            flags?: {
                doRetry?: boolean | undefined;
                doRestart?: boolean | undefined;
                brokeRetry?: boolean | undefined;
                overridden?: boolean | undefined;
            } | undefined;
            record?: {
                [x: string]: any;
            } | undefined;
            policy?: any;
        } | undefined;
    }>>>;
    /** Configures the retry policy's delay algorithm. */
    algorithms<const N extends VigorDeepPartial<VigorRetryPolicyAlgorithmsSchema<T>>, R extends VigorRetrySchema<any>>(input: N | ((a: VigorRetryPolicyAlgorithms<T>) => VigorRetryPolicyAlgorithms<R> | VigorRetryPolicyAlgorithmsConstant<any>)): VigorRetry<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly algorithms: any;
        };
    }>>>;
    /** Runs the target and returns its result directly, throwing on final failure. */
    request<R = T["context"]["result"]>(): Promise<R>;
    /** Runs the target and returns a result/error envelope instead of throwing. */
    requestVerbose<R = T["context"]["result"]>(): Promise<{
        success: false;
        data: null;
        error: unknown;
    } | {
        success: true;
        data: R;
        error: null;
    }>;
    /** Internal execution loop implementing the attempt/retry/restart lifecycle. */
    private requestRuntime;
}

type VigorParsePolicySettingsSchema<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
    raw: boolean;
    default: ((ctx: T["context"]) => any | Promise<any>) | VigorEmptyType;
    maxRestarts: number;
};
declare const VigorParsePolicySettingsBase: {
    readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
    readonly raw: false;
    readonly default: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
    readonly maxRestarts: 3;
};
/** Immutable builder for a parse policy's general settings. */
declare class VigorParsePolicySettings<T extends VigorParseSchema<T> = typeof VigorParseBase> extends VigorStatus<VigorParseSchema<any>, T, VigorParsePolicySettingsTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorParsePolicySettingsTypeLambda, C>;
    /** When enabled, skips content-type based parsing and returns the raw response. */
    raw<const N extends VigorParseSchema<any>["policy"]["settings"]["raw"]>(bool: N): VigorParsePolicySettings<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly raw: N;
            };
        };
    }>>>;
    /** Sets the fallback value/factory used when parsing ultimately fails. */
    default<const N extends VigorExcludeEmpty<VigorParseSchema<any>["policy"]["settings"]["default"]>>(func: N): VigorParsePolicySettings<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly default: N;
            };
        };
    }>>>;
    /** Sets the maximum number of full restarts allowed. */
    maxRestarts<const N extends VigorParseSchema<any>["policy"]["settings"]["maxRestarts"]>(num: N): VigorParsePolicySettings<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly settings: {
                readonly maxRestarts: N;
            };
        };
    }>>>;
}

type VigorParsePolicyMiddlewaresSchema<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
    before: (VigorParsePolicyMiddlewaresFluent<T>["before"] | VigorParsePolicyMiddlewaresIntercept<T>["before"])[];
    after: (VigorParsePolicyMiddlewaresFluent<T>["after"] | VigorParsePolicyMiddlewaresIntercept<T>["after"])[];
    onResult: (VigorParsePolicyMiddlewaresFluent<T>["onResult"] | VigorParsePolicyMiddlewaresIntercept<T>["onResult"])[];
    onError: (VigorParsePolicyMiddlewaresFluent<T>["onError"] | VigorParsePolicyMiddlewaresIntercept<T>["onError"])[];
};
declare const VigorParsePolicyMiddlewaresBase: {
    readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
    readonly before: [];
    readonly after: [];
    readonly onResult: [];
    readonly onError: [];
};
type VigorParsePolicyMiddlewaresFluent<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Policy<Middlewares<Fluent<Schema">;
    before: {
        _mode: "fluent";
        func: (ctx: T["context"]) => void;
    };
    after: {
        _mode: "fluent";
        func: (ctx: T["context"]) => void;
    };
    onResult: {
        _mode: "fluent";
        func: (res: T["context"]["result"]) => VigorParseSchema<any>["context"]["result"];
    };
    onError: {
        _mode: "fluent";
        func: (err: T["context"]["error"]) => void;
    };
};
type VigorParsePolicyMiddlewaresApi<T extends VigorParseSchema<T>> = {
    setResult: (res: VigorParseSchema<any>["context"]["result"]) => void;
    throwError: (err: VigorParseSchema<any>["context"]["error"]) => void;
    proceedRestart: () => void;
    cancelRestart: () => void;
};
type VigorParsePolicyMiddlewaresIntercept<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Policy<Middlewares<Intercept<Schema">;
    before: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorParsePolicyMiddlewaresApi<T>, "throwError">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>;
    };
    after: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorParsePolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>;
    };
    onResult: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorParsePolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>;
    };
    onError: {
        _mode: "intercept";
        func: (ctx: T["context"], api: Pick<VigorParsePolicyMiddlewaresApi<T>, "setResult" | "throwError" | "proceedRestart" | "cancelRestart">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>;
    };
};
/**
 * Immutable builder for a parse policy's middleware pipeline (`before`,
 * `after`, `onResult`, `onError`). Each stage accepts either "fluent"
 * middleware (returns a plain value merged into the context) or
 * "intercept" middleware (receives an explicit API to mutate control flow).
 */
declare class VigorParsePolicyMiddlewares<T extends VigorParseSchema<T> = typeof VigorParseBase> extends VigorStatus<VigorParseSchema<any>, T, VigorParsePolicyMiddlewaresTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, C>;
    /** Registers a middleware that runs before the response is parsed. */
    before<const N extends VigorParsePolicyMiddlewaresFluent<any>["before"]["func"]>(type: "fluent", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                before: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    before<const N extends VigorParsePolicyMiddlewaresIntercept<any>["before"]["func"]>(type: "intercept", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                before: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware that runs after the response has been parsed. */
    after<const N extends VigorParsePolicyMiddlewaresFluent<any>["after"]["func"]>(type: "fluent", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                after: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    after<const N extends VigorParsePolicyMiddlewaresIntercept<any>["after"]["func"]>(type: "intercept", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                after: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware that transforms or validates the parsed result. */
    onResult<const N extends VigorParsePolicyMiddlewaresFluent<any>["onResult"]["func"]>(type: "fluent", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onResult: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onResult<const N extends VigorParsePolicyMiddlewaresIntercept<any>["onResult"]["func"]>(type: "intercept", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onResult: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware that runs when parsing ultimately fails. */
    onError<const N extends VigorParsePolicyMiddlewaresFluent<any>["onError"]["func"]>(type: "fluent", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onError: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onError<const N extends VigorParsePolicyMiddlewaresIntercept<any>["onError"]["func"]>(type: "intercept", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onError: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
}

type VigorParseStrategyFunc = (response: Response) => Promise<any>;
type VigorParsePolicyStrategiesSchema<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
    funcs: Array<VigorParseStrategyFunc>;
};
declare const VigorParsePolicyStrategiesBase: {
    readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
    readonly funcs: VigorParseStrategyFunc[];
};
/** Parses a response by matching its `Content-Type` header against a known parser table. */
declare const VigorParseContentTypeStrategy: VigorParseStrategyFunc;
/** Parses a response by trying a sequence of body-reading methods until one succeeds. */
declare const VigorParseSniffStrategy: VigorParseStrategyFunc;
/** Immutable builder for a parse policy's fallback chain of parsing strategies. */
declare class VigorParsePolicyStrategies<T extends VigorParseSchema<T> = typeof VigorParseBase> extends VigorStatus<VigorParseSchema<any>, T, VigorParsePolicyStrategiesTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorParsePolicyStrategiesTypeLambda, C>;
    /**
     * Adds strategy functions to the fallback chain.
     *
     * @param replace - When `true`, replaces the existing chain instead of
     *  appending to it (the default is to concat, since strategies are
     *  tried in sequence as a fallback chain).
     */
    private _set;
    /** Adds the content-type based parsing strategy. */
    contentType(replace?: boolean): VigorParsePolicyStrategies<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly strategies: {
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
    }>>>;
    /** Adds the sniffing (try-each-method) parsing strategy. */
    sniff(replace?: boolean): VigorParsePolicyStrategies<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly strategies: {
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
    }>>>;
    /** Adds a strategy that always parses the response as JSON. */
    json(replace?: boolean): VigorParsePolicyStrategies<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly strategies: {
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
    }>>>;
    /** Adds a strategy that always parses the response as text. */
    text(replace?: boolean): VigorParsePolicyStrategies<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly strategies: {
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
    }>>>;
    /** Adds a strategy that always parses the response as an `ArrayBuffer`. */
    arrayBuffer(replace?: boolean): VigorParsePolicyStrategies<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly strategies: {
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
    }>>>;
    /** Adds a strategy that always parses the response as a `Blob`. */
    blob(replace?: boolean): VigorParsePolicyStrategies<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly strategies: {
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
    }>>>;
    /** Adds a strategy that always parses the response as a `Uint8Array`. */
    bytes(replace?: boolean): VigorParsePolicyStrategies<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly strategies: {
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
    }>>>;
    /** Adds a strategy that always parses the response as `FormData`. */
    formData(replace?: boolean): VigorParsePolicyStrategies<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly strategies: {
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
    }>>>;
    /** Adds a user-supplied custom parsing strategy. */
    custom<const N extends VigorParseStrategyFunc>(func: N, replace?: boolean): VigorParsePolicyStrategies<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly strategies: {
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
    }>>>;
}

type VigorParseIn<T> = T extends VigorParseSchema<any> ? T : never;
interface VigorParseTypeLambda extends VigorTypeLambda {
    readonly Target: VigorParse<VigorParseIn<this["In"]>>;
}
interface VigorParsePolicySettingsTypeLambda extends VigorTypeLambda {
    readonly Target: VigorParsePolicySettings<VigorParseIn<this["In"]>>;
}
interface VigorParsePolicyMiddlewaresTypeLambda extends VigorTypeLambda {
    readonly Target: VigorParsePolicyMiddlewares<VigorParseIn<this["In"]>>;
}
interface VigorParsePolicyStrategiesTypeLambda extends VigorTypeLambda {
    readonly Target: VigorParsePolicyStrategies<VigorParseIn<this["In"]>>;
}

type VigorParseContextSchema<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Context<Schema">;
    result: unknown | VigorDefaultType;
    error: unknown;
    response: Response | VigorDefaultType;
    flags: {
        overrided: boolean;
        restarted: boolean;
    };
    record: Record<string, any>;
    policy: T["policy"];
};

type VigorParsePolicySchema<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Policy<Schema">;
    target: Response | VigorDefaultType;
    settings: VigorParsePolicySettingsSchema<T>;
    middlewares: VigorParsePolicyMiddlewaresSchema<T>;
    strategies: VigorParsePolicyStrategiesSchema<T>;
};
declare const VigorParsePolicyBase: {
    readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
    readonly target: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Default">;
    };
    readonly settings: {
        readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
        readonly raw: false;
        readonly default: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
        readonly maxRestarts: 3;
    };
    readonly middlewares: {
        readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
        readonly before: [];
        readonly after: [];
        readonly onResult: [];
        readonly onError: [];
    };
    readonly strategies: {
        readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
        readonly funcs: VigorParseStrategyFunc[];
    };
};

type VigorParseSchema<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Schema">;
    policy: VigorParsePolicySchema<T>;
    context: VigorParseContextSchema<T>;
};
declare const VigorParseBase: {
    readonly __brand: VigorBrand<"Parse", "Schema">;
    readonly policy: {
        readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
        readonly target: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly settings: {
            readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
            readonly raw: false;
            readonly default: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly maxRestarts: 3;
        };
        readonly middlewares: {
            readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
            readonly before: [];
            readonly after: [];
            readonly onResult: [];
            readonly onError: [];
        };
        readonly strategies: {
            readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
            readonly funcs: VigorParseStrategyFunc[];
        };
    };
    readonly context: {
        readonly __brand: VigorBrand<"Parse", "Context<Schema">;
        readonly result: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly error: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly response: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly flags: {
            readonly overrided: false;
            readonly restarted: false;
        };
        readonly record: {};
        readonly policy: {
            readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
            readonly target: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly settings: {
                readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                readonly raw: false;
                readonly default: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly maxRestarts: 3;
            };
            readonly middlewares: {
                readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                readonly before: [];
                readonly after: [];
                readonly onResult: [];
                readonly onError: [];
            };
            readonly strategies: {
                readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
    };
};
/**
 * Immutable builder that parses an HTTP response into a result value,
 * trying each configured strategy in sequence with an optional middleware
 * pipeline and restart-on-failure support.
 */
declare class VigorParse<T extends VigorParseSchema<T> = typeof VigorParseBase> extends VigorStatus<VigorParseSchema<T>, T, VigorParseTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorParseTypeLambda, C>;
    /** Sets the `Response` object to parse. */
    target<const N extends VigorParseSchema<T>["policy"]["target"]>(response: N): VigorParse<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly target: N;
        };
    }>>>;
    /** Configures the parse policy's general settings. */
    settings<const N extends VigorDeepPartial<VigorParsePolicySettingsSchema<T>>, R extends VigorParseSchema<any>>(input: N | ((s: VigorParsePolicySettings<T>) => VigorParsePolicySettings<R>) | VigorParsePolicySettings<R>): VigorParse<VigorParseIn<VigorDeepMerge<T, {
        __brand?: VigorBrand<"Parse", "Schema"> | undefined;
        policy?: {
            __brand?: VigorBrand<"Parse", "Policy<Schema"> | undefined;
            target?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | {
                readonly headers?: {
                    append?: ((name: string, value: string) => void) | undefined;
                    delete?: ((name: string) => void) | undefined;
                    get?: ((name: string) => string | null) | undefined;
                    getSetCookie?: (() => string[]) | undefined;
                    has?: ((name: string) => boolean) | undefined;
                    set?: ((name: string, value: string) => void) | undefined;
                    forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                } | undefined;
                readonly ok?: boolean | undefined;
                readonly redirected?: boolean | undefined;
                readonly status?: number | undefined;
                readonly statusText?: string | undefined;
                readonly type?: ResponseType | undefined;
                readonly url?: string | undefined;
                clone?: (() => Response) | undefined;
                readonly body?: {
                    readonly locked?: boolean | undefined;
                    cancel?: ((reason?: any) => Promise<void>) | undefined;
                    getReader?: {
                        (options: {
                            mode: "byob";
                        }): ReadableStreamBYOBReader;
                        (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                        (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                    } | undefined;
                    pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                    pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                    tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                } | null | undefined;
                readonly bodyUsed?: boolean | undefined;
                arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                blob?: (() => Promise<Blob>) | undefined;
                bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                formData?: (() => Promise<FormData>) | undefined;
                json?: (() => Promise<any>) | undefined;
                text?: (() => Promise<string>) | undefined;
            } | undefined;
            settings?: {
                __brand?: VigorBrand<"Parse", "Policy<Settings<Schema"> | undefined;
                raw?: boolean | undefined;
                default?: (symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                }) | ((ctx: any) => any | Promise<any>) | undefined;
                maxRestarts?: number | undefined;
            } | undefined;
            middlewares?: {
                __brand?: VigorBrand<"Parse", "Policy<Middlewares<Schema"> | undefined;
                before?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
                after?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
                onResult?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((res: any) => VigorParseSchema<any>["context"]["result"]) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
                onError?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((err: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult" | "proceedRestart" | "cancelRestart">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
            } | undefined;
            strategies?: {
                __brand?: VigorBrand<"Parse", "Policy<Strategies<Schema"> | undefined;
                funcs?: readonly VigorParseStrategyFunc[] | undefined;
            } | undefined;
        } | undefined;
        context?: {
            __brand?: VigorBrand<"Parse", "Context<Schema"> | undefined;
            result?: unknown | VigorDefaultType;
            error?: unknown;
            response?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | {
                readonly headers?: {
                    append?: ((name: string, value: string) => void) | undefined;
                    delete?: ((name: string) => void) | undefined;
                    get?: ((name: string) => string | null) | undefined;
                    getSetCookie?: (() => string[]) | undefined;
                    has?: ((name: string) => boolean) | undefined;
                    set?: ((name: string, value: string) => void) | undefined;
                    forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                } | undefined;
                readonly ok?: boolean | undefined;
                readonly redirected?: boolean | undefined;
                readonly status?: number | undefined;
                readonly statusText?: string | undefined;
                readonly type?: ResponseType | undefined;
                readonly url?: string | undefined;
                clone?: (() => Response) | undefined;
                readonly body?: {
                    readonly locked?: boolean | undefined;
                    cancel?: ((reason?: any) => Promise<void>) | undefined;
                    getReader?: {
                        (options: {
                            mode: "byob";
                        }): ReadableStreamBYOBReader;
                        (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                        (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                    } | undefined;
                    pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                    pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                    tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                } | null | undefined;
                readonly bodyUsed?: boolean | undefined;
                arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                blob?: (() => Promise<Blob>) | undefined;
                bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                formData?: (() => Promise<FormData>) | undefined;
                json?: (() => Promise<any>) | undefined;
                text?: (() => Promise<string>) | undefined;
            } | undefined;
            flags?: {
                overrided?: boolean | undefined;
                restarted?: boolean | undefined;
            } | undefined;
            record?: {
                [x: string]: any;
            } | undefined;
            policy?: any;
        } | undefined;
    }>>>;
    /** Configures the parse policy's middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorParsePolicyMiddlewaresSchema<T>>, R extends VigorParseSchema<any>>(input: N | ((s: VigorParsePolicyMiddlewares<T>) => VigorParsePolicyMiddlewares<R>) | VigorParsePolicyMiddlewares<R>): VigorParse<VigorParseIn<VigorDeepMerge<T, {
        __brand?: VigorBrand<"Parse", "Schema"> | undefined;
        policy?: {
            __brand?: VigorBrand<"Parse", "Policy<Schema"> | undefined;
            target?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | {
                readonly headers?: {
                    append?: ((name: string, value: string) => void) | undefined;
                    delete?: ((name: string) => void) | undefined;
                    get?: ((name: string) => string | null) | undefined;
                    getSetCookie?: (() => string[]) | undefined;
                    has?: ((name: string) => boolean) | undefined;
                    set?: ((name: string, value: string) => void) | undefined;
                    forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                } | undefined;
                readonly ok?: boolean | undefined;
                readonly redirected?: boolean | undefined;
                readonly status?: number | undefined;
                readonly statusText?: string | undefined;
                readonly type?: ResponseType | undefined;
                readonly url?: string | undefined;
                clone?: (() => Response) | undefined;
                readonly body?: {
                    readonly locked?: boolean | undefined;
                    cancel?: ((reason?: any) => Promise<void>) | undefined;
                    getReader?: {
                        (options: {
                            mode: "byob";
                        }): ReadableStreamBYOBReader;
                        (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                        (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                    } | undefined;
                    pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                    pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                    tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                } | null | undefined;
                readonly bodyUsed?: boolean | undefined;
                arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                blob?: (() => Promise<Blob>) | undefined;
                bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                formData?: (() => Promise<FormData>) | undefined;
                json?: (() => Promise<any>) | undefined;
                text?: (() => Promise<string>) | undefined;
            } | undefined;
            settings?: {
                __brand?: VigorBrand<"Parse", "Policy<Settings<Schema"> | undefined;
                raw?: boolean | undefined;
                default?: (symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                }) | ((ctx: any) => any | Promise<any>) | undefined;
                maxRestarts?: number | undefined;
            } | undefined;
            middlewares?: {
                __brand?: VigorBrand<"Parse", "Policy<Middlewares<Schema"> | undefined;
                before?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
                after?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
                onResult?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((res: any) => VigorParseSchema<any>["context"]["result"]) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
                onError?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((err: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult" | "proceedRestart" | "cancelRestart">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
            } | undefined;
            strategies?: {
                __brand?: VigorBrand<"Parse", "Policy<Strategies<Schema"> | undefined;
                funcs?: readonly VigorParseStrategyFunc[] | undefined;
            } | undefined;
        } | undefined;
        context?: {
            __brand?: VigorBrand<"Parse", "Context<Schema"> | undefined;
            result?: unknown | VigorDefaultType;
            error?: unknown;
            response?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | {
                readonly headers?: {
                    append?: ((name: string, value: string) => void) | undefined;
                    delete?: ((name: string) => void) | undefined;
                    get?: ((name: string) => string | null) | undefined;
                    getSetCookie?: (() => string[]) | undefined;
                    has?: ((name: string) => boolean) | undefined;
                    set?: ((name: string, value: string) => void) | undefined;
                    forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                } | undefined;
                readonly ok?: boolean | undefined;
                readonly redirected?: boolean | undefined;
                readonly status?: number | undefined;
                readonly statusText?: string | undefined;
                readonly type?: ResponseType | undefined;
                readonly url?: string | undefined;
                clone?: (() => Response) | undefined;
                readonly body?: {
                    readonly locked?: boolean | undefined;
                    cancel?: ((reason?: any) => Promise<void>) | undefined;
                    getReader?: {
                        (options: {
                            mode: "byob";
                        }): ReadableStreamBYOBReader;
                        (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                        (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                    } | undefined;
                    pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                    pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                    tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                } | null | undefined;
                readonly bodyUsed?: boolean | undefined;
                arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                blob?: (() => Promise<Blob>) | undefined;
                bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                formData?: (() => Promise<FormData>) | undefined;
                json?: (() => Promise<any>) | undefined;
                text?: (() => Promise<string>) | undefined;
            } | undefined;
            flags?: {
                overrided?: boolean | undefined;
                restarted?: boolean | undefined;
            } | undefined;
            record?: {
                [x: string]: any;
            } | undefined;
            policy?: any;
        } | undefined;
    }>>>;
    /** Configures the parse policy's fallback chain of parsing strategies. */
    strategies<const N extends VigorDeepPartial<VigorParsePolicyStrategiesSchema<T>>, R extends VigorParseSchema<any>>(input: N | ((s: VigorParsePolicyStrategies<T>) => VigorParsePolicyStrategies<R>) | VigorParsePolicyStrategies<R>): VigorParse<VigorParseIn<VigorDeepMerge<T, {
        __brand?: VigorBrand<"Parse", "Schema"> | undefined;
        policy?: {
            __brand?: VigorBrand<"Parse", "Policy<Schema"> | undefined;
            target?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | {
                readonly headers?: {
                    append?: ((name: string, value: string) => void) | undefined;
                    delete?: ((name: string) => void) | undefined;
                    get?: ((name: string) => string | null) | undefined;
                    getSetCookie?: (() => string[]) | undefined;
                    has?: ((name: string) => boolean) | undefined;
                    set?: ((name: string, value: string) => void) | undefined;
                    forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                } | undefined;
                readonly ok?: boolean | undefined;
                readonly redirected?: boolean | undefined;
                readonly status?: number | undefined;
                readonly statusText?: string | undefined;
                readonly type?: ResponseType | undefined;
                readonly url?: string | undefined;
                clone?: (() => Response) | undefined;
                readonly body?: {
                    readonly locked?: boolean | undefined;
                    cancel?: ((reason?: any) => Promise<void>) | undefined;
                    getReader?: {
                        (options: {
                            mode: "byob";
                        }): ReadableStreamBYOBReader;
                        (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                        (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                    } | undefined;
                    pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                    pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                    tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                } | null | undefined;
                readonly bodyUsed?: boolean | undefined;
                arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                blob?: (() => Promise<Blob>) | undefined;
                bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                formData?: (() => Promise<FormData>) | undefined;
                json?: (() => Promise<any>) | undefined;
                text?: (() => Promise<string>) | undefined;
            } | undefined;
            settings?: {
                __brand?: VigorBrand<"Parse", "Policy<Settings<Schema"> | undefined;
                raw?: boolean | undefined;
                default?: (symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                }) | ((ctx: any) => any | Promise<any>) | undefined;
                maxRestarts?: number | undefined;
            } | undefined;
            middlewares?: {
                __brand?: VigorBrand<"Parse", "Policy<Middlewares<Schema"> | undefined;
                before?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
                after?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
                onResult?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((res: any) => VigorParseSchema<any>["context"]["result"]) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
                onError?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((err: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult" | "proceedRestart" | "cancelRestart">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                })[] | undefined;
            } | undefined;
            strategies?: {
                __brand?: VigorBrand<"Parse", "Policy<Strategies<Schema"> | undefined;
                funcs?: readonly VigorParseStrategyFunc[] | undefined;
            } | undefined;
        } | undefined;
        context?: {
            __brand?: VigorBrand<"Parse", "Context<Schema"> | undefined;
            result?: unknown | VigorDefaultType;
            error?: unknown;
            response?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | {
                readonly headers?: {
                    append?: ((name: string, value: string) => void) | undefined;
                    delete?: ((name: string) => void) | undefined;
                    get?: ((name: string) => string | null) | undefined;
                    getSetCookie?: (() => string[]) | undefined;
                    has?: ((name: string) => boolean) | undefined;
                    set?: ((name: string, value: string) => void) | undefined;
                    forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                } | undefined;
                readonly ok?: boolean | undefined;
                readonly redirected?: boolean | undefined;
                readonly status?: number | undefined;
                readonly statusText?: string | undefined;
                readonly type?: ResponseType | undefined;
                readonly url?: string | undefined;
                clone?: (() => Response) | undefined;
                readonly body?: {
                    readonly locked?: boolean | undefined;
                    cancel?: ((reason?: any) => Promise<void>) | undefined;
                    getReader?: {
                        (options: {
                            mode: "byob";
                        }): ReadableStreamBYOBReader;
                        (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                        (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                    } | undefined;
                    pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                    pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                    tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                } | null | undefined;
                readonly bodyUsed?: boolean | undefined;
                arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                blob?: (() => Promise<Blob>) | undefined;
                bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                formData?: (() => Promise<FormData>) | undefined;
                json?: (() => Promise<any>) | undefined;
                text?: (() => Promise<string>) | undefined;
            } | undefined;
            flags?: {
                overrided?: boolean | undefined;
                restarted?: boolean | undefined;
            } | undefined;
            record?: {
                [x: string]: any;
            } | undefined;
            policy?: any;
        } | undefined;
    }>>>;
    /** Runs parsing and returns the result directly, throwing on final failure. */
    request<R = T["context"]["result"]>(): Promise<R>;
    /** Runs parsing and returns a result/error envelope instead of throwing. */
    requestVerbose<R = T["context"]["result"]>(): Promise<{
        success: false;
        data: null;
        error: unknown;
    } | {
        success: true;
        data: R;
        error: null;
    }>;
    /** Internal execution loop implementing the strategy fallback and restart handling. */
    private requestRuntime;
}

type VigorStringable = string | number | boolean | null | undefined | Date;
type VigorFetchPolicySchema<T extends VigorFetchSchema<T>> = {
    __brand: VigorBrand<"Fetch", "Policy<Schema">;
    method: VigorFetchOptions["method"] | VigorEmptyType;
    origin: string | VigorEmptyType;
    path: string[];
    query: Record<string, VigorStringable | VigorStringable[]>[];
    hash: string;
    headers: Record<string, string>;
    body: BodyInit | object | null | VigorEmptyType;
    extra: VigorFetchExtraOptions;
    settings: VigorFetchPolicySettingsSchema<T>;
    middlewares: VigorFetchPolicyMiddlewaresSchema<T>;
    retry: VigorRetrySchema<any>;
    parse: VigorParseSchema<any>;
};
declare const VigorFetchPolicyBase: {
    readonly __brand: VigorBrand<"Fetch", "Policy<Schema">;
    readonly method: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
    readonly origin: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
    readonly path: [];
    readonly query: [];
    readonly hash: "";
    readonly headers: {};
    readonly body: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
    readonly extra: {};
    readonly settings: {
        readonly __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
        readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"];
        readonly unretryStatus: [400, 401, 403, 404, 405, 413, 422];
        readonly maxRestarts: 3;
        readonly default: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
    };
    readonly middlewares: {
        readonly __brand: VigorBrand<"Fetch", "Policy<Middlewares<Schema">;
        readonly before: [];
        readonly after: [];
        readonly onResult: [];
        readonly onError: [];
    };
    readonly retry: {
        readonly __brand: VigorBrand<"Retry", "Schema">;
        readonly policy: {
            readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
            readonly target: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly abortSignals: [];
            readonly settings: {
                readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                readonly default: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly maxAttempts: 5;
                readonly maxRestarts: 3;
                readonly timeout: 20000;
            };
            readonly middlewares: {
                readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                readonly before: [];
                readonly after: [];
                readonly onResult: [];
                readonly retryIf: [];
                readonly onRetry: [];
                readonly onError: [];
            };
            readonly algorithms: {
                readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                readonly _tag: "constant";
                readonly jitter: 1000;
                readonly interval: 2000;
                readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
            };
        };
        readonly context: {
            readonly __brand: VigorBrand<"Retry", "Context<Schema">;
            readonly result: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly error: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly system: {
                readonly delay: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly attempt: 0;
            };
            readonly flags: {
                readonly doRetry: true;
                readonly doRestart: false;
                readonly brokeRetry: false;
                readonly overridden: false;
            };
            readonly record: {};
            readonly policy: {
                readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                readonly target: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly abortSignals: [];
                readonly settings: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                    readonly default: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly maxAttempts: 5;
                    readonly maxRestarts: 3;
                    readonly timeout: 20000;
                };
                readonly middlewares: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                    readonly before: [];
                    readonly after: [];
                    readonly onResult: [];
                    readonly retryIf: [];
                    readonly onRetry: [];
                    readonly onError: [];
                };
                readonly algorithms: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                    readonly _tag: "constant";
                    readonly jitter: 1000;
                    readonly interval: 2000;
                    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                };
            };
        };
    };
    readonly parse: {
        readonly __brand: VigorBrand<"Parse", "Schema">;
        readonly policy: {
            readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
            readonly target: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly settings: {
                readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                readonly raw: false;
                readonly default: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly maxRestarts: 3;
            };
            readonly middlewares: {
                readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                readonly before: [];
                readonly after: [];
                readonly onResult: [];
                readonly onError: [];
            };
            readonly strategies: {
                readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
        readonly context: {
            readonly __brand: VigorBrand<"Parse", "Context<Schema">;
            readonly result: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly error: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly response: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly flags: {
                readonly overrided: false;
                readonly restarted: false;
            };
            readonly record: {};
            readonly policy: {
                readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                readonly target: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly settings: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                    readonly raw: false;
                    readonly default: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly maxRestarts: 3;
                };
                readonly middlewares: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                    readonly before: [];
                    readonly after: [];
                    readonly onResult: [];
                    readonly onError: [];
                };
                readonly strategies: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                    readonly funcs: VigorParseStrategyFunc[];
                };
            };
        };
    };
};

type VigorFetchSchema<T extends VigorFetchSchema<T>> = {
    __brand: VigorBrand<"Fetch", "Schema">;
    policy: VigorFetchPolicySchema<T>;
    context: VigorFetchContextSchema<T>;
};
declare const VigorFetchBase: {
    readonly __brand: VigorBrand<"Fetch", "Schema">;
    readonly policy: {
        readonly __brand: VigorBrand<"Fetch", "Policy<Schema">;
        readonly method: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
        readonly origin: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
        readonly path: [];
        readonly query: [];
        readonly hash: "";
        readonly headers: {};
        readonly body: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
        readonly extra: {};
        readonly settings: {
            readonly __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
            readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"];
            readonly unretryStatus: [400, 401, 403, 404, 405, 413, 422];
            readonly maxRestarts: 3;
            readonly default: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
        };
        readonly middlewares: {
            readonly __brand: VigorBrand<"Fetch", "Policy<Middlewares<Schema">;
            readonly before: [];
            readonly after: [];
            readonly onResult: [];
            readonly onError: [];
        };
        readonly retry: {
            readonly __brand: VigorBrand<"Retry", "Schema">;
            readonly policy: {
                readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                readonly target: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly abortSignals: [];
                readonly settings: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                    readonly default: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly maxAttempts: 5;
                    readonly maxRestarts: 3;
                    readonly timeout: 20000;
                };
                readonly middlewares: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                    readonly before: [];
                    readonly after: [];
                    readonly onResult: [];
                    readonly retryIf: [];
                    readonly onRetry: [];
                    readonly onError: [];
                };
                readonly algorithms: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                    readonly _tag: "constant";
                    readonly jitter: 1000;
                    readonly interval: 2000;
                    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                };
            };
            readonly context: {
                readonly __brand: VigorBrand<"Retry", "Context<Schema">;
                readonly result: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly error: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly system: {
                    readonly delay: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly attempt: 0;
                };
                readonly flags: {
                    readonly doRetry: true;
                    readonly doRestart: false;
                    readonly brokeRetry: false;
                    readonly overridden: false;
                };
                readonly record: {};
                readonly policy: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                    readonly target: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly abortSignals: [];
                    readonly settings: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                        readonly default: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly maxAttempts: 5;
                        readonly maxRestarts: 3;
                        readonly timeout: 20000;
                    };
                    readonly middlewares: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                        readonly before: [];
                        readonly after: [];
                        readonly onResult: [];
                        readonly retryIf: [];
                        readonly onRetry: [];
                        readonly onError: [];
                    };
                    readonly algorithms: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                        readonly _tag: "constant";
                        readonly jitter: 1000;
                        readonly interval: 2000;
                        readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                    };
                };
            };
        };
        readonly parse: {
            readonly __brand: VigorBrand<"Parse", "Schema">;
            readonly policy: {
                readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                readonly target: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly settings: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                    readonly raw: false;
                    readonly default: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly maxRestarts: 3;
                };
                readonly middlewares: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                    readonly before: [];
                    readonly after: [];
                    readonly onResult: [];
                    readonly onError: [];
                };
                readonly strategies: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                    readonly funcs: VigorParseStrategyFunc[];
                };
            };
            readonly context: {
                readonly __brand: VigorBrand<"Parse", "Context<Schema">;
                readonly result: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly error: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly response: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly flags: {
                    readonly overrided: false;
                    readonly restarted: false;
                };
                readonly record: {};
                readonly policy: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                    readonly target: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly settings: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                        readonly raw: false;
                        readonly default: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly maxRestarts: 3;
                    };
                    readonly middlewares: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                        readonly before: [];
                        readonly after: [];
                        readonly onResult: [];
                        readonly onError: [];
                    };
                    readonly strategies: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                        readonly funcs: VigorParseStrategyFunc[];
                    };
                };
            };
        };
    };
    readonly context: {
        readonly __brand: VigorBrand<"Fetch", "Context<Schema">;
        readonly href: "";
        readonly response: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly result: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly error: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly options: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly flags: {
            readonly overrided: false;
            readonly restarted: false;
        };
        readonly record: {};
        readonly policy: {
            readonly __brand: VigorBrand<"Fetch", "Policy<Schema">;
            readonly method: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly origin: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly path: [];
            readonly query: [];
            readonly hash: "";
            readonly headers: {};
            readonly body: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly extra: {};
            readonly settings: {
                readonly __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
                readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"];
                readonly unretryStatus: [400, 401, 403, 404, 405, 413, 422];
                readonly maxRestarts: 3;
                readonly default: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            };
            readonly middlewares: {
                readonly __brand: VigorBrand<"Fetch", "Policy<Middlewares<Schema">;
                readonly before: [];
                readonly after: [];
                readonly onResult: [];
                readonly onError: [];
            };
            readonly retry: {
                readonly __brand: VigorBrand<"Retry", "Schema">;
                readonly policy: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                    readonly target: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly abortSignals: [];
                    readonly settings: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                        readonly default: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly maxAttempts: 5;
                        readonly maxRestarts: 3;
                        readonly timeout: 20000;
                    };
                    readonly middlewares: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                        readonly before: [];
                        readonly after: [];
                        readonly onResult: [];
                        readonly retryIf: [];
                        readonly onRetry: [];
                        readonly onError: [];
                    };
                    readonly algorithms: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                        readonly _tag: "constant";
                        readonly jitter: 1000;
                        readonly interval: 2000;
                        readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                    };
                };
                readonly context: {
                    readonly __brand: VigorBrand<"Retry", "Context<Schema">;
                    readonly result: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly error: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly system: {
                        readonly delay: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly attempt: 0;
                    };
                    readonly flags: {
                        readonly doRetry: true;
                        readonly doRestart: false;
                        readonly brokeRetry: false;
                        readonly overridden: false;
                    };
                    readonly record: {};
                    readonly policy: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                        readonly target: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly abortSignals: [];
                        readonly settings: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                            readonly default: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly maxAttempts: 5;
                            readonly maxRestarts: 3;
                            readonly timeout: 20000;
                        };
                        readonly middlewares: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                            readonly before: [];
                            readonly after: [];
                            readonly onResult: [];
                            readonly retryIf: [];
                            readonly onRetry: [];
                            readonly onError: [];
                        };
                        readonly algorithms: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                            readonly _tag: "constant";
                            readonly jitter: 1000;
                            readonly interval: 2000;
                            readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                        };
                    };
                };
            };
            readonly parse: {
                readonly __brand: VigorBrand<"Parse", "Schema">;
                readonly policy: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                    readonly target: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly settings: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                        readonly raw: false;
                        readonly default: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly maxRestarts: 3;
                    };
                    readonly middlewares: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                        readonly before: [];
                        readonly after: [];
                        readonly onResult: [];
                        readonly onError: [];
                    };
                    readonly strategies: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                        readonly funcs: VigorParseStrategyFunc[];
                    };
                };
                readonly context: {
                    readonly __brand: VigorBrand<"Parse", "Context<Schema">;
                    readonly result: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly error: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly response: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly flags: {
                        readonly overrided: false;
                        readonly restarted: false;
                    };
                    readonly record: {};
                    readonly policy: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                        readonly target: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly settings: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                            readonly raw: false;
                            readonly default: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly maxRestarts: 3;
                        };
                        readonly middlewares: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                            readonly before: [];
                            readonly after: [];
                            readonly onResult: [];
                            readonly onError: [];
                        };
                        readonly strategies: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                            readonly funcs: VigorParseStrategyFunc[];
                        };
                    };
                };
            };
        };
    };
};
/**
 * Immutable builder that performs an HTTP request, composing an internal
 * {@link VigorRetry} engine (for retry/timeout/backoff) and a
 * {@link VigorParse} engine (for response parsing), with a configurable
 * middleware pipeline around request building and response handling.
 */
declare class VigorFetch<T extends VigorFetchSchema<T> = typeof VigorFetchBase> extends VigorStatus<VigorFetchSchema<T>, T, VigorFetchTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorFetchTypeLambda, C>;
    /** Sets the HTTP method. Defaults to `POST` when a body is set, otherwise `GET`. */
    method<const N extends VigorFetchOptions["method"]>(str: N): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly method: N;
        };
    }>>>;
    /** Sets the request origin, either an absolute URL or a path relative to the current page. */
    origin<const N extends string>(str: N): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly origin: N;
        };
    }>>>;
    /** Appends path segments to the request URL. */
    path<const N extends VigorStringable[]>(...strs: N): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly path: string[];
        };
    }>>>;
    /** Adds query-string parameter objects to the request URL. */
    query<const N extends VigorFetchPolicySchema<any>["query"][number]>(...objs: N[]): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly query: N[];
        };
    }>>>;
    /** Sets the URL fragment ("hash"), replacing any previous value. */
    hash<const N extends string>(str: N): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly hash: N;
        };
    }>>>;
    /**
     * Sets request headers.
     *
     * @param mode - `"overwrite"` discards all previously configured headers
     *  and keeps only the ones passed here. `"merge"` behaves like
     *  `Object.assign`, overwriting only the keys that overlap and keeping
     *  the rest.
     */
    headers<const N extends Record<string, string>>(mode: "overwrite" | "merge", obj: N): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly headers: N;
        };
    }>>>;
    /**
     * Sets the request body.
     *
     * @param mode - `"overwrite"` discards the previous body and fully
     *  replaces it with this value. `"merge"` shallow-merges (via
     *  `Object.assign`) when both the previous and new body are plain
     *  objects; for any other body type (string/Blob/FormData/etc) it is
     *  simply replaced.
     */
    body<const N extends BodyInit | object | null>(mode: "overwrite" | "merge", obj: N): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly body: N;
        };
    }>>>;
    /**
     * Sets additional `RequestInit` options other than headers/body/method/signal
     * (e.g. `credentials`, `mode`, `cache`, `redirect`, `referrer`,
     * `referrerPolicy`, `keepalive`, `integrity`).
     *
     * @param mode - `"overwrite"` discards all previously configured options
     *  and replaces them with this value. `"merge"` shallow-merges this
     *  value onto the previous options.
     */
    options<const N extends VigorFetchPolicySchema<any>["extra"]>(mode: "overwrite" | "merge", obj: N): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly extra: N;
        };
    }>>>;
    /** Configures the fetch policy's general settings. */
    settings<const N extends VigorDeepPartial<VigorFetchPolicySettingsSchema<T>>, R extends VigorFetchSchema<any>>(input: N | ((s: VigorFetchPolicySettings<T>) => VigorFetchPolicySettings<R>) | VigorFetchPolicySettings<R>): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        __brand?: VigorBrand<"Fetch", "Schema"> | undefined;
        policy?: {
            __brand?: VigorBrand<"Fetch", "Policy<Schema"> | undefined;
            method?: VigorFetchOptions["method"] | VigorEmptyType;
            origin?: string | (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            }) | undefined;
            path?: readonly string[] | undefined;
            query?: readonly {
                [x: string]: VigorStringable | readonly VigorStringable[];
            }[] | undefined;
            hash?: string | undefined;
            headers?: {
                [x: string]: string | undefined;
            } | undefined;
            body?: string | object | (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            }) | {
                readonly locked?: boolean | undefined;
                cancel?: ((reason?: any) => Promise<void>) | undefined;
                getReader?: {
                    (options: {
                        mode: "byob";
                    }): ReadableStreamBYOBReader;
                    (): ReadableStreamDefaultReader<any>;
                    (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<any>;
                } | undefined;
                pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, any>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                pipeTo?: ((destination: WritableStream<any>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                tee?: (() => [ReadableStream<any>, ReadableStream<any>]) | undefined;
            } | {
                readonly size?: number | undefined;
                readonly type?: string | undefined;
                arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                slice?: ((start?: number, end?: number, contentType?: string) => Blob) | undefined;
                stream?: (() => ReadableStream<Uint8Array<ArrayBuffer>>) | undefined;
                text?: (() => Promise<string>) | undefined;
            } | {
                readonly byteLength?: number | undefined;
                slice?: ((begin?: number, end?: number) => ArrayBuffer) | undefined;
                readonly maxByteLength?: number | undefined;
                readonly resizable?: boolean | undefined;
                resize?: ((newByteLength?: number) => void) | undefined;
                readonly detached?: boolean | undefined;
                transfer?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                transferToFixedLength?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                readonly [Symbol.toStringTag]?: "ArrayBuffer" | undefined;
            } | {
                readonly buffer?: {
                    readonly byteLength?: number | undefined;
                    slice?: ((begin?: number, end?: number) => ArrayBuffer) | undefined;
                    readonly maxByteLength?: number | undefined;
                    readonly resizable?: boolean | undefined;
                    resize?: ((newByteLength?: number) => void) | undefined;
                    readonly detached?: boolean | undefined;
                    transfer?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                    transferToFixedLength?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                    readonly [Symbol.toStringTag]?: "ArrayBuffer" | undefined;
                } | undefined;
                readonly byteLength?: number | undefined;
                readonly byteOffset?: number | undefined;
            } | {
                append?: {
                    (name: string, value: string | Blob): void;
                    (name: string, value: string): void;
                    (name: string, blobValue: Blob, filename?: string): void;
                } | undefined;
                delete?: ((name: string) => void) | undefined;
                get?: ((name: string) => FormDataEntryValue | null) | undefined;
                getAll?: ((name: string) => FormDataEntryValue[]) | undefined;
                has?: ((name: string) => boolean) | undefined;
                set?: {
                    (name: string, value: string | Blob): void;
                    (name: string, value: string): void;
                    (name: string, blobValue: Blob, filename?: string): void;
                } | undefined;
                forEach?: ((callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any) => void) | undefined;
            } | {
                readonly size?: number | undefined;
                append?: ((name: string, value: string) => void) | undefined;
                delete?: ((name: string, value?: string) => void) | undefined;
                get?: ((name: string) => string | null) | undefined;
                getAll?: ((name: string) => string[]) | undefined;
                has?: ((name: string, value?: string) => boolean) | undefined;
                set?: ((name: string, value: string) => void) | undefined;
                sort?: (() => void) | undefined;
                toString?: (() => string) | undefined;
                forEach?: ((callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any) => void) | undefined;
            } | null | undefined;
            extra?: {
                cache?: RequestCache | undefined;
                credentials?: RequestCredentials | undefined;
                integrity?: string | undefined;
                keepalive?: boolean | undefined;
                mode?: RequestMode | undefined;
                priority?: RequestPriority | undefined;
                redirect?: RequestRedirect | undefined;
                referrer?: string | undefined;
                referrerPolicy?: ReferrerPolicy | undefined;
                window?: null | undefined;
            } | undefined;
            settings?: {
                __brand?: VigorBrand<"Fetch", "Policy<Settings<Schema"> | undefined;
                retryHeaders?: readonly string[] | undefined;
                unretryStatus?: readonly number[] | undefined;
                maxRestarts?: number | undefined;
                default?: (symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                }) | ((ctx: any) => any | Promise<any>) | undefined;
            } | undefined;
            middlewares?: {
                __brand?: VigorBrand<"Fetch", "Policy<Middlewares<Schema"> | undefined;
                before?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorFetchPolicyMiddlewaresApi<any>, "throwError" | "setOptions" | "setHeaders" | "setBody">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>) | undefined;
                })[] | undefined;
                after?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorFetchPolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>) | undefined;
                })[] | undefined;
                onResult?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((res: any) => VigorFetchSchema<any>["context"]["result"]) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorFetchPolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>) | undefined;
                })[] | undefined;
                onError?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((err: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorFetchPolicyMiddlewaresApi<any>, "throwError" | "setResult" | "proceedRestart" | "cancelRestart">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>) | undefined;
                })[] | undefined;
            } | undefined;
            retry?: {
                __brand?: VigorBrand<"Retry", "Schema"> | undefined;
                policy?: {
                    __brand?: VigorBrand<"Retry", "Policy<Schema"> | undefined;
                    target?: (symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    }) | ((signal: AbortSignal) => any | Promise<any>) | undefined;
                    abortSignals?: readonly {
                        readonly aborted?: boolean | undefined;
                        onabort?: ((this: AbortSignal, ev: Event) => any) | null | undefined;
                        readonly reason?: any;
                        throwIfAborted?: (() => void) | undefined;
                        addEventListener?: {
                            <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                            (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                        } | undefined;
                        removeEventListener?: {
                            <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                            (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                        } | undefined;
                        dispatchEvent?: ((event: Event) => boolean) | undefined;
                    }[] | undefined;
                    settings?: {
                        __brand?: VigorBrand<"Retry", "Policy<Settings<Schema"> | undefined;
                        default?: (symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        }) | ((ctx: any) => any | Promise<any>) | undefined;
                        maxAttempts?: number | undefined;
                        maxRestarts?: number | undefined;
                        timeout?: number | undefined;
                    } | undefined;
                    middlewares?: {
                        __brand?: VigorBrand<"Retry", "Policy<Middlewares<Schema"> | undefined;
                        before?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((ctx: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "abort" | "throwError" | "breakRetry">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        after?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((ctx: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        onResult?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((res: any) => VigorRetrySchema<any>["context"]["result"]) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        retryIf?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((err: any) => VigorRetrySchema<any>["context"]["flags"]["doRetry"]) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "proceedRetry" | "cancelRetry">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        onRetry?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((err: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setDelay">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        onError?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((err: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setResult" | "proceedRestart" | "cancelRestart">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                    } | undefined;
                    algorithms?: {
                        __brand?: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema"> | undefined;
                        _tag?: "constant" | undefined;
                        jitter?: number | undefined;
                        interval?: number | undefined;
                        _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
                    } | {
                        __brand?: VigorBrand<"Retry", "Policy<Algorithms<Linear<Schema"> | undefined;
                        _tag?: "linear" | undefined;
                        jitter?: number | undefined;
                        initial?: number | undefined;
                        increment?: number | undefined;
                        minDelay?: number | undefined;
                        maxDelay?: number | undefined;
                        _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsLinearSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
                    } | {
                        __brand?: VigorBrand<"Retry", "Policy<Algorithms<Backoff<Schema"> | undefined;
                        _tag?: "backoff" | undefined;
                        jitter?: number | undefined;
                        initial?: number | undefined;
                        multiplier?: number | undefined;
                        unit?: number | undefined;
                        minDelay?: number | undefined;
                        maxDelay?: number | undefined;
                        _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsBackoffSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
                    } | {
                        __brand?: VigorBrand<"Retry", "Policy<Algorithms<Custom<Schema"> | undefined;
                        _tag?: "custom" | undefined;
                        jitter?: number | undefined;
                        minDelay?: number | undefined;
                        maxDelay?: number | undefined;
                        target?: (symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        }) | ((att: number) => number) | undefined;
                        _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsCustomSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
                    } | undefined;
                } | undefined;
                context?: {
                    __brand?: VigorBrand<"Retry", "Context<Schema"> | undefined;
                    result?: (symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    }) | undefined;
                    error?: unknown;
                    system?: {
                        delay?: number | (symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        }) | undefined;
                        attempt?: number | undefined;
                    } | undefined;
                    flags?: {
                        doRetry?: boolean | undefined;
                        doRestart?: boolean | undefined;
                        brokeRetry?: boolean | undefined;
                        overridden?: boolean | undefined;
                    } | undefined;
                    record?: {
                        [x: string]: any;
                    } | undefined;
                    policy?: any;
                } | undefined;
            } | undefined;
            parse?: {
                __brand?: VigorBrand<"Parse", "Schema"> | undefined;
                policy?: {
                    __brand?: VigorBrand<"Parse", "Policy<Schema"> | undefined;
                    target?: (symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    }) | {
                        readonly headers?: {
                            append?: ((name: string, value: string) => void) | undefined;
                            delete?: ((name: string) => void) | undefined;
                            get?: ((name: string) => string | null) | undefined;
                            getSetCookie?: (() => string[]) | undefined;
                            has?: ((name: string) => boolean) | undefined;
                            set?: ((name: string, value: string) => void) | undefined;
                            forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                        } | undefined;
                        readonly ok?: boolean | undefined;
                        readonly redirected?: boolean | undefined;
                        readonly status?: number | undefined;
                        readonly statusText?: string | undefined;
                        readonly type?: ResponseType | undefined;
                        readonly url?: string | undefined;
                        clone?: (() => Response) | undefined;
                        readonly body?: {
                            readonly locked?: boolean | undefined;
                            cancel?: ((reason?: any) => Promise<void>) | undefined;
                            getReader?: {
                                (options: {
                                    mode: "byob";
                                }): ReadableStreamBYOBReader;
                                (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                                (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                            } | undefined;
                            pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                            pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                            tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                        } | null | undefined;
                        readonly bodyUsed?: boolean | undefined;
                        arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                        blob?: (() => Promise<Blob>) | undefined;
                        bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                        formData?: (() => Promise<FormData>) | undefined;
                        json?: (() => Promise<any>) | undefined;
                        text?: (() => Promise<string>) | undefined;
                    } | undefined;
                    settings?: {
                        __brand?: VigorBrand<"Parse", "Policy<Settings<Schema"> | undefined;
                        raw?: boolean | undefined;
                        default?: (symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        }) | ((ctx: any) => any | Promise<any>) | undefined;
                        maxRestarts?: number | undefined;
                    } | undefined;
                    middlewares?: {
                        __brand?: VigorBrand<"Parse", "Policy<Middlewares<Schema"> | undefined;
                        before?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((ctx: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        after?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((ctx: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        onResult?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((res: any) => VigorParseSchema<any>["context"]["result"]) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        onError?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((err: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult" | "proceedRestart" | "cancelRestart">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                        })[] | undefined;
                    } | undefined;
                    strategies?: {
                        __brand?: VigorBrand<"Parse", "Policy<Strategies<Schema"> | undefined;
                        funcs?: readonly VigorParseStrategyFunc[] | undefined;
                    } | undefined;
                } | undefined;
                context?: {
                    __brand?: VigorBrand<"Parse", "Context<Schema"> | undefined;
                    result?: unknown | VigorDefaultType;
                    error?: unknown;
                    response?: (symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    }) | {
                        readonly headers?: {
                            append?: ((name: string, value: string) => void) | undefined;
                            delete?: ((name: string) => void) | undefined;
                            get?: ((name: string) => string | null) | undefined;
                            getSetCookie?: (() => string[]) | undefined;
                            has?: ((name: string) => boolean) | undefined;
                            set?: ((name: string, value: string) => void) | undefined;
                            forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                        } | undefined;
                        readonly ok?: boolean | undefined;
                        readonly redirected?: boolean | undefined;
                        readonly status?: number | undefined;
                        readonly statusText?: string | undefined;
                        readonly type?: ResponseType | undefined;
                        readonly url?: string | undefined;
                        clone?: (() => Response) | undefined;
                        readonly body?: {
                            readonly locked?: boolean | undefined;
                            cancel?: ((reason?: any) => Promise<void>) | undefined;
                            getReader?: {
                                (options: {
                                    mode: "byob";
                                }): ReadableStreamBYOBReader;
                                (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                                (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                            } | undefined;
                            pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                            pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                            tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                        } | null | undefined;
                        readonly bodyUsed?: boolean | undefined;
                        arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                        blob?: (() => Promise<Blob>) | undefined;
                        bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                        formData?: (() => Promise<FormData>) | undefined;
                        json?: (() => Promise<any>) | undefined;
                        text?: (() => Promise<string>) | undefined;
                    } | undefined;
                    flags?: {
                        overrided?: boolean | undefined;
                        restarted?: boolean | undefined;
                    } | undefined;
                    record?: {
                        [x: string]: any;
                    } | undefined;
                    policy?: any;
                } | undefined;
            } | undefined;
        } | undefined;
        context?: {
            __brand?: VigorBrand<"Fetch", "Context<Schema"> | undefined;
            href?: string | undefined;
            response?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | {
                readonly headers?: {
                    append?: ((name: string, value: string) => void) | undefined;
                    delete?: ((name: string) => void) | undefined;
                    get?: ((name: string) => string | null) | undefined;
                    getSetCookie?: (() => string[]) | undefined;
                    has?: ((name: string) => boolean) | undefined;
                    set?: ((name: string, value: string) => void) | undefined;
                    forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                } | undefined;
                readonly ok?: boolean | undefined;
                readonly redirected?: boolean | undefined;
                readonly status?: number | undefined;
                readonly statusText?: string | undefined;
                readonly type?: ResponseType | undefined;
                readonly url?: string | undefined;
                clone?: (() => Response) | undefined;
                readonly body?: {
                    readonly locked?: boolean | undefined;
                    cancel?: ((reason?: any) => Promise<void>) | undefined;
                    getReader?: {
                        (options: {
                            mode: "byob";
                        }): ReadableStreamBYOBReader;
                        (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                        (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                    } | undefined;
                    pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                    pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                    tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                } | null | undefined;
                readonly bodyUsed?: boolean | undefined;
                arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                blob?: (() => Promise<Blob>) | undefined;
                bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                formData?: (() => Promise<FormData>) | undefined;
                json?: (() => Promise<any>) | undefined;
                text?: (() => Promise<string>) | undefined;
            } | undefined;
            result?: unknown | VigorDefaultType;
            error?: unknown;
            options?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | {
                cache?: RequestCache | undefined;
                credentials?: RequestCredentials | undefined;
                integrity?: string | undefined;
                keepalive?: boolean | undefined;
                mode?: RequestMode | undefined;
                priority?: RequestPriority | undefined;
                redirect?: RequestRedirect | undefined;
                referrer?: string | undefined;
                referrerPolicy?: ReferrerPolicy | undefined;
                window?: null | undefined;
                method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE" | undefined;
                headers?: {
                    [x: string]: string | undefined;
                } | undefined;
                body?: string | {
                    readonly locked?: boolean | undefined;
                    cancel?: ((reason?: any) => Promise<void>) | undefined;
                    getReader?: {
                        (options: {
                            mode: "byob";
                        }): ReadableStreamBYOBReader;
                        (): ReadableStreamDefaultReader<any>;
                        (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<any>;
                    } | undefined;
                    pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, any>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                    pipeTo?: ((destination: WritableStream<any>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                    tee?: (() => [ReadableStream<any>, ReadableStream<any>]) | undefined;
                } | {
                    readonly size?: number | undefined;
                    readonly type?: string | undefined;
                    arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                    bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                    slice?: ((start?: number, end?: number, contentType?: string) => Blob) | undefined;
                    stream?: (() => ReadableStream<Uint8Array<ArrayBuffer>>) | undefined;
                    text?: (() => Promise<string>) | undefined;
                } | {
                    readonly byteLength?: number | undefined;
                    slice?: ((begin?: number, end?: number) => ArrayBuffer) | undefined;
                    readonly maxByteLength?: number | undefined;
                    readonly resizable?: boolean | undefined;
                    resize?: ((newByteLength?: number) => void) | undefined;
                    readonly detached?: boolean | undefined;
                    transfer?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                    transferToFixedLength?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                    readonly [Symbol.toStringTag]?: "ArrayBuffer" | undefined;
                } | {
                    readonly buffer?: {
                        readonly byteLength?: number | undefined;
                        slice?: ((begin?: number, end?: number) => ArrayBuffer) | undefined;
                        readonly maxByteLength?: number | undefined;
                        readonly resizable?: boolean | undefined;
                        resize?: ((newByteLength?: number) => void) | undefined;
                        readonly detached?: boolean | undefined;
                        transfer?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                        transferToFixedLength?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                        readonly [Symbol.toStringTag]?: "ArrayBuffer" | undefined;
                    } | undefined;
                    readonly byteLength?: number | undefined;
                    readonly byteOffset?: number | undefined;
                } | {
                    append?: {
                        (name: string, value: string | Blob): void;
                        (name: string, value: string): void;
                        (name: string, blobValue: Blob, filename?: string): void;
                    } | undefined;
                    delete?: ((name: string) => void) | undefined;
                    get?: ((name: string) => FormDataEntryValue | null) | undefined;
                    getAll?: ((name: string) => FormDataEntryValue[]) | undefined;
                    has?: ((name: string) => boolean) | undefined;
                    set?: {
                        (name: string, value: string | Blob): void;
                        (name: string, value: string): void;
                        (name: string, blobValue: Blob, filename?: string): void;
                    } | undefined;
                    forEach?: ((callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any) => void) | undefined;
                } | {
                    readonly size?: number | undefined;
                    append?: ((name: string, value: string) => void) | undefined;
                    delete?: ((name: string, value?: string) => void) | undefined;
                    get?: ((name: string) => string | null) | undefined;
                    getAll?: ((name: string) => string[]) | undefined;
                    has?: ((name: string, value?: string) => boolean) | undefined;
                    set?: ((name: string, value: string) => void) | undefined;
                    sort?: (() => void) | undefined;
                    toString?: (() => string) | undefined;
                    forEach?: ((callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any) => void) | undefined;
                } | null | undefined;
                signal?: {
                    readonly aborted?: boolean | undefined;
                    onabort?: ((this: AbortSignal, ev: Event) => any) | null | undefined;
                    readonly reason?: any;
                    throwIfAborted?: (() => void) | undefined;
                    addEventListener?: {
                        <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                    } | undefined;
                    removeEventListener?: {
                        <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                    } | undefined;
                    dispatchEvent?: ((event: Event) => boolean) | undefined;
                } | undefined;
            } | undefined;
            flags?: {
                overrided?: boolean | undefined;
                restarted?: boolean | undefined;
            } | undefined;
            record?: {
                [x: string]: any;
            } | undefined;
            policy?: any;
        } | undefined;
    }>>>;
    /** Configures the fetch policy's middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorFetchPolicyMiddlewaresSchema<T>>, R extends VigorFetchSchema<any>>(input: N | ((s: VigorFetchPolicyMiddlewares<T>) => VigorFetchPolicyMiddlewares<R>) | VigorFetchPolicyMiddlewares<R>): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        __brand?: VigorBrand<"Fetch", "Schema"> | undefined;
        policy?: {
            __brand?: VigorBrand<"Fetch", "Policy<Schema"> | undefined;
            method?: VigorFetchOptions["method"] | VigorEmptyType;
            origin?: string | (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            }) | undefined;
            path?: readonly string[] | undefined;
            query?: readonly {
                [x: string]: VigorStringable | readonly VigorStringable[];
            }[] | undefined;
            hash?: string | undefined;
            headers?: {
                [x: string]: string | undefined;
            } | undefined;
            body?: string | object | (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            }) | {
                readonly locked?: boolean | undefined;
                cancel?: ((reason?: any) => Promise<void>) | undefined;
                getReader?: {
                    (options: {
                        mode: "byob";
                    }): ReadableStreamBYOBReader;
                    (): ReadableStreamDefaultReader<any>;
                    (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<any>;
                } | undefined;
                pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, any>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                pipeTo?: ((destination: WritableStream<any>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                tee?: (() => [ReadableStream<any>, ReadableStream<any>]) | undefined;
            } | {
                readonly size?: number | undefined;
                readonly type?: string | undefined;
                arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                slice?: ((start?: number, end?: number, contentType?: string) => Blob) | undefined;
                stream?: (() => ReadableStream<Uint8Array<ArrayBuffer>>) | undefined;
                text?: (() => Promise<string>) | undefined;
            } | {
                readonly byteLength?: number | undefined;
                slice?: ((begin?: number, end?: number) => ArrayBuffer) | undefined;
                readonly maxByteLength?: number | undefined;
                readonly resizable?: boolean | undefined;
                resize?: ((newByteLength?: number) => void) | undefined;
                readonly detached?: boolean | undefined;
                transfer?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                transferToFixedLength?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                readonly [Symbol.toStringTag]?: "ArrayBuffer" | undefined;
            } | {
                readonly buffer?: {
                    readonly byteLength?: number | undefined;
                    slice?: ((begin?: number, end?: number) => ArrayBuffer) | undefined;
                    readonly maxByteLength?: number | undefined;
                    readonly resizable?: boolean | undefined;
                    resize?: ((newByteLength?: number) => void) | undefined;
                    readonly detached?: boolean | undefined;
                    transfer?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                    transferToFixedLength?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                    readonly [Symbol.toStringTag]?: "ArrayBuffer" | undefined;
                } | undefined;
                readonly byteLength?: number | undefined;
                readonly byteOffset?: number | undefined;
            } | {
                append?: {
                    (name: string, value: string | Blob): void;
                    (name: string, value: string): void;
                    (name: string, blobValue: Blob, filename?: string): void;
                } | undefined;
                delete?: ((name: string) => void) | undefined;
                get?: ((name: string) => FormDataEntryValue | null) | undefined;
                getAll?: ((name: string) => FormDataEntryValue[]) | undefined;
                has?: ((name: string) => boolean) | undefined;
                set?: {
                    (name: string, value: string | Blob): void;
                    (name: string, value: string): void;
                    (name: string, blobValue: Blob, filename?: string): void;
                } | undefined;
                forEach?: ((callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any) => void) | undefined;
            } | {
                readonly size?: number | undefined;
                append?: ((name: string, value: string) => void) | undefined;
                delete?: ((name: string, value?: string) => void) | undefined;
                get?: ((name: string) => string | null) | undefined;
                getAll?: ((name: string) => string[]) | undefined;
                has?: ((name: string, value?: string) => boolean) | undefined;
                set?: ((name: string, value: string) => void) | undefined;
                sort?: (() => void) | undefined;
                toString?: (() => string) | undefined;
                forEach?: ((callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any) => void) | undefined;
            } | null | undefined;
            extra?: {
                cache?: RequestCache | undefined;
                credentials?: RequestCredentials | undefined;
                integrity?: string | undefined;
                keepalive?: boolean | undefined;
                mode?: RequestMode | undefined;
                priority?: RequestPriority | undefined;
                redirect?: RequestRedirect | undefined;
                referrer?: string | undefined;
                referrerPolicy?: ReferrerPolicy | undefined;
                window?: null | undefined;
            } | undefined;
            settings?: {
                __brand?: VigorBrand<"Fetch", "Policy<Settings<Schema"> | undefined;
                retryHeaders?: readonly string[] | undefined;
                unretryStatus?: readonly number[] | undefined;
                maxRestarts?: number | undefined;
                default?: (symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                }) | ((ctx: any) => any | Promise<any>) | undefined;
            } | undefined;
            middlewares?: {
                __brand?: VigorBrand<"Fetch", "Policy<Middlewares<Schema"> | undefined;
                before?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorFetchPolicyMiddlewaresApi<any>, "throwError" | "setOptions" | "setHeaders" | "setBody">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>) | undefined;
                })[] | undefined;
                after?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((ctx: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorFetchPolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>) | undefined;
                })[] | undefined;
                onResult?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((res: any) => VigorFetchSchema<any>["context"]["result"]) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorFetchPolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>) | undefined;
                })[] | undefined;
                onError?: readonly ({
                    _mode?: "fluent" | undefined;
                    func?: ((err: any) => void) | undefined;
                } | {
                    _mode?: "intercept" | undefined;
                    func?: ((ctx: any, api: Pick<VigorFetchPolicyMiddlewaresApi<any>, "throwError" | "setResult" | "proceedRestart" | "cancelRestart">) => VigorFetchSchema<any>["context"] | Promise<VigorFetchSchema<any>["context"]>) | undefined;
                })[] | undefined;
            } | undefined;
            retry?: {
                __brand?: VigorBrand<"Retry", "Schema"> | undefined;
                policy?: {
                    __brand?: VigorBrand<"Retry", "Policy<Schema"> | undefined;
                    target?: (symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    }) | ((signal: AbortSignal) => any | Promise<any>) | undefined;
                    abortSignals?: readonly {
                        readonly aborted?: boolean | undefined;
                        onabort?: ((this: AbortSignal, ev: Event) => any) | null | undefined;
                        readonly reason?: any;
                        throwIfAborted?: (() => void) | undefined;
                        addEventListener?: {
                            <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                            (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                        } | undefined;
                        removeEventListener?: {
                            <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                            (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                        } | undefined;
                        dispatchEvent?: ((event: Event) => boolean) | undefined;
                    }[] | undefined;
                    settings?: {
                        __brand?: VigorBrand<"Retry", "Policy<Settings<Schema"> | undefined;
                        default?: (symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        }) | ((ctx: any) => any | Promise<any>) | undefined;
                        maxAttempts?: number | undefined;
                        maxRestarts?: number | undefined;
                        timeout?: number | undefined;
                    } | undefined;
                    middlewares?: {
                        __brand?: VigorBrand<"Retry", "Policy<Middlewares<Schema"> | undefined;
                        before?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((ctx: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "abort" | "throwError" | "breakRetry">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        after?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((ctx: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        onResult?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((res: any) => VigorRetrySchema<any>["context"]["result"]) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        retryIf?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((err: any) => VigorRetrySchema<any>["context"]["flags"]["doRetry"]) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "proceedRetry" | "cancelRetry">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        onRetry?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((err: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setDelay">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        onError?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((err: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorRetryPolicyMiddlewaresApi<any>, "throwError" | "setResult" | "proceedRestart" | "cancelRestart">) => VigorRetrySchema<any>["context"] | Promise<VigorRetrySchema<any>["context"]>) | undefined;
                        })[] | undefined;
                    } | undefined;
                    algorithms?: {
                        __brand?: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema"> | undefined;
                        _tag?: "constant" | undefined;
                        jitter?: number | undefined;
                        interval?: number | undefined;
                        _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
                    } | {
                        __brand?: VigorBrand<"Retry", "Policy<Algorithms<Linear<Schema"> | undefined;
                        _tag?: "linear" | undefined;
                        jitter?: number | undefined;
                        initial?: number | undefined;
                        increment?: number | undefined;
                        minDelay?: number | undefined;
                        maxDelay?: number | undefined;
                        _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsLinearSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
                    } | {
                        __brand?: VigorBrand<"Retry", "Policy<Algorithms<Backoff<Schema"> | undefined;
                        _tag?: "backoff" | undefined;
                        jitter?: number | undefined;
                        initial?: number | undefined;
                        multiplier?: number | undefined;
                        unit?: number | undefined;
                        minDelay?: number | undefined;
                        maxDelay?: number | undefined;
                        _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsBackoffSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
                    } | {
                        __brand?: VigorBrand<"Retry", "Policy<Algorithms<Custom<Schema"> | undefined;
                        _tag?: "custom" | undefined;
                        jitter?: number | undefined;
                        minDelay?: number | undefined;
                        maxDelay?: number | undefined;
                        target?: (symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        }) | ((att: number) => number) | undefined;
                        _calculateDelay?: (((att: number, config: VigorRetryPolicyAlgorithmsCustomSchema<any>) => number) & ((att: number, config: any) => number)) | undefined;
                    } | undefined;
                } | undefined;
                context?: {
                    __brand?: VigorBrand<"Retry", "Context<Schema"> | undefined;
                    result?: (symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    }) | undefined;
                    error?: unknown;
                    system?: {
                        delay?: number | (symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        }) | undefined;
                        attempt?: number | undefined;
                    } | undefined;
                    flags?: {
                        doRetry?: boolean | undefined;
                        doRestart?: boolean | undefined;
                        brokeRetry?: boolean | undefined;
                        overridden?: boolean | undefined;
                    } | undefined;
                    record?: {
                        [x: string]: any;
                    } | undefined;
                    policy?: any;
                } | undefined;
            } | undefined;
            parse?: {
                __brand?: VigorBrand<"Parse", "Schema"> | undefined;
                policy?: {
                    __brand?: VigorBrand<"Parse", "Policy<Schema"> | undefined;
                    target?: (symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    }) | {
                        readonly headers?: {
                            append?: ((name: string, value: string) => void) | undefined;
                            delete?: ((name: string) => void) | undefined;
                            get?: ((name: string) => string | null) | undefined;
                            getSetCookie?: (() => string[]) | undefined;
                            has?: ((name: string) => boolean) | undefined;
                            set?: ((name: string, value: string) => void) | undefined;
                            forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                        } | undefined;
                        readonly ok?: boolean | undefined;
                        readonly redirected?: boolean | undefined;
                        readonly status?: number | undefined;
                        readonly statusText?: string | undefined;
                        readonly type?: ResponseType | undefined;
                        readonly url?: string | undefined;
                        clone?: (() => Response) | undefined;
                        readonly body?: {
                            readonly locked?: boolean | undefined;
                            cancel?: ((reason?: any) => Promise<void>) | undefined;
                            getReader?: {
                                (options: {
                                    mode: "byob";
                                }): ReadableStreamBYOBReader;
                                (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                                (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                            } | undefined;
                            pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                            pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                            tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                        } | null | undefined;
                        readonly bodyUsed?: boolean | undefined;
                        arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                        blob?: (() => Promise<Blob>) | undefined;
                        bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                        formData?: (() => Promise<FormData>) | undefined;
                        json?: (() => Promise<any>) | undefined;
                        text?: (() => Promise<string>) | undefined;
                    } | undefined;
                    settings?: {
                        __brand?: VigorBrand<"Parse", "Policy<Settings<Schema"> | undefined;
                        raw?: boolean | undefined;
                        default?: (symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        }) | ((ctx: any) => any | Promise<any>) | undefined;
                        maxRestarts?: number | undefined;
                    } | undefined;
                    middlewares?: {
                        __brand?: VigorBrand<"Parse", "Policy<Middlewares<Schema"> | undefined;
                        before?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((ctx: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        after?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((ctx: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        onResult?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((res: any) => VigorParseSchema<any>["context"]["result"]) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                        })[] | undefined;
                        onError?: readonly ({
                            _mode?: "fluent" | undefined;
                            func?: ((err: any) => void) | undefined;
                        } | {
                            _mode?: "intercept" | undefined;
                            func?: ((ctx: any, api: Pick<VigorParsePolicyMiddlewaresApi<any>, "throwError" | "setResult" | "proceedRestart" | "cancelRestart">) => VigorParseSchema<any>["context"] | Promise<VigorParseSchema<any>["context"]>) | undefined;
                        })[] | undefined;
                    } | undefined;
                    strategies?: {
                        __brand?: VigorBrand<"Parse", "Policy<Strategies<Schema"> | undefined;
                        funcs?: readonly VigorParseStrategyFunc[] | undefined;
                    } | undefined;
                } | undefined;
                context?: {
                    __brand?: VigorBrand<"Parse", "Context<Schema"> | undefined;
                    result?: unknown | VigorDefaultType;
                    error?: unknown;
                    response?: (symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    }) | {
                        readonly headers?: {
                            append?: ((name: string, value: string) => void) | undefined;
                            delete?: ((name: string) => void) | undefined;
                            get?: ((name: string) => string | null) | undefined;
                            getSetCookie?: (() => string[]) | undefined;
                            has?: ((name: string) => boolean) | undefined;
                            set?: ((name: string, value: string) => void) | undefined;
                            forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                        } | undefined;
                        readonly ok?: boolean | undefined;
                        readonly redirected?: boolean | undefined;
                        readonly status?: number | undefined;
                        readonly statusText?: string | undefined;
                        readonly type?: ResponseType | undefined;
                        readonly url?: string | undefined;
                        clone?: (() => Response) | undefined;
                        readonly body?: {
                            readonly locked?: boolean | undefined;
                            cancel?: ((reason?: any) => Promise<void>) | undefined;
                            getReader?: {
                                (options: {
                                    mode: "byob";
                                }): ReadableStreamBYOBReader;
                                (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                                (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                            } | undefined;
                            pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                            pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                            tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                        } | null | undefined;
                        readonly bodyUsed?: boolean | undefined;
                        arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                        blob?: (() => Promise<Blob>) | undefined;
                        bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                        formData?: (() => Promise<FormData>) | undefined;
                        json?: (() => Promise<any>) | undefined;
                        text?: (() => Promise<string>) | undefined;
                    } | undefined;
                    flags?: {
                        overrided?: boolean | undefined;
                        restarted?: boolean | undefined;
                    } | undefined;
                    record?: {
                        [x: string]: any;
                    } | undefined;
                    policy?: any;
                } | undefined;
            } | undefined;
        } | undefined;
        context?: {
            __brand?: VigorBrand<"Fetch", "Context<Schema"> | undefined;
            href?: string | undefined;
            response?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | {
                readonly headers?: {
                    append?: ((name: string, value: string) => void) | undefined;
                    delete?: ((name: string) => void) | undefined;
                    get?: ((name: string) => string | null) | undefined;
                    getSetCookie?: (() => string[]) | undefined;
                    has?: ((name: string) => boolean) | undefined;
                    set?: ((name: string, value: string) => void) | undefined;
                    forEach?: ((callbackfn: (value: string, key: string, parent: Headers) => void, thisArg?: any) => void) | undefined;
                } | undefined;
                readonly ok?: boolean | undefined;
                readonly redirected?: boolean | undefined;
                readonly status?: number | undefined;
                readonly statusText?: string | undefined;
                readonly type?: ResponseType | undefined;
                readonly url?: string | undefined;
                clone?: (() => Response) | undefined;
                readonly body?: {
                    readonly locked?: boolean | undefined;
                    cancel?: ((reason?: any) => Promise<void>) | undefined;
                    getReader?: {
                        (options: {
                            mode: "byob";
                        }): ReadableStreamBYOBReader;
                        (): ReadableStreamDefaultReader<Uint8Array<ArrayBuffer>>;
                        (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<Uint8Array<ArrayBuffer>>;
                    } | undefined;
                    pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                    pipeTo?: ((destination: WritableStream<Uint8Array<ArrayBuffer>>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                    tee?: (() => [ReadableStream<Uint8Array<ArrayBuffer>>, ReadableStream<Uint8Array<ArrayBuffer>>]) | undefined;
                } | null | undefined;
                readonly bodyUsed?: boolean | undefined;
                arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                blob?: (() => Promise<Blob>) | undefined;
                bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                formData?: (() => Promise<FormData>) | undefined;
                json?: (() => Promise<any>) | undefined;
                text?: (() => Promise<string>) | undefined;
            } | undefined;
            result?: unknown | VigorDefaultType;
            error?: unknown;
            options?: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | {
                cache?: RequestCache | undefined;
                credentials?: RequestCredentials | undefined;
                integrity?: string | undefined;
                keepalive?: boolean | undefined;
                mode?: RequestMode | undefined;
                priority?: RequestPriority | undefined;
                redirect?: RequestRedirect | undefined;
                referrer?: string | undefined;
                referrerPolicy?: ReferrerPolicy | undefined;
                window?: null | undefined;
                method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE" | undefined;
                headers?: {
                    [x: string]: string | undefined;
                } | undefined;
                body?: string | {
                    readonly locked?: boolean | undefined;
                    cancel?: ((reason?: any) => Promise<void>) | undefined;
                    getReader?: {
                        (options: {
                            mode: "byob";
                        }): ReadableStreamBYOBReader;
                        (): ReadableStreamDefaultReader<any>;
                        (options?: ReadableStreamGetReaderOptions): ReadableStreamReader<any>;
                    } | undefined;
                    pipeThrough?: (<T_1>(transform: ReadableWritablePair<T_1, any>, options?: StreamPipeOptions) => ReadableStream<T_1>) | undefined;
                    pipeTo?: ((destination: WritableStream<any>, options?: StreamPipeOptions) => Promise<void>) | undefined;
                    tee?: (() => [ReadableStream<any>, ReadableStream<any>]) | undefined;
                } | {
                    readonly size?: number | undefined;
                    readonly type?: string | undefined;
                    arrayBuffer?: (() => Promise<ArrayBuffer>) | undefined;
                    bytes?: (() => Promise<Uint8Array<ArrayBuffer>>) | undefined;
                    slice?: ((start?: number, end?: number, contentType?: string) => Blob) | undefined;
                    stream?: (() => ReadableStream<Uint8Array<ArrayBuffer>>) | undefined;
                    text?: (() => Promise<string>) | undefined;
                } | {
                    readonly byteLength?: number | undefined;
                    slice?: ((begin?: number, end?: number) => ArrayBuffer) | undefined;
                    readonly maxByteLength?: number | undefined;
                    readonly resizable?: boolean | undefined;
                    resize?: ((newByteLength?: number) => void) | undefined;
                    readonly detached?: boolean | undefined;
                    transfer?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                    transferToFixedLength?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                    readonly [Symbol.toStringTag]?: "ArrayBuffer" | undefined;
                } | {
                    readonly buffer?: {
                        readonly byteLength?: number | undefined;
                        slice?: ((begin?: number, end?: number) => ArrayBuffer) | undefined;
                        readonly maxByteLength?: number | undefined;
                        readonly resizable?: boolean | undefined;
                        resize?: ((newByteLength?: number) => void) | undefined;
                        readonly detached?: boolean | undefined;
                        transfer?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                        transferToFixedLength?: ((newByteLength?: number) => ArrayBuffer) | undefined;
                        readonly [Symbol.toStringTag]?: "ArrayBuffer" | undefined;
                    } | undefined;
                    readonly byteLength?: number | undefined;
                    readonly byteOffset?: number | undefined;
                } | {
                    append?: {
                        (name: string, value: string | Blob): void;
                        (name: string, value: string): void;
                        (name: string, blobValue: Blob, filename?: string): void;
                    } | undefined;
                    delete?: ((name: string) => void) | undefined;
                    get?: ((name: string) => FormDataEntryValue | null) | undefined;
                    getAll?: ((name: string) => FormDataEntryValue[]) | undefined;
                    has?: ((name: string) => boolean) | undefined;
                    set?: {
                        (name: string, value: string | Blob): void;
                        (name: string, value: string): void;
                        (name: string, blobValue: Blob, filename?: string): void;
                    } | undefined;
                    forEach?: ((callbackfn: (value: FormDataEntryValue, key: string, parent: FormData) => void, thisArg?: any) => void) | undefined;
                } | {
                    readonly size?: number | undefined;
                    append?: ((name: string, value: string) => void) | undefined;
                    delete?: ((name: string, value?: string) => void) | undefined;
                    get?: ((name: string) => string | null) | undefined;
                    getAll?: ((name: string) => string[]) | undefined;
                    has?: ((name: string, value?: string) => boolean) | undefined;
                    set?: ((name: string, value: string) => void) | undefined;
                    sort?: (() => void) | undefined;
                    toString?: (() => string) | undefined;
                    forEach?: ((callbackfn: (value: string, key: string, parent: URLSearchParams) => void, thisArg?: any) => void) | undefined;
                } | null | undefined;
                signal?: {
                    readonly aborted?: boolean | undefined;
                    onabort?: ((this: AbortSignal, ev: Event) => any) | null | undefined;
                    readonly reason?: any;
                    throwIfAborted?: (() => void) | undefined;
                    addEventListener?: {
                        <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
                    } | undefined;
                    removeEventListener?: {
                        <K extends keyof AbortSignalEventMap>(type: K, listener: (this: AbortSignal, ev: AbortSignalEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
                        (type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
                    } | undefined;
                    dispatchEvent?: ((event: Event) => boolean) | undefined;
                } | undefined;
            } | undefined;
            flags?: {
                overrided?: boolean | undefined;
                restarted?: boolean | undefined;
            } | undefined;
            record?: {
                [x: string]: any;
            } | undefined;
            policy?: any;
        } | undefined;
    }>>>;
    /** Configures the retry engine used to send the underlying request. */
    retry<const N extends VigorDeepPartial<VigorRetrySchema<any>>, R extends VigorRetrySchema<any>>(input: N | ((r: VigorRetry) => VigorRetry<R>) | VigorRetry<R>): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly retry: R;
        };
    }>>>;
    /** Configures the parse engine used to interpret the response. */
    parse<const N extends VigorDeepPartial<VigorParseSchema<any>>, R extends VigorParseSchema<any>>(input: N | ((p: VigorParse) => VigorParse<R>) | VigorParse<R>): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly parse: R;
        };
    }>>>;
    /** Converts a list of stringable values into strings, dropping `null`/`undefined` entries. */
    protected _stringifyList(unkList: VigorStringable[]): string[];
    /**
     * Resolves the base URL used to interpret a relative `origin`. In a
     * browser environment this is the current page location; in
     * environments without `location` (e.g. Node), no base is available and
     * `origin` must be an absolute URL.
     */
    protected _resolveBase(): string | undefined;
    /**
     * Builds the final request URL from the configured origin, path
     * segments, query parameters, and hash. An absolute `origin` ignores
     * the resolved base (per the `URL` spec); a relative `origin` is
     * resolved against it. Throws `INVALID_PROTOCOL` if neither is possible.
     */
    protected _buildUrl(origin: string, path: string[], query: VigorFetchPolicySchema<any>["query"], hash: string): string;
    /** Infers the `Content-Type` header and serializes `body` into a `BodyInit`. */
    protected _normalizeBody(body: unknown): {
        headers: Record<string, string>;
        body: BodyInit | null | undefined;
    };
    /** Runs the request and returns its parsed result directly, throwing on final failure. */
    request<R = T["context"]["result"]>(): Promise<R>;
    /** Runs the request and returns a result/error envelope instead of throwing. */
    requestVerbose<R = T["context"]["result"]>(): Promise<{
        success: false;
        data: null;
        error: unknown;
    } | {
        success: true;
        data: R;
        error: null;
    }>;
    /** Internal execution loop implementing URL building, retry, parsing, and restart handling. */
    private requestRuntime;
}

type VigorPlugin<O extends {
    [str: string]: any;
}> = {
    options: O;
    func: (v: typeof vigor, options: O) => void;
};
declare const vigor: {
    readonly use: <P extends VigorPlugin<any>>(plugin: P, options?: P["options"]) => void;
    readonly retry: (task?: Parameters<VigorRetry["target"]>[0]) => VigorRetry<{
        readonly __brand: VigorBrand<"Retry", "Schema">;
        readonly policy: {
            readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
            readonly target: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly abortSignals: [];
            readonly settings: {
                readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                readonly default: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly maxAttempts: 5;
                readonly maxRestarts: 3;
                readonly timeout: 20000;
            };
            readonly middlewares: {
                readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                readonly before: [];
                readonly after: [];
                readonly onResult: [];
                readonly retryIf: [];
                readonly onRetry: [];
                readonly onError: [];
            };
            readonly algorithms: {
                readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                readonly _tag: "constant";
                readonly jitter: 1000;
                readonly interval: 2000;
                readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
            };
        };
        readonly context: {
            readonly __brand: VigorBrand<"Retry", "Context<Schema">;
            readonly result: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly error: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly system: {
                readonly delay: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly attempt: 0;
            };
            readonly flags: {
                readonly doRetry: true;
                readonly doRestart: false;
                readonly brokeRetry: false;
                readonly overridden: false;
            };
            readonly record: {};
            readonly policy: {
                readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                readonly target: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly abortSignals: [];
                readonly settings: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                    readonly default: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly maxAttempts: 5;
                    readonly maxRestarts: 3;
                    readonly timeout: 20000;
                };
                readonly middlewares: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                    readonly before: [];
                    readonly after: [];
                    readonly onResult: [];
                    readonly retryIf: [];
                    readonly onRetry: [];
                    readonly onError: [];
                };
                readonly algorithms: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                    readonly _tag: "constant";
                    readonly jitter: 1000;
                    readonly interval: 2000;
                    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                };
            };
        };
    }> | VigorRetry<{
        context: {
            readonly __brand: VigorBrand<"Retry", "Context<Schema">;
            readonly result: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly error: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly system: {
                readonly delay: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly attempt: 0;
            };
            readonly flags: {
                readonly doRetry: true;
                readonly doRestart: false;
                readonly brokeRetry: false;
                readonly overridden: false;
            };
            readonly record: {};
            readonly policy: {
                readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                readonly target: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly abortSignals: [];
                readonly settings: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                    readonly default: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly maxAttempts: 5;
                    readonly maxRestarts: 3;
                    readonly timeout: 20000;
                };
                readonly middlewares: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                    readonly before: [];
                    readonly after: [];
                    readonly onResult: [];
                    readonly retryIf: [];
                    readonly onRetry: [];
                    readonly onError: [];
                };
                readonly algorithms: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                    readonly _tag: "constant";
                    readonly jitter: 1000;
                    readonly interval: 2000;
                    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                };
            };
        };
        policy: {
            target: (signal: AbortSignal) => any | Promise<any>;
            middlewares: {
                readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                readonly before: [];
                readonly after: [];
                readonly onResult: [];
                readonly retryIf: [];
                readonly onRetry: [];
                readonly onError: [];
            };
            __brand: VigorBrand<"Retry", "Policy<Schema">;
            abortSignals: [];
            settings: {
                readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                readonly default: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly maxAttempts: 5;
                readonly maxRestarts: 3;
                readonly timeout: 20000;
            };
            algorithms: {
                readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                readonly _tag: "constant";
                readonly jitter: 1000;
                readonly interval: 2000;
                readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
            };
        };
        __brand: VigorBrand<"Retry", "Schema">;
    }>;
    readonly parse: (response?: Parameters<VigorParse["target"]>[0]) => VigorParse<{
        readonly __brand: VigorBrand<"Parse", "Schema">;
        readonly policy: {
            readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
            readonly target: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly settings: {
                readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                readonly raw: false;
                readonly default: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly maxRestarts: 3;
            };
            readonly middlewares: {
                readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                readonly before: [];
                readonly after: [];
                readonly onResult: [];
                readonly onError: [];
            };
            readonly strategies: {
                readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
        readonly context: {
            readonly __brand: VigorBrand<"Parse", "Context<Schema">;
            readonly result: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly error: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly response: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly flags: {
                readonly overrided: false;
                readonly restarted: false;
            };
            readonly record: {};
            readonly policy: {
                readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                readonly target: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly settings: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                    readonly raw: false;
                    readonly default: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly maxRestarts: 3;
                };
                readonly middlewares: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                    readonly before: [];
                    readonly after: [];
                    readonly onResult: [];
                    readonly onError: [];
                };
                readonly strategies: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                    readonly funcs: VigorParseStrategyFunc[];
                };
            };
        };
    }> | VigorParse<{
        context: {
            readonly __brand: VigorBrand<"Parse", "Context<Schema">;
            readonly result: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly error: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly response: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly flags: {
                readonly overrided: false;
                readonly restarted: false;
            };
            readonly record: {};
            readonly policy: {
                readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                readonly target: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Default">;
                };
                readonly settings: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                    readonly raw: false;
                    readonly default: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly maxRestarts: 3;
                };
                readonly middlewares: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                    readonly before: [];
                    readonly after: [];
                    readonly onResult: [];
                    readonly onError: [];
                };
                readonly strategies: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                    readonly funcs: VigorParseStrategyFunc[];
                };
            };
        };
        policy: {
            target: (symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            }) | Response;
            middlewares: {
                readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                readonly before: [];
                readonly after: [];
                readonly onResult: [];
                readonly onError: [];
            };
            __brand: VigorBrand<"Parse", "Policy<Schema">;
            settings: {
                readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                readonly raw: false;
                readonly default: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly maxRestarts: 3;
            };
            strategies: {
                readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                readonly funcs: VigorParseStrategyFunc[];
            };
        };
        __brand: VigorBrand<"Parse", "Schema">;
    }>;
    readonly fetch: (origin?: Parameters<VigorFetch["origin"]>[0]) => VigorFetch<{
        readonly __brand: VigorBrand<"Fetch", "Schema">;
        readonly policy: {
            readonly __brand: VigorBrand<"Fetch", "Policy<Schema">;
            readonly method: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly origin: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly path: [];
            readonly query: [];
            readonly hash: "";
            readonly headers: {};
            readonly body: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly extra: {};
            readonly settings: {
                readonly __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
                readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"];
                readonly unretryStatus: [400, 401, 403, 404, 405, 413, 422];
                readonly maxRestarts: 3;
                readonly default: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            };
            readonly middlewares: {
                readonly __brand: VigorBrand<"Fetch", "Policy<Middlewares<Schema">;
                readonly before: [];
                readonly after: [];
                readonly onResult: [];
                readonly onError: [];
            };
            readonly retry: {
                readonly __brand: VigorBrand<"Retry", "Schema">;
                readonly policy: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                    readonly target: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly abortSignals: [];
                    readonly settings: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                        readonly default: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly maxAttempts: 5;
                        readonly maxRestarts: 3;
                        readonly timeout: 20000;
                    };
                    readonly middlewares: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                        readonly before: [];
                        readonly after: [];
                        readonly onResult: [];
                        readonly retryIf: [];
                        readonly onRetry: [];
                        readonly onError: [];
                    };
                    readonly algorithms: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                        readonly _tag: "constant";
                        readonly jitter: 1000;
                        readonly interval: 2000;
                        readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                    };
                };
                readonly context: {
                    readonly __brand: VigorBrand<"Retry", "Context<Schema">;
                    readonly result: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly error: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly system: {
                        readonly delay: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly attempt: 0;
                    };
                    readonly flags: {
                        readonly doRetry: true;
                        readonly doRestart: false;
                        readonly brokeRetry: false;
                        readonly overridden: false;
                    };
                    readonly record: {};
                    readonly policy: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                        readonly target: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly abortSignals: [];
                        readonly settings: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                            readonly default: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly maxAttempts: 5;
                            readonly maxRestarts: 3;
                            readonly timeout: 20000;
                        };
                        readonly middlewares: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                            readonly before: [];
                            readonly after: [];
                            readonly onResult: [];
                            readonly retryIf: [];
                            readonly onRetry: [];
                            readonly onError: [];
                        };
                        readonly algorithms: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                            readonly _tag: "constant";
                            readonly jitter: 1000;
                            readonly interval: 2000;
                            readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                        };
                    };
                };
            };
            readonly parse: {
                readonly __brand: VigorBrand<"Parse", "Schema">;
                readonly policy: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                    readonly target: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly settings: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                        readonly raw: false;
                        readonly default: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly maxRestarts: 3;
                    };
                    readonly middlewares: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                        readonly before: [];
                        readonly after: [];
                        readonly onResult: [];
                        readonly onError: [];
                    };
                    readonly strategies: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                        readonly funcs: VigorParseStrategyFunc[];
                    };
                };
                readonly context: {
                    readonly __brand: VigorBrand<"Parse", "Context<Schema">;
                    readonly result: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly error: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly response: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly flags: {
                        readonly overrided: false;
                        readonly restarted: false;
                    };
                    readonly record: {};
                    readonly policy: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                        readonly target: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly settings: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                            readonly raw: false;
                            readonly default: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly maxRestarts: 3;
                        };
                        readonly middlewares: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                            readonly before: [];
                            readonly after: [];
                            readonly onResult: [];
                            readonly onError: [];
                        };
                        readonly strategies: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                            readonly funcs: VigorParseStrategyFunc[];
                        };
                    };
                };
            };
        };
        readonly context: {
            readonly __brand: VigorBrand<"Fetch", "Context<Schema">;
            readonly href: "";
            readonly response: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly result: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly error: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly options: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly flags: {
                readonly overrided: false;
                readonly restarted: false;
            };
            readonly record: {};
            readonly policy: {
                readonly __brand: VigorBrand<"Fetch", "Policy<Schema">;
                readonly method: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly origin: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly path: [];
                readonly query: [];
                readonly hash: "";
                readonly headers: {};
                readonly body: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly extra: {};
                readonly settings: {
                    readonly __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
                    readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"];
                    readonly unretryStatus: [400, 401, 403, 404, 405, 413, 422];
                    readonly maxRestarts: 3;
                    readonly default: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                };
                readonly middlewares: {
                    readonly __brand: VigorBrand<"Fetch", "Policy<Middlewares<Schema">;
                    readonly before: [];
                    readonly after: [];
                    readonly onResult: [];
                    readonly onError: [];
                };
                readonly retry: {
                    readonly __brand: VigorBrand<"Retry", "Schema">;
                    readonly policy: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                        readonly target: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly abortSignals: [];
                        readonly settings: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                            readonly default: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly maxAttempts: 5;
                            readonly maxRestarts: 3;
                            readonly timeout: 20000;
                        };
                        readonly middlewares: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                            readonly before: [];
                            readonly after: [];
                            readonly onResult: [];
                            readonly retryIf: [];
                            readonly onRetry: [];
                            readonly onError: [];
                        };
                        readonly algorithms: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                            readonly _tag: "constant";
                            readonly jitter: 1000;
                            readonly interval: 2000;
                            readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                        };
                    };
                    readonly context: {
                        readonly __brand: VigorBrand<"Retry", "Context<Schema">;
                        readonly result: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly error: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly system: {
                            readonly delay: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Default">;
                            };
                            readonly attempt: 0;
                        };
                        readonly flags: {
                            readonly doRetry: true;
                            readonly doRestart: false;
                            readonly brokeRetry: false;
                            readonly overridden: false;
                        };
                        readonly record: {};
                        readonly policy: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                            readonly target: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly abortSignals: [];
                            readonly settings: {
                                readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                                readonly default: symbol & {
                                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                                };
                                readonly maxAttempts: 5;
                                readonly maxRestarts: 3;
                                readonly timeout: 20000;
                            };
                            readonly middlewares: {
                                readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                                readonly before: [];
                                readonly after: [];
                                readonly onResult: [];
                                readonly retryIf: [];
                                readonly onRetry: [];
                                readonly onError: [];
                            };
                            readonly algorithms: {
                                readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                                readonly _tag: "constant";
                                readonly jitter: 1000;
                                readonly interval: 2000;
                                readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                            };
                        };
                    };
                };
                readonly parse: {
                    readonly __brand: VigorBrand<"Parse", "Schema">;
                    readonly policy: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                        readonly target: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly settings: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                            readonly raw: false;
                            readonly default: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly maxRestarts: 3;
                        };
                        readonly middlewares: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                            readonly before: [];
                            readonly after: [];
                            readonly onResult: [];
                            readonly onError: [];
                        };
                        readonly strategies: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                            readonly funcs: VigorParseStrategyFunc[];
                        };
                    };
                    readonly context: {
                        readonly __brand: VigorBrand<"Parse", "Context<Schema">;
                        readonly result: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly error: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly response: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly flags: {
                            readonly overrided: false;
                            readonly restarted: false;
                        };
                        readonly record: {};
                        readonly policy: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                            readonly target: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Default">;
                            };
                            readonly settings: {
                                readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                                readonly raw: false;
                                readonly default: symbol & {
                                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                                };
                                readonly maxRestarts: 3;
                            };
                            readonly middlewares: {
                                readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                                readonly before: [];
                                readonly after: [];
                                readonly onResult: [];
                                readonly onError: [];
                            };
                            readonly strategies: {
                                readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                                readonly funcs: VigorParseStrategyFunc[];
                            };
                        };
                    };
                };
            };
        };
    }> | VigorFetch<{
        context: {
            readonly __brand: VigorBrand<"Fetch", "Context<Schema">;
            readonly href: "";
            readonly response: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly result: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly error: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly options: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly flags: {
                readonly overrided: false;
                readonly restarted: false;
            };
            readonly record: {};
            readonly policy: {
                readonly __brand: VigorBrand<"Fetch", "Policy<Schema">;
                readonly method: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly origin: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly path: [];
                readonly query: [];
                readonly hash: "";
                readonly headers: {};
                readonly body: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
                readonly extra: {};
                readonly settings: {
                    readonly __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
                    readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"];
                    readonly unretryStatus: [400, 401, 403, 404, 405, 413, 422];
                    readonly maxRestarts: 3;
                    readonly default: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                };
                readonly middlewares: {
                    readonly __brand: VigorBrand<"Fetch", "Policy<Middlewares<Schema">;
                    readonly before: [];
                    readonly after: [];
                    readonly onResult: [];
                    readonly onError: [];
                };
                readonly retry: {
                    readonly __brand: VigorBrand<"Retry", "Schema">;
                    readonly policy: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                        readonly target: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly abortSignals: [];
                        readonly settings: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                            readonly default: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly maxAttempts: 5;
                            readonly maxRestarts: 3;
                            readonly timeout: 20000;
                        };
                        readonly middlewares: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                            readonly before: [];
                            readonly after: [];
                            readonly onResult: [];
                            readonly retryIf: [];
                            readonly onRetry: [];
                            readonly onError: [];
                        };
                        readonly algorithms: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                            readonly _tag: "constant";
                            readonly jitter: 1000;
                            readonly interval: 2000;
                            readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                        };
                    };
                    readonly context: {
                        readonly __brand: VigorBrand<"Retry", "Context<Schema">;
                        readonly result: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly error: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly system: {
                            readonly delay: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Default">;
                            };
                            readonly attempt: 0;
                        };
                        readonly flags: {
                            readonly doRetry: true;
                            readonly doRestart: false;
                            readonly brokeRetry: false;
                            readonly overridden: false;
                        };
                        readonly record: {};
                        readonly policy: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                            readonly target: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly abortSignals: [];
                            readonly settings: {
                                readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                                readonly default: symbol & {
                                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                                };
                                readonly maxAttempts: 5;
                                readonly maxRestarts: 3;
                                readonly timeout: 20000;
                            };
                            readonly middlewares: {
                                readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                                readonly before: [];
                                readonly after: [];
                                readonly onResult: [];
                                readonly retryIf: [];
                                readonly onRetry: [];
                                readonly onError: [];
                            };
                            readonly algorithms: {
                                readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                                readonly _tag: "constant";
                                readonly jitter: 1000;
                                readonly interval: 2000;
                                readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                            };
                        };
                    };
                };
                readonly parse: {
                    readonly __brand: VigorBrand<"Parse", "Schema">;
                    readonly policy: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                        readonly target: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly settings: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                            readonly raw: false;
                            readonly default: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly maxRestarts: 3;
                        };
                        readonly middlewares: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                            readonly before: [];
                            readonly after: [];
                            readonly onResult: [];
                            readonly onError: [];
                        };
                        readonly strategies: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                            readonly funcs: VigorParseStrategyFunc[];
                        };
                    };
                    readonly context: {
                        readonly __brand: VigorBrand<"Parse", "Context<Schema">;
                        readonly result: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly error: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly response: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly flags: {
                            readonly overrided: false;
                            readonly restarted: false;
                        };
                        readonly record: {};
                        readonly policy: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                            readonly target: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Default">;
                            };
                            readonly settings: {
                                readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                                readonly raw: false;
                                readonly default: symbol & {
                                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                                };
                                readonly maxRestarts: 3;
                            };
                            readonly middlewares: {
                                readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                                readonly before: [];
                                readonly after: [];
                                readonly onResult: [];
                                readonly onError: [];
                            };
                            readonly strategies: {
                                readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                                readonly funcs: VigorParseStrategyFunc[];
                            };
                        };
                    };
                };
            };
        };
        policy: {
            middlewares: {
                readonly __brand: VigorBrand<"Fetch", "Policy<Middlewares<Schema">;
                readonly before: [];
                readonly after: [];
                readonly onResult: [];
                readonly onError: [];
            };
            __brand: VigorBrand<"Fetch", "Policy<Schema">;
            settings: {
                readonly __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
                readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"];
                readonly unretryStatus: [400, 401, 403, 404, 405, 413, 422];
                readonly maxRestarts: 3;
                readonly default: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            };
            headers: {};
            body: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            method: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            origin: string;
            path: [];
            query: [];
            hash: "";
            extra: {};
            retry: {
                readonly __brand: VigorBrand<"Retry", "Schema">;
                readonly policy: {
                    readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                    readonly target: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly abortSignals: [];
                    readonly settings: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                        readonly default: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly maxAttempts: 5;
                        readonly maxRestarts: 3;
                        readonly timeout: 20000;
                    };
                    readonly middlewares: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                        readonly before: [];
                        readonly after: [];
                        readonly onResult: [];
                        readonly retryIf: [];
                        readonly onRetry: [];
                        readonly onError: [];
                    };
                    readonly algorithms: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                        readonly _tag: "constant";
                        readonly jitter: 1000;
                        readonly interval: 2000;
                        readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                    };
                };
                readonly context: {
                    readonly __brand: VigorBrand<"Retry", "Context<Schema">;
                    readonly result: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly error: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly system: {
                        readonly delay: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly attempt: 0;
                    };
                    readonly flags: {
                        readonly doRetry: true;
                        readonly doRestart: false;
                        readonly brokeRetry: false;
                        readonly overridden: false;
                    };
                    readonly record: {};
                    readonly policy: {
                        readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
                        readonly target: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly abortSignals: [];
                        readonly settings: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
                            readonly default: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly maxAttempts: 5;
                            readonly maxRestarts: 3;
                            readonly timeout: 20000;
                        };
                        readonly middlewares: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
                            readonly before: [];
                            readonly after: [];
                            readonly onResult: [];
                            readonly retryIf: [];
                            readonly onRetry: [];
                            readonly onError: [];
                        };
                        readonly algorithms: {
                            readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                            readonly _tag: "constant";
                            readonly jitter: 1000;
                            readonly interval: 2000;
                            readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                        };
                    };
                };
            };
            parse: {
                readonly __brand: VigorBrand<"Parse", "Schema">;
                readonly policy: {
                    readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                    readonly target: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly settings: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                        readonly raw: false;
                        readonly default: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly maxRestarts: 3;
                    };
                    readonly middlewares: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                        readonly before: [];
                        readonly after: [];
                        readonly onResult: [];
                        readonly onError: [];
                    };
                    readonly strategies: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                        readonly funcs: VigorParseStrategyFunc[];
                    };
                };
                readonly context: {
                    readonly __brand: VigorBrand<"Parse", "Context<Schema">;
                    readonly result: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly error: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly response: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Default">;
                    };
                    readonly flags: {
                        readonly overrided: false;
                        readonly restarted: false;
                    };
                    readonly record: {};
                    readonly policy: {
                        readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
                        readonly target: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Default">;
                        };
                        readonly settings: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
                            readonly raw: false;
                            readonly default: symbol & {
                                __brand: VigorBrand<"Core", "Symbol_Empty">;
                            };
                            readonly maxRestarts: 3;
                        };
                        readonly middlewares: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
                            readonly before: [];
                            readonly after: [];
                            readonly onResult: [];
                            readonly onError: [];
                        };
                        readonly strategies: {
                            readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
                            readonly funcs: VigorParseStrategyFunc[];
                        };
                    };
                };
            };
        };
        __brand: VigorBrand<"Fetch", "Schema">;
    }>;
    readonly all: (...tasks: Parameters<VigorAll["target"]>[0][]) => VigorAll<{
        readonly __brand: VigorBrand<"All", "Schema">;
        readonly policy: {
            readonly __brand: VigorBrand<"All", "Policy<Schema">;
            readonly target: VigorAllTask[];
            readonly settings: {
                readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
                readonly concurrency: 5;
                readonly onlySuccess: false;
            };
            readonly middlewares: {
                readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
                readonly before: VigorAllEachMiddlewareFn[];
                readonly after: VigorAllEachMiddlewareFn[];
                readonly onError: VigorAllEachOnErrorFn[];
            };
        };
        readonly context: {
            readonly __brand: VigorBrand<"All", "Context<Schema">;
            readonly result: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Default">;
            };
            readonly policy: {
                readonly __brand: VigorBrand<"All", "Policy<Schema">;
                readonly target: VigorAllTask[];
                readonly settings: {
                    readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
                    readonly concurrency: 5;
                    readonly onlySuccess: false;
                };
                readonly middlewares: {
                    readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
                    readonly before: VigorAllEachMiddlewareFn[];
                    readonly after: VigorAllEachMiddlewareFn[];
                    readonly onError: VigorAllEachOnErrorFn[];
                };
            };
            readonly record: {};
        };
    }>;
};

type VigorErrorOptions<D, T> = {
    cause?: unknown;
    data: D;
    method: string;
    context?: T;
};
/**
 * Base class for all Vigor error types. Subclasses (`VigorRetryError`,
 * `VigorFetchError`, `VigorParseError`, `VigorAllError`) fix `C`, `D`, and
 * `T` to their own error-code union, data shape, and context shape.
 *
 * @typeParam C - Union of error codes for the subclass.
 * @typeParam D - Shape of the structured error data.
 * @typeParam T - Shape of the domain context.
 */
declare abstract class VigorError<C extends string, D, T> extends Error {
    readonly timestamp: Date;
    readonly cause?: unknown;
    readonly code: C;
    readonly data: D;
    readonly method: string;
    readonly context: T | undefined;
    /**
     * @param code - Machine-readable error code.
     * @param message - Human-readable message (rendered after the `[code]` prefix).
     * @param options - Additional error metadata (cause, data, method, context).
     */
    constructor(code: C, message: string, options: VigorErrorOptions<D, T>);
}

declare const VigorRetryErrorMessageFuncs: {
    readonly VALUE_REQUIRED: ({ key }: {
        key: string;
    }) => string;
    readonly RETRY_EXHAUSTED: ({ maxAttempts }: {
        maxAttempts: number;
    }) => string;
    readonly RESTART_EXHAUSTED: ({ maxAttempts }: {
        maxAttempts: number;
    }) => string;
    readonly TIMED_OUT: ({ limit }: {
        limit: number;
    }) => string;
};
type VigorRetryErrorCodes = keyof typeof VigorRetryErrorMessageFuncs;
type VigorRetryErrorDatas<C extends VigorRetryErrorCodes> = Parameters<typeof VigorRetryErrorMessageFuncs[C]> extends [infer A] ? A : undefined;
/** Error type thrown by the retry module. */
declare class VigorRetryError<C extends VigorRetryErrorCodes, T extends VigorRetrySchema<T>> extends VigorError<C, VigorRetryErrorDatas<C>, T["context"]> {
    /**
     * @param code - One of the retry module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorRetryErrorDatas<C>, T["context"]>);
}

declare const VigorParseErrorMessageFuncs: {
    readonly VALUE_REQUIRED: ({ key }: {
        key: string;
    }) => string;
    readonly INVALID_CONTENT_TYPE: ({ received }: {
        received: unknown;
    }) => string;
    readonly PARSER_NOT_FOUND: ({ received, expected }: {
        received: unknown;
        expected: Array<string>;
    }) => string;
    readonly PARSER_ALL_FAILED: ({ tried }: {
        tried: Array<string>;
    }) => string;
    readonly RESTART_EXHAUSTED: ({ maxAttempts }: {
        maxAttempts: number;
    }) => string;
};
type VigorParseErrorCodes = keyof typeof VigorParseErrorMessageFuncs;
type VigorParseErrorDatas<C extends VigorParseErrorCodes> = Parameters<typeof VigorParseErrorMessageFuncs[C]> extends [infer A] ? A : undefined;
/** Error type thrown by the parse module. */
declare class VigorParseError<C extends VigorParseErrorCodes, T extends VigorParseSchema<T>> extends VigorError<C, VigorParseErrorDatas<C>, T["context"]> {
    /**
     * @param code - One of the parse module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorParseErrorDatas<C>, T["context"]>);
}

declare const VigorFetchErrorMessageFuncs: {
    readonly VALUE_REQUIRED: ({ key }: {
        key: string;
    }) => string;
    readonly INVALID_BODY: ({ received }: {
        received: unknown;
    }) => string;
    readonly INVALID_PROTOCOL: ({ origin, base }: {
        origin: string;
        base: string | undefined;
    }) => string;
    readonly FETCH_FAILED: ({ status, statusText }: {
        status: number;
        statusText: string;
        response: Response;
        url: string;
        parsed: unknown;
    }) => string;
    readonly RESTART_EXHAUSTED: ({ maxAttempts }: {
        maxAttempts: number;
    }) => string;
};
type VigorFetchErrorCodes = keyof typeof VigorFetchErrorMessageFuncs;
type VigorFetchErrorDatas<C extends VigorFetchErrorCodes> = Parameters<typeof VigorFetchErrorMessageFuncs[C]> extends [infer A] ? A : undefined;
/** Error type thrown by the fetch module. */
declare class VigorFetchError<C extends VigorFetchErrorCodes, T extends VigorFetchSchema<T>> extends VigorError<C, VigorFetchErrorDatas<C>, T["context"]> {
    /**
     * @param code - One of the fetch module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorFetchErrorDatas<C>, T["context"]>);
}

declare const VigorAllErrorMessageFuncs: {
    readonly EMPTY_TARGET: (_: {}) => string;
};
type VigorAllErrorCodes = keyof typeof VigorAllErrorMessageFuncs;
type VigorAllErrorDatas<C extends VigorAllErrorCodes> = Parameters<typeof VigorAllErrorMessageFuncs[C]> extends [infer A] ? A : undefined;
/** Error type thrown by the all module. */
declare class VigorAllError<C extends VigorAllErrorCodes, T extends VigorAllSchema<T>> extends VigorError<C, VigorAllErrorDatas<C>, T["context"]> {
    /**
     * @param code - One of the all module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorAllErrorDatas<C>, T["context"]>);
}

export { VigorAll, VigorAllBase, VigorAllError, VigorAllErrorMessageFuncs, VigorAllPolicyBase, VigorAllPolicyMiddlewares, VigorAllPolicyMiddlewaresBase, VigorAllPolicySettings, VigorAllPolicySettingsBase, VigorError, VigorFetch, VigorFetchBase, VigorFetchError, VigorFetchErrorMessageFuncs, VigorFetchPolicyBase, VigorFetchPolicyMiddlewares, VigorFetchPolicyMiddlewaresBase, VigorFetchPolicySettings, VigorFetchPolicySettingsBase, VigorJitter, VigorParse, VigorParseBase, VigorParseContentTypeStrategy, VigorParseError, VigorParseErrorMessageFuncs, VigorParsePolicyBase, VigorParsePolicyMiddlewares, VigorParsePolicyMiddlewaresBase, VigorParsePolicySettings, VigorParsePolicySettingsBase, VigorParsePolicyStrategies, VigorParsePolicyStrategiesBase, VigorParseSniffStrategy, VigorRetry, VigorRetryBase, VigorRetryError, VigorRetryErrorMessageFuncs, VigorRetryPolicyAlgorithms, VigorRetryPolicyAlgorithmsBackoff, VigorRetryPolicyAlgorithmsBackoffBase, VigorRetryPolicyAlgorithmsBase, VigorRetryPolicyAlgorithmsConstant, VigorRetryPolicyAlgorithmsConstantBase, VigorRetryPolicyAlgorithmsCustom, VigorRetryPolicyAlgorithmsCustomBase, VigorRetryPolicyAlgorithmsLinear, VigorRetryPolicyAlgorithmsLinearBase, VigorRetryPolicyBase, VigorRetryPolicyMiddlewares, VigorRetryPolicyMiddlewaresBase, VigorRetryPolicySettings, VigorRetryPolicySettingsBase, VigorStatus, vigor as default, vigor };
export type { VigorAllEachMiddlewareFn, VigorAllEachOnErrorFn, VigorAllErrorCodes, VigorAllErrorDatas, VigorAllPolicyMiddlewaresSchema, VigorAllPolicySchema, VigorAllPolicySettingsSchema, VigorAllSchema, VigorAllTask, VigorBuiltin, VigorConcat, VigorDeepMerge, VigorDeepPartial, VigorErrorOptions, VigorFetchErrorCodes, VigorFetchErrorDatas, VigorFetchPolicyMiddlewaresApi, VigorFetchPolicyMiddlewaresFluent, VigorFetchPolicyMiddlewaresIntercept, VigorFetchPolicyMiddlewaresSchema, VigorFetchPolicySchema, VigorFetchPolicySettingsSchema, VigorFetchSchema, VigorLastOf, VigorMergeMode, VigorMergeStrategy, VigorParseErrorCodes, VigorParseErrorDatas, VigorParsePolicyMiddlewaresApi, VigorParsePolicyMiddlewaresFluent, VigorParsePolicyMiddlewaresIntercept, VigorParsePolicyMiddlewaresSchema, VigorParsePolicySchema, VigorParsePolicySettingsSchema, VigorParsePolicyStrategiesSchema, VigorParseSchema, VigorParseStrategyFunc, VigorPlugin, VigorPrimitive, VigorReplaceType, VigorRetryErrorCodes, VigorRetryErrorDatas, VigorRetryPipeInitialContext, VigorRetryPipeResult, VigorRetryPipeStepResult, VigorRetryPipeStepRetryIf, VigorRetryPipeStepVoid, VigorRetryPolicyAlgorithmsBackoffSchema, VigorRetryPolicyAlgorithmsConstantSchema, VigorRetryPolicyAlgorithmsCustomSchema, VigorRetryPolicyAlgorithmsLinearSchema, VigorRetryPolicyAlgorithmsSchema, VigorRetryPolicyMiddlewaresApi, VigorRetryPolicyMiddlewaresFluent, VigorRetryPolicyMiddlewaresIntercept, VigorRetryPolicyMiddlewaresPipe, VigorRetryPolicyMiddlewaresSchema, VigorRetryPolicySchema, VigorRetryPolicySettingsSchema, VigorRetrySchema, VigorReturnType, VigorSimplify, VigorStringable };
