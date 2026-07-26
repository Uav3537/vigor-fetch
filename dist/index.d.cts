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
/**
 * Resolves the effective result type for a builder that supports `.cast<T>()`.
 *
 * If `Cast` is anything other than the `VigorEmpty` sentinel (i.e. `.cast<T>()`
 * was called at least once), it always wins — regardless of how many times
 * `target()`/`strategies()`/etc. were called before or after it. Otherwise the
 * naturally-inferred `Natural` type (e.g. derived from the target function's
 * return type through the middleware pipeline) is used.
 */
type VigorCastResult<Cast, Natural> = [
    VigorExcludeEmpty<Cast>
] extends [never] ? Natural : Cast;
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

type VigorAllSchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Schema">;
    policy: VigorAllPolicySchema<T>;
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown;
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
    readonly cast: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
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
        readonly policy: {
            readonly settings: VigorAllPolicySettingsSchema<any>;
        };
    }>>>;
    /** Configures the all-policy's per-task middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorAllPolicyMiddlewaresSchema<T>>, R extends VigorAllSchema<any>>(input: N | ((s: VigorAllPolicyMiddlewares<T>) => VigorAllPolicyMiddlewares<R>) | VigorAllPolicyMiddlewares<R>): VigorAll<VigorAllIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly middlewares: VigorAllPolicyMiddlewaresSchema<any>;
        };
    }>>>;
    /** Runs a single task through the before/after/onError middleware pipeline. */
    private _runTask;
    /**
     * Overrides the resolved result type with `T`, taking priority over the
     * naturally-inferred `unknown[]`. Can be called before or after
     * `target()` (or any other configuration method); whichever `.cast<T>()`
     * call happens last wins.
     */
    cast<const C>(): VigorAll<VigorAllIn<VigorDeepMerge<T, {
        cast: C;
    }>>>;
    /** Runs all tasks and returns the results array directly, throwing on final failure. */
    request<R = VigorCastResult<T["cast"], unknown[]>>(): Promise<R>;
    /** Runs all tasks and returns a result/error envelope instead of throwing. */
    requestVerbose<R = VigorCastResult<T["cast"], unknown[]>>(): Promise<{
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

type VigorFetchExtraOptions = Omit<RequestInit, "method" | "headers" | "body" | "signal">;
type VigorFetchOptions = VigorFetchExtraOptions & {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "TRACE";
    headers: Record<string, string>;
    body?: BodyInit | null;
    signal?: AbortSignal;
};
/**
 * Base shape shared by every fetch context variant. `R` is the type of
 * `result` at the point the context is observed — computed per pipeline
 * stage instead of being fixed on the schema.
 */
type VigorFetchContextSchema<T extends VigorFetchSchema<T>, R = VigorCastResult<T["cast"], unknown> | VigorDefaultType> = {
    __brand: VigorBrand<"Fetch", "Context<Schema">;
    href: string;
    response: Response | VigorDefaultType;
    result: R;
    error: unknown;
    options: VigorFetchOptions | VigorDefaultType;
    flags: {
        overrided: boolean;
        restarted: boolean;
    };
    record: Record<string, any>;
    policy: T["policy"];
};
/** Context shape seen by `before` middlewares — the request hasn't been sent yet. */
type VigorFetchBeforeContextSchema<T extends VigorFetchSchema<T>> = VigorFetchContextSchema<T, VigorDefaultType>;
/** Context shape seen by `after` / `onResult` middlewares — a response has been received/parsed. */
type VigorFetchAfterContextSchema<T extends VigorFetchSchema<T>> = VigorFetchContextSchema<T, VigorCastResult<T["cast"], unknown> | VigorDefaultType>;

type VigorFetchPolicySettingsSchema<T extends VigorFetchSchema<T>> = {
    __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
    retryHeaders: string[];
    unretryStatus: number[];
    maxRestarts: number;
    default: ((ctx: VigorFetchContextSchema<T>) => any | Promise<any>) | VigorEmptyType;
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
        func: (ctx: VigorFetchBeforeContextSchema<T>) => void;
    };
    after: {
        _mode: "fluent";
        func: (ctx: VigorFetchAfterContextSchema<T>) => void;
    };
    onResult: {
        _mode: "fluent";
        func: (res: VigorFetchAfterContextSchema<T>["result"]) => VigorFetchContextSchema<any>["result"];
    };
    onError: {
        _mode: "fluent";
        func: (err: VigorFetchContextSchema<T>["error"]) => void;
    };
};
type VigorFetchPolicyMiddlewaresApi<T extends VigorFetchSchema<T>> = {
    setResult: (res: VigorFetchContextSchema<any>["result"]) => void;
    throwError: (err: VigorFetchContextSchema<any>["error"]) => void;
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
        func: (ctx: VigorFetchBeforeContextSchema<T>, api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "throwError" | "setOptions" | "setHeaders" | "setBody">) => VigorFetchContextSchema<any> | Promise<VigorFetchContextSchema<any>>;
    };
    after: {
        _mode: "intercept";
        func: (ctx: VigorFetchAfterContextSchema<T>, api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorFetchContextSchema<any> | Promise<VigorFetchContextSchema<any>>;
    };
    onResult: {
        _mode: "intercept";
        func: (ctx: VigorFetchAfterContextSchema<T>, api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorFetchContextSchema<any> | Promise<VigorFetchContextSchema<any>>;
    };
    onError: {
        _mode: "intercept";
        func: (ctx: VigorFetchContextSchema<T>, api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult" | "throwError" | "proceedRestart" | "cancelRestart">) => VigorFetchContextSchema<any> | Promise<VigorFetchContextSchema<any>>;
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
    before<const N extends VigorFetchPolicyMiddlewaresFluent<T>["before"]["func"]>(type: "fluent", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                before: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    before<const N extends VigorFetchPolicyMiddlewaresIntercept<T>["before"]["func"]>(type: "intercept", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
    after<const N extends VigorFetchPolicyMiddlewaresFluent<T>["after"]["func"]>(type: "fluent", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                after: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    after<const N extends VigorFetchPolicyMiddlewaresIntercept<T>["after"]["func"]>(type: "intercept", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
    onResult<const N extends VigorFetchPolicyMiddlewaresFluent<T>["onResult"]["func"]>(type: "fluent", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onResult: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onResult<const N extends VigorFetchPolicyMiddlewaresIntercept<T>["onResult"]["func"]>(type: "intercept", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
    onError<const N extends VigorFetchPolicyMiddlewaresFluent<T>["onError"]["func"]>(type: "fluent", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onError: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onError<const N extends VigorFetchPolicyMiddlewaresIntercept<T>["onError"]["func"]>(type: "intercept", func: N): VigorApply<VigorFetchPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
                unit: 1000;
                multiplier: 1.7;
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
        func: (ctx: VigorRetryBeforeContextSchema<T>) => void;
    };
    after: {
        _mode: "fluent";
        func: (ctx: VigorRetryAfterContextSchema<T>) => void;
    };
    onResult: {
        _mode: "fluent";
        func: (res: VigorRetryAfterContextSchema<T>["result"]) => VigorRetryContextSchema<any>["result"];
    };
    retryIf: {
        _mode: "fluent";
        func: (err: VigorRetryContextSchema<T>["error"]) => VigorRetryContextSchema<any>["flags"]["doRetry"];
    };
    onRetry: {
        _mode: "fluent";
        func: (err: VigorRetryContextSchema<T>["error"]) => void;
    };
    onError: {
        _mode: "fluent";
        func: (err: VigorRetryContextSchema<T>["error"]) => void;
    };
};
type VigorRetryPolicyMiddlewaresApi<T extends VigorRetrySchema<T>> = {
    setResult: (res: VigorRetryContextSchema<any>["result"]) => void;
    throwError: (err: VigorRetryContextSchema<any>["error"]) => void;
    abort: (err: VigorRetryContextSchema<any>["error"]) => void;
    breakRetry: (err: VigorRetryContextSchema<any>["error"]) => void;
    proceedRetry: () => void;
    cancelRetry: () => void;
    setDelay: (num: VigorRetryContextSchema<any>["system"]["delay"]) => void;
    proceedRestart: () => void;
    cancelRestart: () => void;
};
type VigorRetryPolicyMiddlewaresIntercept<T extends VigorRetrySchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Middlewares<Intercept<Schema">;
    before: {
        _mode: "intercept";
        func: (ctx: VigorRetryBeforeContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "abort" | "throwError" | "breakRetry">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>;
    };
    after: {
        _mode: "intercept";
        func: (ctx: VigorRetryAfterContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "throwError">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>;
    };
    onResult: {
        _mode: "intercept";
        func: (ctx: VigorRetryAfterContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>;
    };
    retryIf: {
        _mode: "intercept";
        func: (ctx: VigorRetryContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "proceedRetry" | "cancelRetry">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>;
    };
    onRetry: {
        _mode: "intercept";
        func: (ctx: VigorRetryContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "throwError" | "setDelay">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>;
    };
    onError: {
        _mode: "intercept";
        func: (ctx: VigorRetryContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "setResult" | "throwError" | "proceedRestart" | "cancelRestart">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>;
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
    before<const N extends VigorRetryPolicyMiddlewaresFluent<T>["before"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                before: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    before<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["before"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
    after<const N extends VigorRetryPolicyMiddlewaresFluent<T>["after"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                after: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    after<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["after"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
    onResult<const N extends VigorRetryPolicyMiddlewaresFluent<T>["onResult"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onResult: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onResult<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["onResult"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
    retryIf<const N extends VigorRetryPolicyMiddlewaresFluent<T>["retryIf"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                retryIf: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    retryIf<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["retryIf"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
    onRetry<const N extends VigorRetryPolicyMiddlewaresFluent<T>["onRetry"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onRetry: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onRetry<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["onRetry"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
    onError<const N extends VigorRetryPolicyMiddlewaresFluent<T>["onError"]["func"]>(type: "fluent", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onError: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onError<const N extends VigorRetryPolicyMiddlewaresIntercept<T>["onError"]["func"]>(type: "intercept", func: N): VigorApply<VigorRetryPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
type VigorRetryPipeInitialContext<T extends VigorRetrySchema<T>, R = VigorCastResult<T["cast"], VigorReturnType<T["policy"]["target"]>>> = VigorDeepMerge<Omit<VigorRetryContextSchema<T, unknown>, "result">, {
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

/**
 * Base shape shared by every retry context variant. `R` is the type of
 * `result` at the point the context is observed — it differs by pipeline
 * stage (before / after / onResult / ...), so callers plug in whichever
 * `R` matches where they are in the pipeline instead of this being fixed
 * on the schema.
 */
type VigorRetryContextSchema<T extends VigorRetrySchema<T>, R = VigorRetryPipeResult<T> | VigorDefaultType> = {
    __brand: VigorBrand<"Retry", "Context<Schema">;
    result: R;
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
/** Context shape seen by `before` middlewares — the target hasn't run yet, so there's no result. */
type VigorRetryBeforeContextSchema<T extends VigorRetrySchema<T>> = VigorRetryContextSchema<T, VigorDefaultType>;
/** Context shape seen by `after` / `onResult` middlewares — the target has settled. */
type VigorRetryAfterContextSchema<T extends VigorRetrySchema<T>> = VigorRetryContextSchema<T, VigorRetryPipeInitialContext<T>["result"]>;

type VigorRetryPolicySettingsSchema<T extends VigorRetrySchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
    default: ((ctx: VigorRetryContextSchema<T>) => any | Promise<any>) | VigorEmptyType;
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
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown;
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
    readonly cast: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
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
        readonly policy: {
            readonly settings: VigorRetryPolicySettingsSchema<any>;
        };
    }>>>;
    /** Configures the retry policy's middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorRetryPolicyMiddlewaresSchema<T>>, R extends VigorRetrySchema<any>>(input: N | ((s: VigorRetryPolicyMiddlewares<T>) => VigorRetryPolicyMiddlewares<R>) | VigorRetryPolicyMiddlewares<R>): VigorRetry<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly middlewares: VigorRetryPolicyMiddlewaresSchema<any>;
        };
    }>>>;
    /** Configures the retry policy's delay algorithm. */
    algorithms<const N extends VigorDeepPartial<VigorRetryPolicyAlgorithmsSchema<T>>, R extends VigorRetrySchema<any>>(input: N | ((a: VigorRetryPolicyAlgorithms<T>) => VigorRetryPolicyAlgorithms<R> | VigorRetryPolicyAlgorithmsConstant<any>)): VigorRetry<VigorRetryIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly algorithms: any;
        };
    }>>>;
    /**
     * Overrides the resolved result type with `T`, taking priority over the
     * type naturally inferred from `target()`. Can be called before or after
     * `target()` (or any other configuration method); whichever `.cast<T>()`
     * call happens last wins.
     */
    cast<const C>(): VigorRetry<VigorRetryIn<VigorDeepMerge<T, {
        cast: C;
    }>>>;
    /** Runs the target and returns its result directly, throwing on final failure. */
    request<R = VigorCastResult<T["cast"], VigorRetryContextSchema<T>["result"]>>(): Promise<R>;
    /** Runs the target and returns a result/error envelope instead of throwing. */
    requestVerbose<R = VigorCastResult<T["cast"], VigorRetryContextSchema<T>["result"]>>(): Promise<{
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

/**
 * Base shape shared by every parse context variant. `R` is the type of
 * `result` at the point the context is observed — computed per pipeline
 * stage instead of being fixed on the schema.
 */
type VigorParseContextSchema<T extends VigorParseSchema<T>, R = VigorCastResult<T["cast"], unknown> | VigorDefaultType> = {
    __brand: VigorBrand<"Parse", "Context<Schema">;
    result: R;
    error: unknown;
    response: VigorParsePolicySchema<T>["target"];
    flags: {
        overrided: boolean;
        restarted: boolean;
    };
    record: Record<string, any>;
    policy: T["policy"];
};
/** Context shape seen by `before` middlewares — parsing hasn't run yet. */
type VigorParseBeforeContextSchema<T extends VigorParseSchema<T>> = VigorParseContextSchema<T, VigorDefaultType>;
/** Context shape seen by `after` / `onResult` middlewares — a result has been produced. */
type VigorParseAfterContextSchema<T extends VigorParseSchema<T>> = VigorParseContextSchema<T, VigorCastResult<T["cast"], unknown> | VigorDefaultType>;

type VigorParsePolicySettingsSchema<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
    raw: boolean;
    default: ((ctx: VigorParseContextSchema<T>) => any | Promise<any>) | VigorEmptyType;
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
        func: (ctx: VigorParseBeforeContextSchema<T>) => void;
    };
    after: {
        _mode: "fluent";
        func: (ctx: VigorParseAfterContextSchema<T>) => void;
    };
    onResult: {
        _mode: "fluent";
        func: (res: VigorParseAfterContextSchema<T>["result"]) => VigorParseContextSchema<any>["result"];
    };
    onError: {
        _mode: "fluent";
        func: (err: VigorParseContextSchema<T>["error"]) => void;
    };
};
type VigorParsePolicyMiddlewaresApi<T extends VigorParseSchema<T>> = {
    setResult: (res: VigorParseContextSchema<any>["result"]) => void;
    throwError: (err: VigorParseContextSchema<any>["error"]) => void;
    proceedRestart: () => void;
    cancelRestart: () => void;
};
type VigorParsePolicyMiddlewaresIntercept<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Policy<Middlewares<Intercept<Schema">;
    before: {
        _mode: "intercept";
        func: (ctx: VigorParseBeforeContextSchema<T>, api: Pick<VigorParsePolicyMiddlewaresApi<T>, "throwError">) => VigorParseContextSchema<any> | Promise<VigorParseContextSchema<any>>;
    };
    after: {
        _mode: "intercept";
        func: (ctx: VigorParseAfterContextSchema<T>, api: Pick<VigorParsePolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorParseContextSchema<any> | Promise<VigorParseContextSchema<any>>;
    };
    onResult: {
        _mode: "intercept";
        func: (ctx: VigorParseAfterContextSchema<T>, api: Pick<VigorParsePolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorParseContextSchema<any> | Promise<VigorParseContextSchema<any>>;
    };
    onError: {
        _mode: "intercept";
        func: (ctx: VigorParseContextSchema<T>, api: Pick<VigorParsePolicyMiddlewaresApi<T>, "setResult" | "throwError" | "proceedRestart" | "cancelRestart">) => VigorParseContextSchema<any> | Promise<VigorParseContextSchema<any>>;
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
    before<const N extends VigorParsePolicyMiddlewaresFluent<T>["before"]["func"]>(type: "fluent", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                before: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    before<const N extends VigorParsePolicyMiddlewaresIntercept<T>["before"]["func"]>(type: "intercept", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
    after<const N extends VigorParsePolicyMiddlewaresFluent<T>["after"]["func"]>(type: "fluent", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                after: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    after<const N extends VigorParsePolicyMiddlewaresIntercept<T>["after"]["func"]>(type: "intercept", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
    onResult<const N extends VigorParsePolicyMiddlewaresFluent<T>["onResult"]["func"]>(type: "fluent", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onResult: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onResult<const N extends VigorParsePolicyMiddlewaresIntercept<T>["onResult"]["func"]>(type: "intercept", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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
    onError<const N extends VigorParsePolicyMiddlewaresFluent<T>["onError"]["func"]>(type: "fluent", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onError: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onError<const N extends VigorParsePolicyMiddlewaresIntercept<T>["onError"]["func"]>(type: "intercept", func: N): VigorApply<VigorParsePolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
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

type VigorParsePolicySchema<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Policy<Schema">;
    target: Request | Response | VigorDefaultType;
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
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown;
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
    readonly cast: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
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
        readonly policy: {
            readonly settings: VigorParsePolicySettingsSchema<any>;
        };
    }>>>;
    /** Configures the parse policy's middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorParsePolicyMiddlewaresSchema<T>>, R extends VigorParseSchema<any>>(input: N | ((s: VigorParsePolicyMiddlewares<T>) => VigorParsePolicyMiddlewares<R>) | VigorParsePolicyMiddlewares<R>): VigorParse<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly middlewares: VigorParsePolicyMiddlewaresSchema<any>;
        };
    }>>>;
    /** Configures the parse policy's fallback chain of parsing strategies. */
    strategies<const N extends VigorDeepPartial<VigorParsePolicyStrategiesSchema<T>>, R extends VigorParseSchema<any>>(input: N | ((s: VigorParsePolicyStrategies<T>) => VigorParsePolicyStrategies<R>) | VigorParsePolicyStrategies<R>): VigorParse<VigorParseIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly strategies: VigorParsePolicyStrategiesSchema<any>;
        };
    }>>>;
    /**
     * Overrides the resolved result type with `T`, taking priority over the
     * default `unknown` result. Can be called before or after `strategies()`
     * (or any other configuration method); whichever `.cast<T>()` call
     * happens last wins.
     */
    cast<const C>(): VigorParse<VigorParseIn<VigorDeepMerge<T, {
        cast: C;
    }>>>;
    /** Runs parsing and returns the result directly, throwing on final failure. */
    request<R = VigorCastResult<T["cast"], VigorParseContextSchema<T>["result"]>>(): Promise<R>;
    /** Runs parsing and returns a result/error envelope instead of throwing. */
    requestVerbose<R = VigorCastResult<T["cast"], VigorParseContextSchema<T>["result"]>>(): Promise<{
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
        readonly cast: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
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
        readonly cast: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
    };
};

type VigorFetchSchema<T extends VigorFetchSchema<T>> = {
    __brand: VigorBrand<"Fetch", "Schema">;
    policy: VigorFetchPolicySchema<T>;
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown;
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
            readonly cast: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
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
            readonly cast: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
        };
    };
    readonly cast: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
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
        readonly policy: {
            readonly settings: VigorFetchPolicySettingsSchema<any>;
        };
    }>>>;
    /** Configures the fetch policy's middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorFetchPolicyMiddlewaresSchema<T>>, R extends VigorFetchSchema<any>>(input: N | ((s: VigorFetchPolicyMiddlewares<T>) => VigorFetchPolicyMiddlewares<R>) | VigorFetchPolicyMiddlewares<R>): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        readonly policy: {
            readonly middlewares: VigorFetchPolicyMiddlewaresSchema<any>;
        };
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
    /**
     * Overrides the resolved result type with `T`, taking priority over the
     * default `unknown` result. Can be called before or after `parse()` (or
     * any other configuration method); whichever `.cast<T>()` call happens
     * last wins.
     */
    cast<const C>(): VigorFetch<VigorFetchIn<VigorDeepMerge<T, {
        cast: C;
    }>>>;
    /** Runs the request and returns its parsed result directly, throwing on final failure. */
    request<R = VigorCastResult<T["cast"], VigorFetchContextSchema<T>["result"]>>(): Promise<R>;
    /** Runs the request and returns a result/error envelope instead of throwing. */
    requestVerbose<R = VigorCastResult<T["cast"], VigorFetchContextSchema<T>["result"]>>(): Promise<{
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

/**
 * Small named helpers that actually *call* the target/origin method with the
 * generic argument `F`. These exist purely so `ReturnType<typeof xWithY<F>>`
 * can forward `F` into the real merged config type — referencing the method
 * type directly (e.g. `VigorRetry["target"]`) would leave `F` unapplied and
 * collapse back to the method's own parameter type.
 */
declare function retryWithTarget<const F extends Parameters<VigorRetry["target"]>[0]>(task: F): VigorRetry<VigorRetryIn<{
    policy: {
        target: F;
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
        middlewares: {
            readonly __brand: VigorBrand<"Retry", "Policy<Middlewares<Schema">;
            readonly before: [];
            readonly after: [];
            readonly onResult: [];
            readonly retryIf: [];
            readonly onRetry: [];
            readonly onError: [];
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
    cast: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
}>>;
declare function parseWithTarget<const F extends Parameters<VigorParse["target"]>[0]>(response: F): VigorParse<VigorParseIn<{
    policy: {
        target: F;
        __brand: VigorBrand<"Parse", "Policy<Schema">;
        settings: {
            readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
            readonly raw: false;
            readonly default: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly maxRestarts: 3;
        };
        middlewares: {
            readonly __brand: VigorBrand<"Parse", "Policy<Middlewares<Schema">;
            readonly before: [];
            readonly after: [];
            readonly onResult: [];
            readonly onError: [];
        };
        strategies: {
            readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
            readonly funcs: VigorParseStrategyFunc[];
        };
    };
    __brand: VigorBrand<"Parse", "Schema">;
    cast: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
}>>;
declare function fetchWithOrigin<const F extends Parameters<VigorFetch["origin"]>[0]>(origin: F): VigorFetch<VigorFetchIn<{
    policy: {
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
        middlewares: {
            readonly __brand: VigorBrand<"Fetch", "Policy<Middlewares<Schema">;
            readonly before: [];
            readonly after: [];
            readonly onResult: [];
            readonly onError: [];
        };
        headers: {};
        method: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
        body: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
        origin: F;
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
            readonly cast: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
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
            readonly cast: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
        };
    };
    __brand: VigorBrand<"Fetch", "Schema">;
    cast: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
}>>;
declare function allWithTargets<const F extends VigorAllTask[]>(tasks: F): VigorAll<VigorAllIn<{
    policy: {
        target: F extends VigorBuiltin ? F : F extends readonly any[] ? [...VigorAllTask[], ...F] : F;
        __brand: VigorBrand<"All", "Policy<Schema">;
        settings: {
            readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
            readonly concurrency: 5;
            readonly onlySuccess: false;
        };
        middlewares: {
            readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
            readonly before: VigorAllEachMiddlewareFn[];
            readonly after: VigorAllEachMiddlewareFn[];
            readonly onError: VigorAllEachOnErrorFn[];
        };
    };
    __brand: VigorBrand<"All", "Schema">;
    cast: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
}>>;
/**
 * Overload types for each entry helper. Object literals can't declare
 * overloaded method shorthand directly (`foo(): A; foo(x: B): C { ... }` is a
 * syntax error inside `{ ... }`), so each helper is typed here and the
 * implementation is cast to it below.
 */
type RetryFn = {
    (): VigorRetry;
    <const F extends Parameters<VigorRetry["target"]>[0]>(task: F): ReturnType<typeof retryWithTarget<F>>;
};
type ParseFn = {
    (): VigorParse;
    <const F extends Parameters<VigorParse["target"]>[0]>(response: F): ReturnType<typeof parseWithTarget<F>>;
};
type FetchFn = {
    (): VigorFetch;
    <const F extends Parameters<VigorFetch["origin"]>[0]>(origin: F): ReturnType<typeof fetchWithOrigin<F>>;
};
type AllFn = {
    (): VigorAll;
    <const F extends VigorAllTask[]>(...tasks: F): ReturnType<typeof allWithTargets<F>>;
};
/** Everything `vigor` exposes except `use` — kept separate so `VigorInstance` (below) can self-reference without a circular-inference error. */
declare const vigorBase: {
    retry: RetryFn;
    parse: ParseFn;
    fetch: FetchFn;
    all: AllFn;
    builders: {
        fetch: {
            settings: () => VigorFetchPolicySettings<{
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
                        readonly cast: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
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
                        readonly cast: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                    };
                };
                readonly cast: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            }>;
            middlewares: () => VigorFetchPolicyMiddlewares<{
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
                        readonly cast: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
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
                        readonly cast: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                    };
                };
                readonly cast: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            }>;
        };
        retry: {
            settings: () => VigorRetryPolicySettings<{
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
                readonly cast: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            }>;
            middlewares: () => VigorRetryPolicyMiddlewares<{
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
                readonly cast: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            }>;
            algorithms: () => VigorRetryPolicyAlgorithms<{
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
                readonly cast: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            }>;
            algorithm: {
                constant: () => VigorRetryPolicyAlgorithmsConstant<{
                    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Constant<Schema">;
                    readonly _tag: "constant";
                    readonly jitter: 1000;
                    readonly interval: 2000;
                    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsConstantSchema<any>) => number;
                }>;
                linear: () => VigorRetryPolicyAlgorithmsLinear<{
                    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Linear<Schema">;
                    readonly _tag: "linear";
                    readonly jitter: 1000;
                    readonly initial: 500;
                    readonly increment: 1000;
                    readonly minDelay: 0;
                    readonly maxDelay: 10000;
                    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsLinearSchema<any>) => number;
                }>;
                backoff: () => VigorRetryPolicyAlgorithmsBackoff<{
                    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Backoff<Schema">;
                    readonly _tag: "backoff";
                    readonly jitter: 800;
                    readonly initial: 0;
                    readonly multiplier: 1.7;
                    readonly unit: 1000;
                    readonly minDelay: 500;
                    readonly maxDelay: 10000;
                    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsBackoffSchema<any>) => number;
                }>;
                custom: () => VigorRetryPolicyAlgorithmsCustom<{
                    readonly __brand: VigorBrand<"Retry", "Policy<Algorithms<Custom<Schema">;
                    readonly _tag: "custom";
                    readonly jitter: 800;
                    readonly minDelay: 500;
                    readonly maxDelay: 10000;
                    readonly target: symbol & {
                        __brand: VigorBrand<"Core", "Symbol_Empty">;
                    };
                    readonly _calculateDelay: (att: number, config: VigorRetryPolicyAlgorithmsCustomSchema<any>) => number;
                }>;
            };
        };
        parse: {
            settings: () => VigorParsePolicySettings<{
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
                readonly cast: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            }>;
            middlewares: () => VigorParsePolicyMiddlewares<{
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
                readonly cast: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            }>;
            strategies: () => VigorParsePolicyStrategies<{
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
                readonly cast: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            }>;
        };
        all: {
            settings: () => VigorAllPolicySettings<{
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
                readonly cast: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            }>;
            middlewares: () => VigorAllPolicyMiddlewares<{
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
                readonly cast: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            }>;
        };
    };
};
type VigorInstance = typeof vigorBase & {
    use: <P extends VigorPlugin<any, any>>(plugin: P, options?: P["options"]) => VigorInstance & ReturnType<P["func"]>;
};
/**
 * A plugin never mutates the `VigorInstance` it receives — it reads from it
 * (e.g. to wrap an existing method) and returns `Ext`, the properties to
 * merge into a *new* instance. `use()` owns cloning/merging, so plugins stay
 * pure and `vigor` itself is never touched.
 */
type VigorPlugin<O extends {
    [str: string]: any;
} = {}, Ext extends Record<string, any> = Record<string, any>> = {
    options: O;
    func: (v: VigorInstance, options: O) => Ext;
};
declare const vigor: VigorInstance;

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
        error: unknown;
    }) => string;
    readonly RESTART_EXHAUSTED: ({ maxAttempts }: {
        maxAttempts: number;
        error: unknown;
    }) => string;
    readonly TIMED_OUT: ({ limit }: {
        limit: number;
    }) => string;
};
type VigorRetryErrorCodes = keyof typeof VigorRetryErrorMessageFuncs;
type VigorRetryErrorDatas<C extends VigorRetryErrorCodes> = Parameters<typeof VigorRetryErrorMessageFuncs[C]> extends [infer A] ? A : undefined;
/** Error type thrown by the retry module. */
declare class VigorRetryError<C extends VigorRetryErrorCodes, T extends VigorRetrySchema<T>> extends VigorError<C, VigorRetryErrorDatas<C>, VigorRetryContextSchema<T>> {
    /**
     * @param code - One of the retry module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorRetryErrorDatas<C>, VigorRetryContextSchema<T>>);
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
        error: unknown;
    }) => string;
};
type VigorParseErrorCodes = keyof typeof VigorParseErrorMessageFuncs;
type VigorParseErrorDatas<C extends VigorParseErrorCodes> = Parameters<typeof VigorParseErrorMessageFuncs[C]> extends [infer A] ? A : undefined;
/** Error type thrown by the parse module. */
declare class VigorParseError<C extends VigorParseErrorCodes, T extends VigorParseSchema<T>> extends VigorError<C, VigorParseErrorDatas<C>, VigorParseContextSchema<T>> {
    /**
     * @param code - One of the parse module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorParseErrorDatas<C>, VigorParseContextSchema<T>>);
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
        error: unknown;
    }) => string;
};
type VigorFetchErrorCodes = keyof typeof VigorFetchErrorMessageFuncs;
type VigorFetchErrorDatas<C extends VigorFetchErrorCodes> = Parameters<typeof VigorFetchErrorMessageFuncs[C]> extends [infer A] ? A : undefined;
/** Error type thrown by the fetch module. */
declare class VigorFetchError<C extends VigorFetchErrorCodes, T extends VigorFetchSchema<T>> extends VigorError<C, VigorFetchErrorDatas<C>, VigorFetchContextSchema<T>> {
    /**
     * @param code - One of the fetch module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorFetchErrorDatas<C>, VigorFetchContextSchema<T>>);
}

declare const VigorAllErrorMessageFuncs: {
    readonly EMPTY_TARGET: (_: {}) => string;
};
type VigorAllErrorCodes = keyof typeof VigorAllErrorMessageFuncs;
type VigorAllErrorDatas<C extends VigorAllErrorCodes> = Parameters<typeof VigorAllErrorMessageFuncs[C]> extends [infer A] ? A : undefined;
/** Error type thrown by the all module. */
declare class VigorAllError<C extends VigorAllErrorCodes, T extends VigorAllSchema<T>> extends VigorError<C, VigorAllErrorDatas<C>, VigorAllContextSchema<T>> {
    /**
     * @param code - One of the all module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorAllErrorDatas<C>, VigorAllContextSchema<T>>);
}

export { VigorAll, VigorAllBase, type VigorAllEachMiddlewareFn, type VigorAllEachOnErrorFn, VigorAllError, type VigorAllErrorCodes, type VigorAllErrorDatas, VigorAllErrorMessageFuncs, VigorAllPolicyBase, VigorAllPolicyMiddlewares, VigorAllPolicyMiddlewaresBase, type VigorAllPolicyMiddlewaresSchema, type VigorAllPolicySchema, VigorAllPolicySettings, VigorAllPolicySettingsBase, type VigorAllPolicySettingsSchema, type VigorAllSchema, type VigorAllTask, type VigorBuiltin, type VigorCastResult, type VigorConcat, type VigorDeepMerge, type VigorDeepPartial, VigorError, type VigorErrorOptions, VigorFetch, VigorFetchBase, VigorFetchError, type VigorFetchErrorCodes, type VigorFetchErrorDatas, VigorFetchErrorMessageFuncs, VigorFetchPolicyBase, VigorFetchPolicyMiddlewares, type VigorFetchPolicyMiddlewaresApi, VigorFetchPolicyMiddlewaresBase, type VigorFetchPolicyMiddlewaresFluent, type VigorFetchPolicyMiddlewaresIntercept, type VigorFetchPolicyMiddlewaresSchema, type VigorFetchPolicySchema, VigorFetchPolicySettings, VigorFetchPolicySettingsBase, type VigorFetchPolicySettingsSchema, type VigorFetchSchema, type VigorInstance, VigorJitter, type VigorLastOf, type VigorMergeMode, type VigorMergeStrategy, VigorParse, VigorParseBase, VigorParseContentTypeStrategy, VigorParseError, type VigorParseErrorCodes, type VigorParseErrorDatas, VigorParseErrorMessageFuncs, VigorParsePolicyBase, VigorParsePolicyMiddlewares, type VigorParsePolicyMiddlewaresApi, VigorParsePolicyMiddlewaresBase, type VigorParsePolicyMiddlewaresFluent, type VigorParsePolicyMiddlewaresIntercept, type VigorParsePolicyMiddlewaresSchema, type VigorParsePolicySchema, VigorParsePolicySettings, VigorParsePolicySettingsBase, type VigorParsePolicySettingsSchema, VigorParsePolicyStrategies, VigorParsePolicyStrategiesBase, type VigorParsePolicyStrategiesSchema, type VigorParseSchema, VigorParseSniffStrategy, type VigorParseStrategyFunc, type VigorPlugin, type VigorPrimitive, type VigorReplaceType, VigorRetry, VigorRetryBase, VigorRetryError, type VigorRetryErrorCodes, type VigorRetryErrorDatas, VigorRetryErrorMessageFuncs, type VigorRetryPipeInitialContext, type VigorRetryPipeResult, type VigorRetryPipeStepResult, type VigorRetryPipeStepRetryIf, type VigorRetryPipeStepVoid, VigorRetryPolicyAlgorithms, VigorRetryPolicyAlgorithmsBackoff, VigorRetryPolicyAlgorithmsBackoffBase, type VigorRetryPolicyAlgorithmsBackoffSchema, VigorRetryPolicyAlgorithmsBase, VigorRetryPolicyAlgorithmsConstant, VigorRetryPolicyAlgorithmsConstantBase, type VigorRetryPolicyAlgorithmsConstantSchema, VigorRetryPolicyAlgorithmsCustom, VigorRetryPolicyAlgorithmsCustomBase, type VigorRetryPolicyAlgorithmsCustomSchema, VigorRetryPolicyAlgorithmsLinear, VigorRetryPolicyAlgorithmsLinearBase, type VigorRetryPolicyAlgorithmsLinearSchema, type VigorRetryPolicyAlgorithmsSchema, VigorRetryPolicyBase, VigorRetryPolicyMiddlewares, type VigorRetryPolicyMiddlewaresApi, VigorRetryPolicyMiddlewaresBase, type VigorRetryPolicyMiddlewaresFluent, type VigorRetryPolicyMiddlewaresIntercept, type VigorRetryPolicyMiddlewaresPipe, type VigorRetryPolicyMiddlewaresSchema, type VigorRetryPolicySchema, VigorRetryPolicySettings, VigorRetryPolicySettingsBase, type VigorRetryPolicySettingsSchema, type VigorRetrySchema, type VigorReturnType, type VigorSimplify, VigorStatus, type VigorStringable, vigor as default, vigor };
