type VigorBrand<Branch extends string, Name extends string> = string & {
    __brand: `@vigor-fetch:::${Branch} <- ${Name}`;
};
/**
 * Builds the literal brand string used by {@link VigorBrand}, preserving the
 * `Branch`/`Name` literal types for use as a `__brand` value.
 */
declare function createBrand<const Branch extends string, const Name extends string>(b: Branch, n: Name): VigorBrand<Branch, Name>;
declare const VigorDefault: symbol & {
    __brand: VigorBrand<"Core", "Symbol_Default">;
};
type VigorDefaultType = typeof VigorDefault;
type VigorExcludeDefault<T> = Exclude<T, VigorDefaultType>;
/** Type guard checking whether a value is the {@link VigorDefault} sentinel. */
declare const isVigorDefault: (v: any) => v is VigorDefaultType;
declare const VigorEmpty: symbol & {
    __brand: VigorBrand<"Core", "Symbol_Empty">;
};
type VigorEmptyType = typeof VigorEmpty;
type VigorExcludeEmpty<T> = Exclude<T, VigorEmptyType>;
/** Type guard checking whether a value is the {@link VigorEmpty} sentinel. */
declare const isVigorEmpty: (v: any) => v is VigorEmptyType;
/**
 * Runtime placeholder written into a `cast` slot by `.cast<T>()`. It carries
 * no meaningful runtime value — `.cast<T>()` is a purely type-level
 * override, so the value is never read; only its presence (vs. `VigorEmpty`)
 * matters when resolving the effective result type.
 */
declare const VigorCastPlaceholder: symbol & {
    __brand: VigorBrand<"Core", "Symbol_CastPlaceholder">;
};
type VigorCastPlaceholderType = typeof VigorCastPlaceholder;

interface VigorTypeLambda {
    readonly In?: unknown;
    readonly Target: unknown;
}
type VigorApply<F extends VigorTypeLambda, In> = F extends {
    readonly Target: unknown;
} ? (F & {
    readonly In: In;
})["Target"] : never;

type VigorPrimitive = string | number | bigint | boolean | symbol | null | undefined;
type VigorBuiltin = VigorPrimitive | Date | RegExp | Function | Map<any, any> | Set<any> | WeakMap<any, any> | WeakSet<any> | Promise<any> | Error | Request | Response | Headers | AbortSignal | Blob | FormData | URLSearchParams | ReadableStream<any> | ArrayBuffer | ArrayBufferView;
type VigorDeepPartial<T> = unknown extends T ? T : T extends VigorBuiltin ? T : T extends readonly (infer U)[] ? readonly VigorDeepPartial<U>[] : {
    [K in keyof T]?: VigorDeepPartial<T[K]>;
};
type VigorSimplify<T> = {
    [K in keyof T]: T[K];
} & {};
/**
 * Type-level mirror of `VigorStatus._merge`: objects merge key by key, arrays
 * concatenate, anything else is overwritten. `S` is the same per-path
 * strategy tree `_merge` takes — a `"replace"` leaf replaces at that path.
 * An `undefined` value keeps the source value, like it does at runtime.
 */
type VigorDeepMerge<A, B, S = undefined> = [
    S
] extends ["replace"] ? VigorReplaceWith<A, B> : 0 extends (1 & B) ? B : 0 extends (1 & A) ? B : VigorDeepMergeValue<A, B, S>;
type VigorDeepMergeValue<A, B, S> = A extends VigorBuiltin ? B : B extends VigorBuiltin ? B : A extends readonly any[] ? B extends readonly any[] ? [...A, ...B] : B : A extends object ? B extends object ? VigorSimplify<{
    [K in keyof A | keyof B]: K extends keyof B ? K extends keyof A ? VigorDeepMergeKey<A[K], B[K], VigorStrategyAt<S, K>> : B[K] : K extends keyof A ? A[K] : never;
}> : B : B;
/**
 * `B` replacing `A`. Config lists are mutable arrays, while a `const`-inferred
 * array is `readonly`, so an array replacing a mutable array is made mutable
 * (like a concatenation `[...A, ...B]` is). Anything else is kept exactly.
 */
type VigorReplaceWith<A, B> = [
    A
] extends [any[]] ? B extends readonly any[] ? [...B] : B : B;
/**
 * Merges one key: an `undefined` (or optional) value keeps the source value.
 * A `"replace"` path always takes `B` — `.cast<undefined>()` replaces too
 * (its runtime value is a placeholder, never `undefined`).
 */
type VigorDeepMergeKey<A, B, S> = [
    S
] extends ["replace"] ? VigorReplaceWith<A, B> : unknown extends B ? B : undefined extends B ? A | VigorDeepMerge<A, Exclude<B, undefined>, S> : VigorDeepMerge<A, B, S>;
/** The strategy subtree for key `K`, or `undefined` when there is none. */
type VigorStrategyAt<S, K> = S extends object ? K extends keyof S ? S[K] : undefined : undefined;
/** All keys of `T`, across every member when `T` is a union. */
type VigorKeysOf<T> = T extends unknown ? keyof T : never;
/** `T[K]`, across every member of a union `T` that has `K`. */
type VigorPropOf<T, K> = T extends unknown ? K extends keyof T ? T[K] : never : never;
/**
 * Intersected with a config-object parameter `N` to reject keys `Shape`
 * doesn't have, at any depth. A generic `const N` gets no excess-property
 * check, so without this `{ maxAttempts: 3, timeot: 5 }` would compile.
 */
type VigorNoExtraKeys<N, Shape> = N extends VigorBuiltin | readonly any[] ? unknown : unknown extends Shape ? unknown : {
    [K in Exclude<keyof N, VigorKeysOf<Shape>>]: never;
} & {
    [K in keyof N & VigorKeysOf<Shape>]: VigorNoExtraKeys<N[K], NonNullable<VigorPropOf<Shape, K>>>;
};
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
 * `target()`/`strategies()`/etc. were called before or after it, and even
 * when it is `never` or `any`. Otherwise the naturally-inferred `Natural` type
 * (e.g. derived from the target function's return type through the
 * middleware pipeline) is used.
 */
type VigorCastResult<Cast, Natural> = 0 extends (1 & Cast) ? Cast : [Cast] extends [VigorEmptyType] ? [VigorEmptyType] extends [Cast] ? Natural : Cast : Cast;
type VigorMergeMode = "merge" | "replace" | "concat";
type VigorMergeStrategy<T> = T extends VigorBuiltin ? VigorMergeMode | undefined : T extends readonly any[] ? VigorMergeMode : {
    [K in keyof T]?: VigorMergeStrategy<T[K]> | VigorMergeMode;
};
/** Whether `A` and `B` are the same type. */
type VigorIsSame<A, B> = (<X>() => X extends A ? 1 : 2) extends (<X>() => X extends B ? 1 : 2) ? true : false;
/**
 * What an intercept middleware changed: the keys of the context `A` it
 * returned whose type differs from the context `P` it was given (or that
 * `P` lacks). Returning `ctx` itself — or `{ ...ctx }` — changes nothing, so
 * the pipeline keeps its own, current types instead of the snapshot `P` was
 * computed from when the middleware was registered. An `any` return, or an
 * `any` key, changes nothing either.
 */
type VigorContextChanges<P, A> = 0 extends (1 & A) ? {} : VigorIsSame<A, P> extends true ? {} : A extends object ? {
    [K in keyof A as K extends keyof P ? VigorIsSame<A[K], P[K]> extends true ? never : 0 extends (1 & A[K]) ? never : K : K]: A[K];
} : {};
/** `Ctx` with `Changes` written over it — `Ctx` itself when nothing changed. */
type VigorContextApply<Ctx, Changes> = [
    keyof Changes
] extends [never] ? Ctx : VigorContextReset<Ctx, Changes>;
/** `Ctx` with `Fresh`'s keys given `Fresh`'s types — what the runtime (re)sets at a stage's start. One mapped type, so it stays cheap. */
type VigorContextReset<Ctx, Fresh> = {
    [K in keyof Ctx | keyof Fresh]: K extends keyof Fresh ? Fresh[K] : K extends keyof Ctx ? Ctx[K] : never;
};
/** One middleware applied to `Ctx` — see {@link VigorContextStage}. */
type VigorContextStep<Ctx, M, FluentKey extends PropertyKey> = M extends {
    _mode: "intercept";
    func: (ctx: infer P, ...args: any[]) => infer Ret;
} ? VigorContextApply<Ctx, VigorContextChanges<P, Awaited<Ret>>> : M extends {
    _mode: "fluent";
    func: (...args: any[]) => infer FR;
} ? [FluentKey] extends [never] ? Ctx : VigorContextApply<Ctx, {
    [K in FluentKey]: Awaited<FR>;
}> : Ctx;
/**
 * Folds one stage's middleware list over `Ctx`, the way the runtime runs
 * it: an intercept middleware's returned context (awaited) overwrites the
 * keys it changed (see {@link VigorContextChanges}), and a fluent one's
 * return value (awaited) overwrites `FluentKey` — `never` for a stage whose
 * fluent middlewares return nothing. A list that isn't a tuple, whose order
 * is unknown, leaves `Ctx` as it is. An `any` list — a stage of a
 * `Vigor*Schema<any>`, as in the schemas' own constraints — gives `any`, so
 * any registered middleware satisfies them.
 */
type VigorContextStage<Ctx, List, FluentKey extends PropertyKey = never> = 0 extends (1 & List) ? any : List extends readonly [infer Head, ...infer Tail] ? VigorContextStage<VigorContextStep<Ctx, Head, FluentKey>, Tail, FluentKey> : Ctx;

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
    protected _next<const Patch extends VigorDeepPartial<Base>, const S extends VigorMergeStrategy<Patch> | undefined = undefined>(patch: Patch, strategy?: S): VigorApply<TL, VigorDeepMerge<Config, Patch, S>>;
    /**
     * Deep-merges `target` onto `source`, honoring an optional per-path
     * `strategy` tree. Objects merge key by key, arrays concatenate (unless
     * `"replace"` is specified, or `arrayMode` is `"replace"`), and any other
     * value — including `null` — is overwritten. Only `undefined` keeps the
     * source value.
     */
    protected _merge<A, B>(source: A, target: B, strategy?: unknown, arrayMode?: "concat" | "replace"): VigorDeepMerge<A, B>;
    /**
     * Snapshots a runtime context for a timeline entry: a `_merge` deep clone
     * of everything but `timeline`, so later changes to `ctx` don't reach it.
     */
    protected _snapshot<C extends {
        timeline: unknown;
    }>(ctx: C): Omit<C, "timeline">;
    /** The default/base config this builder was constructed with. */
    get base(): Base;
    /** The current, merged config for this builder instance. */
    get config(): Config;
}

type VigorParsePolicySettingsSchema<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
    /**
     * Whether `requestVerbose()` records a timeline. Off by default: the
     * `timeline` stays empty and no context snapshots are taken.
     */
    debug: boolean;
    raw: boolean;
    default: ((ctx: VigorParseContextSchema<T>) => any | Promise<any>) | VigorEmptyType;
    maxRestarts: number;
};
declare const VigorParsePolicySettingsBase: {
    readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
    readonly debug: false;
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
    raw<const N extends VigorParseSchema<any>["policy"]["settings"]["raw"]>(bool: N): VigorApply<VigorParsePolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                raw: N;
            };
        };
    }>>;
    /** Sets the fallback value/factory used when parsing ultimately fails. */
    default<const N extends VigorExcludeEmpty<VigorParsePolicySettingsSchema<T>["default"]>>(func: N): VigorApply<VigorParsePolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                default: N;
            };
        };
    }>>;
    /** Sets the maximum number of full restarts allowed. */
    maxRestarts<const N extends VigorParseSchema<any>["policy"]["settings"]["maxRestarts"]>(num: N): VigorApply<VigorParsePolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                maxRestarts: N;
            };
        };
    }>>;
    /**
     * Turns timeline recording on or off (off by default). Off, the
     * `timeline` of `requestVerbose()` stays empty and no context snapshots
     * are taken, so it costs nothing unless you're debugging.
     */
    debug<const N extends VigorParseSchema<any>["policy"]["settings"]["debug"]>(bool: N): VigorApply<VigorParsePolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                debug: N;
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
        func: (ctx: VigorParseBeforeContextSchema<T>) => void | Promise<void>;
    };
    after: {
        _mode: "fluent";
        func: (ctx: VigorParseAfterContextSchema<T>) => void | Promise<void>;
    };
    onResult: {
        _mode: "fluent";
        func: (res: VigorParseOnResultContextSchema<T>["result"]) => VigorParseContextSchema<any>["result"] | Promise<VigorParseContextSchema<any>["result"]>;
    };
    onError: {
        _mode: "fluent";
        func: (err: VigorParseContextSchema<T>["error"]) => void | Promise<void>;
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
        func: (ctx: VigorParseOnResultContextSchema<T>, api: Pick<VigorParsePolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorParseContextSchema<any> | Promise<VigorParseContextSchema<any>>;
    };
    onError: {
        _mode: "intercept";
        func: (ctx: VigorParseOnErrorContextSchema<T>, api: Pick<VigorParsePolicyMiddlewaresApi<T>, "setResult" | "throwError" | "proceedRestart" | "cancelRestart">) => VigorParseContextSchema<any> | Promise<VigorParseContextSchema<any>>;
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
/** The result the success pipeline produces: the parsed one (or `.cast<T>()`'s), through `after` and `onResult`. */
type VigorParsePipeResult<T extends VigorParseSchema<T>> = VigorParseOnResultContextSchema<T>["result"];
/** `ctx.result` once the `onError` middlewares ran — what a recovered run (`setResult`) resolves to, as far as types go. */
type VigorParseErrorPipeResult<T extends VigorParseSchema<T>> = VigorParseOnErrorContextSchema<T>["result"];

/**
 * One recorded timeline entry: which `action` happened, its `content`, `now`,
 * the `Date.now()` timestamp it happened at (a number rather than a `Date`,
 * to keep entries light), and `ctx`, a snapshot of the context at that moment.
 * `E` maps each action name to its content; `C` is the snapshot's shape.
 */
type VigorTimelineItem<E, C> = {
    [K in keyof E]: {
        action: K;
        content: E[K];
        now: number;
        ctx: C;
    };
}[keyof E];
/**
 * How a request ended: `"result"` — the pipeline produced it; `"overridden"`
 * — `onError` set it with `setResult`; `"default"` — `settings.default`
 * produced it; `"failed"` — it failed.
 */
type VigorTimelineOutcome = "result" | "overridden" | "default" | "failed";
/** The `REQUEST_END` event every module records last. */
type VigorTimelineEndEvents = {
    /**
     * The request ended (after any restarts). `took` spans the whole call,
     * `restarts` counts the restarts it went through, and `error` is what it
     * failed with (`null` when it succeeded).
     */
    REQUEST_END: {
        success: boolean;
        outcome: VigorTimelineOutcome;
        took: number;
        restarts: number;
        error: unknown;
    };
};
/** The ordered list of everything a single `requestVerbose()` call went through. */
type VigorTimeline<E, C> = VigorTimelineItem<E, C>[];
/**
 * A context as stored on a timeline entry: everything but `timeline` itself,
 * which would otherwise nest every earlier entry inside each new one.
 */
type VigorTimelineSnapshot<Ctx> = Omit<Ctx, "timeline">;
/**
 * The `PROCESS_HANDLING` event shared by every module, for the run's own
 * lifecycle steps. `H` maps each step `type` to its `data`.
 */
type VigorTimelineProcessEvents<H> = {
    PROCESS_HANDLING: {
        [K in keyof H]: {
            type: K;
            data: H[K];
        };
    }[keyof H];
};
/**
 * Middleware-stage events shared by every module. `Stages` maps each stage
 * name to its middleware list, and `Apis` maps each stage to the intercept
 * API object its middlewares receive (`{}` for a stage without one).
 */
type VigorTimelineMiddlewareEvents<Stages extends Record<string, readonly unknown[]>, Apis extends {
    [S in keyof Stages]: object;
}> = {
    MIDDLEWARE_LOOP_STARTED: {
        [S in keyof Stages]: {
            stage: S;
            middlewares: Stages[S];
        };
    }[keyof Stages];
    MIDDLEWARE_LOOP_ENDED: {
        [S in keyof Stages]: {
            stage: S;
            middlewares: Stages[S];
            took: number;
        };
    }[keyof Stages];
    /**
     * One middleware of a stage ran. `index` is its position in the stage,
     * `internal` is `true` for one Vigor added itself (e.g. fetch's own
     * middlewares on its retry engine), and `error` is what it threw, when
     * `threw` is `true`.
     */
    MIDDLEWARE_RAN: {
        [S in keyof Stages]: {
            stage: S;
            index: number;
            middleware: Stages[S][number];
            internal: boolean;
            took: number;
            threw: boolean;
            error: unknown;
        };
    }[keyof Stages];
    MIDDLEWARE_API_CALLED: {
        [S in keyof Stages]: {
            [A in keyof Apis[S]]: {
                stage: S;
                index: number;
                middleware: Stages[S][number];
                internal: boolean;
                method: A;
                args: Apis[S][A] extends (...args: infer P) => any ? P : never;
            };
        }[keyof Apis[S]];
    }[keyof Stages];
};
/**
 * Marks a middleware function as one Vigor added itself (it's recorded with
 * `internal: true`). Returns the function unchanged.
 */
declare function markVigorInternal<F extends Function>(func: F): F;
/** Whether a middleware (an `{ _mode, func }` entry or a bare function) was marked with {@link markVigorInternal}. */
declare function isVigorInternalMiddleware(middleware: unknown): boolean;
/**
 * Creates the recorder a `requestRuntime()` writes into. Entries are pushed
 * straight onto `timeline`, so the same array keeps growing across restarts.
 * `snapshot` is called on every entry, so it must read the current context.
 * With `enabled` off (the default, until `settings.debug` is on) nothing is
 * recorded or snapshotted — middlewares still run.
 */
declare function createVigorTimelineRecorder<E, C>(timeline: VigorTimeline<E, C>, snapshot: () => C, enabled: boolean): {
    add: <K extends keyof E>(action: K, content: E[K]) => void;
    stage: <M>(stage: string, middlewares: readonly M[], run: (middleware: M, trace: <A extends object>(api: A) => A) => unknown) => Promise<void>;
};

type VigorParseTimelineStages = Omit<VigorParsePolicyMiddlewaresSchema<any>, "__brand">;
type VigorParseTimelineApis = {
    [S in keyof VigorParseTimelineStages]: Parameters<VigorParsePolicyMiddlewaresIntercept<any>[S]["func"]>[1];
};
/** Lifecycle steps recorded as `PROCESS_HANDLING`, mapped to their `data`. */
type VigorParseProcessHandler = {
    /** A run started. `restartAttempt` is `1` for the first run, and increases on every restart. */
    REQUEST_START: {
        restartAttempt: number;
    };
    /** The run failed, before `onError` runs. */
    REQUEST_ERROR: {
        error: unknown;
    };
    /** `onError` asked for a restart; the next run's entries follow. */
    REQUEST_RESTART: {
        restartAttempt: number;
    };
};
/** Every action a parse timeline can record, mapped to its content. */
type VigorParseTimelineEvents = VigorTimelineProcessEvents<VigorParseProcessHandler> & VigorTimelineMiddlewareEvents<VigorParseTimelineStages, VigorParseTimelineApis> & VigorTimelineEndEvents & {
    /** The body was read into bytes (or reused from the cache). */
    BODY_READ: {
        size: number;
        took: number;
    };
    STRATEGY_STARTED: {
        index: number;
    };
    STRATEGY_SUCCEEDED: {
        index: number;
        took: number;
    };
    STRATEGY_FAILED: {
        index: number;
        error: unknown;
        took: number;
    };
};
/** A parse context as stored on a timeline entry. */
type VigorParseTimelineSnapshot = VigorTimelineSnapshot<VigorParseContextSchema<any>>;
type VigorParseTimeline = VigorTimeline<VigorParseTimelineEvents, VigorParseTimelineSnapshot>;

/**
 * Base shape shared by every parse context variant. `R` is the type of
 * `result` at the point the context is observed — computed per pipeline
 * stage instead of being fixed on the schema. Threads the configured
 * middleware pipeline (see `./middlewares`) so fluent `after`/`onResult`
 * middlewares narrow the resolved type, taking priority from `.cast<T>()`
 * when set.
 */
type VigorParseContextSchema<T extends VigorParseSchema<T>, R = VigorParsePipeResult<T> | VigorDefaultType> = {
    __brand: VigorBrand<"Parse", "Context<Schema">;
    result: R;
    error: unknown;
    response: VigorParsePolicySchema<T>["target"];
    flags: {
        overridden: boolean;
        restarted: boolean;
    };
    record: Record<string, any>;
    /** Everything this `requestVerbose()` call has gone through so far, restarts included. */
    timeline: VigorParseTimeline;
    policy: T["policy"];
};
/** The result before any middleware: a `raw` parse's target, else `.cast<T>()`'s (`unknown` without one). */
type VigorParseNaturalResult<T extends VigorParseSchema<T>> = T["policy"]["settings"]["raw"] extends true ? VigorExcludeDefault<T["policy"]["target"]> : VigorCastResult<T["cast"], unknown>;
/**
 * Context seen by `before` middlewares — parsing hasn't run yet.
 *
 * Each stage's context is defined on its own — the runtime's view at that
 * point — with whatever the stage's earlier intercept middlewares changed by
 * returning a different context (see `VigorContextStage`).
 */
type VigorParseBeforeContextSchema<T extends VigorParseSchema<T>> = VigorContextStage<VigorParseContextSchema<T, VigorDefaultType>, T["policy"]["middlewares"]["before"]>;
/** Context seen by `after` middlewares — `result` is the parsed one; what `before` changed otherwise carries over. */
type VigorParseAfterContextSchema<T extends VigorParseSchema<T>> = VigorContextStage<VigorContextReset<VigorParseBeforeContextSchema<T>, {
    result: VigorParseNaturalResult<T>;
}>, T["policy"]["middlewares"]["after"]>;
/** Context seen by `onResult` middlewares — `ctx.result` is what the earlier `onResult` ones left it as. */
type VigorParseOnResultContextSchema<T extends VigorParseSchema<T>> = VigorContextStage<VigorParseAfterContextSchema<T>, T["policy"]["middlewares"]["onResult"], "result">;
/** Context seen by `onError` middlewares — every strategy failed (or a middleware threw). */
type VigorParseOnErrorContextSchema<T extends VigorParseSchema<T>> = VigorContextStage<VigorParseContextSchema<T>, T["policy"]["middlewares"]["onError"]>;
/** Context shape once the full middleware pipeline (including `onResult`) has run. */
type VigorParseResultContextSchema<T extends VigorParseSchema<T>> = VigorParseContextSchema<T, VigorParsePipeResult<T>>;
declare const VigorParseContextBase: {
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
        readonly overridden: false;
        readonly restarted: false;
    };
    readonly record: {};
    readonly timeline: VigorParseTimeline;
    readonly policy: {
        readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
        readonly target: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly settings: {
            readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
            readonly debug: false;
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

/**
 * The `error` of a failed result envelope: `E` is the module's own typed
 * errors, and `{} | null | undefined` stands for anything else that reached
 * the caller — an error thrown by your own target/middleware, an abort
 * reason, a network `TypeError`, even a bare `throw null`.
 *
 * Because of that tail, reading `error.code` directly doesn't compile. Narrow
 * first (`isVigorRetryError(err)`), and `code` then narrows `data` to that
 * code's payload.
 */
type VigorResultError<E> = E | {} | null | undefined;
/**
 * Constructor options. `T` is the context type for the error's code (see
 * {@link VigorErrorContext}): `context` is required when the code always
 * has one, optional when it may not, and must be left out when it never does.
 */
type VigorErrorOptions<D, T> = {
    cause?: unknown;
    data: D;
    method: string;
} & ([
    T
] extends [undefined] ? {
    context?: undefined;
} : undefined extends T ? {
    context?: T;
} : {
    context: T;
});
/**
 * The `context` type of error code `C`. A module lists the codes raised
 * where no run context exists: `None` never carry one (e.g. a parse strategy
 * failing on its own), `Optional` only sometimes (e.g. `VALUE_REQUIRED`,
 * also raised while building). Every other code always carries `Ctx`.
 */
type VigorErrorContext<C extends string, Ctx, Optional extends string = never, None extends string = never> = C extends None ? undefined : C extends Optional ? Ctx | undefined : Ctx;
/**
 * Base class for all Vigor error types. Subclasses (`VigorRetryError`,
 * `VigorFetchError`, `VigorParseError`, `VigorAllError`) fix `C`, `D`, and
 * `T` to their own error-code union, data shape, and context shape.
 *
 * @typeParam C - Union of error codes for the subclass.
 * @typeParam D - Shape of the structured error data.
 * @typeParam T - Type of `context` for code `C` (see {@link VigorErrorContext}).
 */
declare abstract class VigorError<C extends string, D, T = unknown> extends Error {
    readonly timestamp: Date;
    readonly cause?: unknown;
    readonly code: C;
    readonly data: D;
    readonly method: string;
    /** The run context when the error was raised; its presence depends on the code (see {@link VigorErrorContext}). */
    readonly context: T;
    /**
     * @param code - Machine-readable error code.
     * @param message - Human-readable message (rendered after the `[code]` prefix).
     * @param options - Additional error metadata (cause, data, method, context).
     */
    constructor(code: C, message: string, options: VigorErrorOptions<D, T>);
}
/**
 * Finds the first error in `error`'s chain that `match` accepts, from the
 * outside in: the error itself, then the error it wraps (`data.error` of
 * `RETRY_EXHAUSTED` / `RESTART_EXHAUSTED`), then its `cause`. Each wrapped
 * error is searched fully before moving on. Cycles are skipped.
 *
 * This is what the `find` of each `vigor.guards.*` uses, so a caller can ask
 * for the error that actually happened (e.g. `FETCH_FAILED`) without
 * unwrapping the retry layers by hand.
 */
declare function findInVigorErrorChain(error: unknown, match: (error: unknown) => boolean): unknown;

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
    readonly PARSER_ALL_FAILED: ({ tried, errors }: {
        tried: Array<string>;
        errors: Array<unknown>;
    }) => string;
    readonly RESTART_EXHAUSTED: ({ maxAttempts }: {
        maxAttempts: number;
        error: unknown;
    }) => string;
};
type VigorParseErrorCodes = keyof typeof VigorParseErrorMessageFuncs;
type VigorParseErrorDatas<C extends VigorParseErrorCodes> = Parameters<typeof VigorParseErrorMessageFuncs[C]> extends [infer A] ? A : undefined;
/**
 * Every parse error code as its own union member, so narrowing by `code`
 * also narrows `data` to that code's payload.
 */
type VigorParseErrors<T extends VigorParseSchema<any> = VigorParseSchema<any>> = {
    [C in VigorParseErrorCodes]: VigorParseError<C, T>;
}[VigorParseErrorCodes];
/**
 * `error` of a failed `requestVerbose()` — this module's errors, or anything else that was thrown.
 *
 * Typed with the request's own schema `T`, so `context` (and anything else
 * that depends on the config) is that request's, not a generic one.
 */
type VigorParseRequestError<T extends VigorParseSchema<any> = any> = VigorResultError<VigorParseErrors<T>>;
/** Codes that may be raised without a run context. */
type VigorParseErrorCodesWithOptionalContext = "PARSER_ALL_FAILED";
/** Codes that are never raised with a run context. */
type VigorParseErrorCodesWithoutContext = "INVALID_CONTENT_TYPE" | "PARSER_NOT_FOUND";
/**
 * The `context` of a `VigorParseError` with code `C`: the run context when
 * the code always has one, `| undefined` when it may not, `undefined` when
 * it never does. The strategies raise their errors on their own, with only the body: `INVALID_CONTENT_TYPE` and `PARSER_NOT_FOUND` never carry a context, and `PARSER_ALL_FAILED` only does when `request()` raises it (`VigorParseSniffStrategy` raises it too).
 */
type VigorParseErrorContext<C extends VigorParseErrorCodes, T extends VigorParseSchema<any> = any> = VigorErrorContext<C, VigorParseContextSchema<T>, VigorParseErrorCodesWithOptionalContext, VigorParseErrorCodesWithoutContext>;
/** Error type thrown by the parse module. */
declare class VigorParseError<C extends VigorParseErrorCodes, T extends VigorParseSchema<T>> extends VigorError<C, VigorParseErrorDatas<C>, VigorParseErrorContext<C, T>> {
    /**
     * @param code - One of the parse module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorParseErrorDatas<C>, VigorParseErrorContext<C, T>>);
}
/**
 * What `isVigorParseError` narrows `E` to: the typed `VigorParseError` members
 * already in `E` (so a `requestVerbose()` error keeps its request's
 * `context` type), limited to codes `C`. For an `unknown` input (a `catch`
 * binding, a `request()` rejection) there's no request to take types from,
 * so it's the generic `VigorParseErrors<any>`.
 */
type VigorParseErrorsIn<E, C extends VigorParseErrorCodes = VigorParseErrorCodes> = [
    Extract<E, VigorParseError<any, any>>
] extends [never] ? Extract<VigorParseErrors<any>, {
    code: C;
}> : Extract<Extract<E, VigorParseError<any, any>>, {
    code: C;
}>;
/**
 * Narrows an error from a failed result envelope to the parse module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 *
 * Pass one or more `codes` to also check the code: the error is then
 * narrowed to just those codes, so `data` is that code's payload right away.
 *
 * @example
 * if (isVigorParseError(error, "PARSER_NOT_FOUND")) {
 *     error.data // that code's payload
 * }
 */
declare function isVigorParseError<E>(error: E): error is E & VigorParseErrorsIn<E>;
declare function isVigorParseError<E, const C extends VigorParseErrorCodes>(error: E, ...codes: [C, ...C[]]): error is E & VigorParseErrorsIn<E, C>;
/**
 * Like `isVigorParseError(error, ...codes)`, but also looks inside the errors
 * `error` wraps — `data.error` of `RETRY_EXHAUSTED` / `RESTART_EXHAUSTED`,
 * then `cause` — and returns the first match, outermost first. Returns
 * `null` when there is none. `error` itself is left as it is.
 *
 * A guard can't do this: it narrows the value you pass, so a `true` for a
 * wrapped match would claim the wrapper has the inner error's `data`.
 *
 * @example
 * const notFound = findVigorParseError(error, "PARSER_NOT_FOUND")
 * if (notFound) notFound.data.expected
 */
declare function findVigorParseError<E, const C extends VigorParseErrorCodes>(error: E, ...codes: [C, ...C[]]): VigorParseErrorsIn<E, C> | null;

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
        readonly debug: false;
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
/** What `request()` resolves to: the pipeline's result, or what `settings.default` returns. */
type VigorParseResult<T extends VigorParseSchema<T>> = VigorExcludeDefault<VigorParseContextSchema<T>["result"]> | VigorExcludeDefault<VigorParseErrorPipeResult<T>> | VigorReturnType<T["policy"]["settings"]["default"]>;
/** The builder `T` becomes after merging `P` in (with strategy tree `S`). */
type VigorParseNext<T, P, S = undefined> = VigorApply<VigorParseTypeLambda, VigorDeepMerge<T, P, S>>;
declare const VigorParseBase: {
    readonly __brand: VigorBrand<"Parse", "Schema">;
    readonly policy: {
        readonly __brand: VigorBrand<"Parse", "Policy<Schema">;
        readonly target: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        };
        readonly settings: {
            readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
            readonly debug: false;
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
    target<const N extends VigorParseSchema<T>["policy"]["target"]>(response: N): VigorParseNext<T, {
        policy: {
            target: N;
        };
    }>;
    /** Configures the parse policy's general settings. */
    settings<const N extends VigorDeepPartial<VigorParsePolicySettingsSchema<T>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorParsePolicySettingsSchema<T>>>): VigorParseNext<T, {
        policy: {
            settings: N;
        };
    }>;
    settings<const B extends VigorParsePolicySettings<any>>(input: (s: VigorParsePolicySettings<T>) => B): VigorParseNext<T, {
        policy: {
            settings: B["config"]["policy"]["settings"];
        };
    }>;
    settings<const R extends VigorParseSchema<any>>(input: VigorParsePolicySettings<R>): VigorParseNext<T, {
        policy: {
            settings: R["policy"]["settings"];
        };
    }>;
    /** Configures the parse policy's middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorParsePolicyMiddlewaresSchema<T>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorParsePolicyMiddlewaresSchema<T>>>): VigorParseNext<T, {
        policy: {
            middlewares: N;
        };
    }>;
    /**
     * The callback's builder is typed as already holding this instance's
     * middlewares (so each new one sees the pipeline so far), while at
     * runtime it starts empty and its result is appended. Either way, its
     * type is the full list, so it replaces the current one.
     */
    middlewares<const B extends VigorParsePolicyMiddlewares<any>>(input: (s: VigorParsePolicyMiddlewares<T>) => B): VigorParseNext<T, {
        policy: {
            middlewares: B["config"]["policy"]["middlewares"];
        };
    }, {
        policy: {
            middlewares: "replace";
        };
    }>;
    middlewares<const R extends VigorParseSchema<any>>(input: VigorParsePolicyMiddlewares<R>): VigorParseNext<T, {
        policy: {
            middlewares: R["policy"]["middlewares"];
        };
    }>;
    /** Configures the parse policy's fallback chain of parsing strategies. */
    strategies<const N extends VigorDeepPartial<VigorParsePolicyStrategiesSchema<T>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorParsePolicyStrategiesSchema<T>>>): VigorParseNext<T, {
        policy: {
            strategies: N;
        };
    }>;
    strategies<const B extends VigorParsePolicyStrategies<any>>(input: (s: VigorParsePolicyStrategies<T>) => B): VigorParseNext<T, {
        policy: {
            strategies: B["config"]["policy"]["strategies"];
        };
    }>;
    strategies<const R extends VigorParseSchema<any>>(input: VigorParsePolicyStrategies<R>): VigorParseNext<T, {
        policy: {
            strategies: R["policy"]["strategies"];
        };
    }>;
    /**
     * Overrides the resolved result type with `T`, taking priority over the
     * default `unknown` result. Can be called before or after `strategies()`
     * (or any other configuration method); whichever `.cast<T>()` call
     * happens last wins.
     */
    cast<const C>(): VigorParseNext<T, {
        cast: C;
    }, {
        cast: "replace";
    }>;
    /**
     * Runs parsing and returns the result directly, throwing on final failure.
     *
     * `R` defaults to the inferred result type. Passing one (`request<User>()`)
     * means "ignore the inference, it's this": it's taken as-is, unchecked.
     * To name the inferred type itself, use `VigorResultOf<typeof builder>`.
     */
    request<R = VigorParseResult<T>>(): Promise<R>;
    /**
     * Runs parsing and returns a result/error envelope instead of throwing,
     * along with the `timeline` of everything the run went through.
     */
    requestVerbose<R = VigorParseResult<T>>(): Promise<{
        success: false;
        data: null;
        error: VigorParseRequestError<T>;
        timeline: VigorParseTimeline;
    } | {
        success: true;
        data: R;
        error: null;
        timeline: VigorParseTimeline;
    }>;
    /**
     * Internal execution loop implementing the strategy fallback and restart
     * handling. Never throws: every failure, including one from `onError` or
     * `default`, comes back as an envelope carrying the timeline. A restart
     * passes the same `timeline` on, so it keeps growing across runs.
     */
    private requestRuntime;
}

/**
 * A request|response body, read exactly once into raw bytes, plus the
 * metadata strategies need to interpret it. Every strategy in a chain gets
 * the same bytes, so a failed strategy never consumes anything.
 */
type VigorParseBody = {
    /** The raw body. Empty when there is no body. */
    bytes: Uint8Array<ArrayBuffer>;
    /** The `Content-Type` header, or `null` when absent. */
    contentType: string | null;
    /** The response status, or `null` when parsing a `Request`. */
    status: number | null;
    headers: Headers;
    /** The request|response the bytes were read from. Its body is already consumed. */
    source: Request | Response;
};
type VigorParseStrategyFunc = (body: VigorParseBody) => any | Promise<any>;
type VigorParsePolicyStrategiesSchema<T extends VigorParseSchema<T>> = {
    __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
    funcs: Array<VigorParseStrategyFunc>;
};
declare const VigorParsePolicyStrategiesBase: {
    readonly __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">;
    readonly funcs: VigorParseStrategyFunc[];
};
/**
 * Reads a request|response body into raw bytes — once. Later calls with the
 * same object return the cached bytes instead of reading the (now consumed)
 * stream again.
 */
declare function readVigorParseBody(source: Request | Response): Promise<VigorParseBody>;
/**
 * Parses a body by matching its `Content-Type` header against a known
 * parser table. An empty body (e.g. `204 No Content`) resolves to `null`,
 * one without a `Content-Type` is read as text, and one with a type the
 * table doesn't know (`application/pdf`, `application/zip`,
 * `application/x-ndjson`, ...) becomes a `Blob` carrying that type, rather
 * than failing a response that arrived fine.
 */
declare const VigorParseContentTypeStrategy: VigorParseStrategyFunc;
/**
 * Parses a body by trying JSON, then form data (for a form `Content-Type`),
 * then text (only if the bytes are valid in the declared charset), then
 * falling back to a `Blob`.
 */
declare const VigorParseSniffStrategy: VigorParseStrategyFunc;
/**
 * What adding strategies yields. `funcs` is a plain array, so appending and
 * replacing (`replace: true`) give the same type.
 */
type VigorParseStrategiesNext<T> = VigorApply<VigorParsePolicyStrategiesTypeLambda, VigorDeepMerge<T, {
    policy: {
        strategies: {
            funcs: VigorParseStrategyFunc[];
        };
    };
}>>;
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
    contentType(replace?: boolean): VigorParseStrategiesNext<T>;
    /** Adds the sniffing (try-each-format) parsing strategy. */
    sniff(replace?: boolean): VigorParseStrategiesNext<T>;
    /** Adds a strategy that always parses the body as JSON. */
    json(replace?: boolean): VigorParseStrategiesNext<T>;
    /** Adds a strategy that always parses the body as text, in its declared `charset`. */
    text(replace?: boolean): VigorParseStrategiesNext<T>;
    /** Adds a strategy that always parses the body as an `ArrayBuffer`. */
    arrayBuffer(replace?: boolean): VigorParseStrategiesNext<T>;
    /** Adds a strategy that always parses the body as a `Blob`. */
    blob(replace?: boolean): VigorParseStrategiesNext<T>;
    /** Adds a strategy that always parses the body as a `Uint8Array`. */
    bytes(replace?: boolean): VigorParseStrategiesNext<T>;
    /** Adds a strategy that always parses the body as `FormData` (`x-www-form-urlencoded` or `multipart/form-data`). */
    formData(replace?: boolean): VigorParseStrategiesNext<T>;
    /** Adds a user-supplied custom parsing strategy. It receives the body already read into bytes. */
    custom<const N extends VigorParseStrategyFunc>(func: N, replace?: boolean): VigorParseStrategiesNext<T>;
}

type VigorRetryPolicySettingsSchema<T extends VigorRetrySchema<T>> = {
    __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
    /**
     * Whether `requestVerbose()` records a timeline. Off by default: the
     * `timeline` stays empty and no context snapshots are taken.
     */
    debug: boolean;
    default: ((ctx: VigorRetryContextSchema<T>) => any | Promise<any>) | VigorEmptyType;
    maxAttempts: number;
    maxRestarts: number;
    timeout: number;
};
declare const VigorRetryPolicySettingsBase: {
    readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
    readonly debug: false;
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
    default<const N extends VigorExcludeEmpty<VigorRetryPolicySettingsSchema<T>["default"]>>(func: N): VigorApply<VigorRetryPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                default: N;
            };
        };
    }>>;
    /** Sets the maximum number of retry attempts before giving up. */
    maxAttempts<const N extends VigorRetrySchema<any>["policy"]["settings"]["maxAttempts"]>(num: N): VigorApply<VigorRetryPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                maxAttempts: N;
            };
        };
    }>>;
    /** Sets the maximum number of full restarts allowed. */
    maxRestarts<const N extends VigorRetrySchema<any>["policy"]["settings"]["maxRestarts"]>(num: N): VigorApply<VigorRetryPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                maxRestarts: N;
            };
        };
    }>>;
    /** Sets the timeout, in milliseconds, for a single attempt. */
    timeout<const N extends VigorRetrySchema<any>["policy"]["settings"]["timeout"]>(num: N): VigorApply<VigorRetryPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                timeout: N;
            };
        };
    }>>;
    /**
     * Turns timeline recording on or off (off by default). Off, the
     * `timeline` of `requestVerbose()` stays empty and no context snapshots
     * are taken, so it costs nothing unless you're debugging.
     */
    debug<const N extends VigorRetrySchema<any>["policy"]["settings"]["debug"]>(bool: N): VigorApply<VigorRetryPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                debug: N;
            };
        };
    }>>;
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
        func: (ctx: VigorRetryBeforeContextSchema<T>) => void | Promise<void>;
    };
    after: {
        _mode: "fluent";
        func: (ctx: VigorRetryAfterContextSchema<T>) => void | Promise<void>;
    };
    onResult: {
        _mode: "fluent";
        func: (res: VigorRetryOnResultContextSchema<T>["result"]) => VigorRetryContextSchema<any>["result"] | Promise<VigorRetryContextSchema<any>["result"]>;
    };
    retryIf: {
        _mode: "fluent";
        func: (err: VigorRetryContextSchema<T>["error"]) => VigorRetryContextSchema<any>["flags"]["doRetry"] | Promise<VigorRetryContextSchema<any>["flags"]["doRetry"]>;
    };
    onRetry: {
        _mode: "fluent";
        func: (err: VigorRetryContextSchema<T>["error"]) => void | Promise<void>;
    };
    onError: {
        _mode: "fluent";
        func: (err: VigorRetryContextSchema<T>["error"]) => void | Promise<void>;
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
        func: (ctx: VigorRetryOnResultContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>;
    };
    retryIf: {
        _mode: "intercept";
        func: (ctx: VigorRetryRetryIfContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "proceedRetry" | "cancelRetry">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>;
    };
    onRetry: {
        _mode: "intercept";
        func: (ctx: VigorRetryOnRetryContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "throwError" | "setDelay">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>;
    };
    onError: {
        _mode: "intercept";
        func: (ctx: VigorRetryOnErrorContextSchema<T>, api: Pick<VigorRetryPolicyMiddlewaresApi<T>, "setResult" | "throwError" | "proceedRestart" | "cancelRestart">) => VigorRetryContextSchema<any> | Promise<VigorRetryContextSchema<any>>;
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
/** The result the success pipeline produces: the target's (or `.cast<T>()`'s), through `after` and `onResult`. */
type VigorRetryPipeResult<T extends VigorRetrySchema<T>> = VigorRetryOnResultContextSchema<T>["result"];
/** `ctx.result` once the `onError` middlewares ran — what a recovered run (`setResult`) resolves to, as far as types go. */
type VigorRetryErrorPipeResult<T extends VigorRetrySchema<T>> = VigorRetryOnErrorContextSchema<T>["result"];

type VigorRetryTimelineStages = Omit<VigorRetryPolicyMiddlewaresSchema<any>, "__brand">;
type VigorRetryTimelineApis = {
    [S in keyof VigorRetryTimelineStages]: Parameters<VigorRetryPolicyMiddlewaresIntercept<any>[S]["func"]>[1];
};
/** Lifecycle steps recorded as `PROCESS_HANDLING`, mapped to their `data`. */
type VigorRetryProcessHandler = {
    /** A run started. `restartAttempt` is `1` for the first run, and increases on every restart. */
    REQUEST_START: {
        restartAttempt: number;
    };
    /** The run failed, before `onError` runs. */
    REQUEST_ERROR: {
        error: unknown;
    };
    /** `onError` asked for a restart; the next run's entries follow. */
    REQUEST_RESTART: {
        restartAttempt: number;
    };
    /** An attempt started. */
    RETRY_START: {
        attempt: number;
    };
    /**
     * An attempt failed (in a middleware, the target, or by timeout/abort).
     * `timedOut`: it hit `settings.timeout`; `aborted`: an external signal fired.
     */
    RETRY_ERROR: {
        attempt: number;
        error: unknown;
        timedOut: boolean;
        aborted: boolean;
    };
};
/**
 * Why a failed attempt was or wasn't retried: `"retry"` — it will be;
 * `"cancelled"` — `retryIf` decided against it (`cancelRetry()` or a
 * fluent `false`); `"breakRetry"` — a middleware called `breakRetry()`;
 * `"aborted"` — an external signal fired; `"exhausted"` — no attempts left.
 */
type VigorRetryDecisionReason = "retry" | "cancelled" | "breakRetry" | "aborted" | "exhausted";
/** Every action a retry timeline can record, mapped to its content. */
type VigorRetryTimelineEvents = VigorTimelineProcessEvents<VigorRetryProcessHandler> & VigorTimelineMiddlewareEvents<VigorRetryTimelineStages, VigorRetryTimelineApis> & VigorTimelineEndEvents & {
    ATTEMPT_INCREASED: {
        attempt: number;
    };
    TARGET_REQUEST_STARTED: {
        attempt: number;
    };
    TARGET_REQUEST_ENDED: {
        attempt: number;
        took: number;
    };
    /** What happens after a failed attempt, and why (see {@link VigorRetryDecisionReason}). */
    RETRY_DECISION: {
        attempt: number;
        retry: boolean;
        reason: VigorRetryDecisionReason;
    };
    /** The delay about to be awaited before the next attempt. */
    RETRY_DELAY: {
        attempt: number;
        delay: number;
    };
};
/** A retry context as stored on a timeline entry. */
type VigorRetryTimelineSnapshot = VigorTimelineSnapshot<VigorRetryContextSchema<any>>;
type VigorRetryTimeline = VigorTimeline<VigorRetryTimelineEvents, VigorRetryTimelineSnapshot>;

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
        /** `breakRetry()` was called: the attempt's error ends the run without retrying. */
        brokeRetry: boolean;
        /** An external abort signal fired: the run stops without retrying. */
        aborted: boolean;
        /** The current attempt hit `settings.timeout`. Reset at the start of every attempt. */
        timedOut: boolean;
        overridden: boolean;
    };
    record: Record<string, any>;
    /** Everything this `requestVerbose()` call has gone through so far, restarts included. */
    timeline: VigorRetryTimeline;
    policy: T["policy"];
};
/** The result before any middleware: `.cast<T>()`'s, else the target's return type. */
type VigorRetryNaturalResult<T extends VigorRetrySchema<T>> = VigorCastResult<T["cast"], VigorReturnType<T["policy"]["target"]>>;
/**
 * Context seen by `before` middlewares — the target hasn't run yet, so
 * there's no result.
 *
 * Each stage's context is defined on its own — the runtime's view at that
 * point — with whatever the stage's earlier intercept middlewares changed by
 * returning a different context (see `VigorContextStage`).
 */
type VigorRetryBeforeContextSchema<T extends VigorRetrySchema<T>> = VigorContextStage<VigorRetryContextSchema<T, VigorDefaultType>, T["policy"]["middlewares"]["before"]>;
/** Context seen by `after` middlewares — `result` is the target's; what `before` changed otherwise carries over. */
type VigorRetryAfterContextSchema<T extends VigorRetrySchema<T>> = VigorContextStage<VigorContextReset<VigorRetryBeforeContextSchema<T>, {
    result: VigorRetryNaturalResult<T>;
}>, T["policy"]["middlewares"]["after"]>;
/** Context seen by `onResult` middlewares — `ctx.result` is what the earlier `onResult` ones left it as. */
type VigorRetryOnResultContextSchema<T extends VigorRetrySchema<T>> = VigorContextStage<VigorRetryAfterContextSchema<T>, T["policy"]["middlewares"]["onResult"], "result">;
/** Context seen by `retryIf` middlewares — an attempt failed. */
type VigorRetryRetryIfContextSchema<T extends VigorRetrySchema<T>> = VigorContextStage<VigorRetryContextSchema<T>, T["policy"]["middlewares"]["retryIf"]>;
/** Context seen by `onRetry` middlewares — `retryIf` decided to retry. */
type VigorRetryOnRetryContextSchema<T extends VigorRetrySchema<T>> = VigorContextStage<VigorRetryRetryIfContextSchema<T>, T["policy"]["middlewares"]["onRetry"]>;
/** Context seen by `onError` middlewares — the run failed. */
type VigorRetryOnErrorContextSchema<T extends VigorRetrySchema<T>> = VigorContextStage<VigorRetryContextSchema<T>, T["policy"]["middlewares"]["onError"]>;
/** Context shape once the full middleware pipeline (including `onResult`) has run. */
type VigorRetryResultContextSchema<T extends VigorRetrySchema<T>> = VigorRetryContextSchema<T, VigorRetryPipeResult<T>>;
declare const VigorRetryContextBase: {
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
        readonly aborted: false;
        readonly timedOut: false;
        readonly overridden: false;
    };
    readonly record: {};
    readonly timeline: VigorRetryTimeline;
    readonly policy: {
        readonly __brand: VigorBrand<"Retry", "Policy<Schema">;
        readonly target: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
        readonly abortSignals: [];
        readonly settings: {
            readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
            readonly debug: false;
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
/**
 * Every retry error code as its own union member, so narrowing by `code`
 * also narrows `data` to that code's payload.
 */
type VigorRetryErrors<T extends VigorRetrySchema<any> = VigorRetrySchema<any>> = {
    [C in VigorRetryErrorCodes]: VigorRetryError<C, T>;
}[VigorRetryErrorCodes];
/**
 * `error` of a failed `requestVerbose()` — this module's errors, or anything else that was thrown.
 *
 * Typed with the request's own schema `T`, so `context` (and anything else
 * that depends on the config) is that request's, not a generic one.
 */
type VigorRetryRequestError<T extends VigorRetrySchema<any> = any> = VigorResultError<VigorRetryErrors<T>>;
/** Codes that may be raised without a run context. */
type VigorRetryErrorCodesWithOptionalContext = "VALUE_REQUIRED";
/** Codes that are never raised with a run context. */
type VigorRetryErrorCodesWithoutContext = never;
/**
 * The `context` of a `VigorRetryError` with code `C`: the run context when
 * the code always has one, `| undefined` when it may not, `undefined` when
 * it never does. `VALUE_REQUIRED` is also raised by the `custom` algorithm when it has no target, outside a run.
 */
type VigorRetryErrorContext<C extends VigorRetryErrorCodes, T extends VigorRetrySchema<any> = any> = VigorErrorContext<C, VigorRetryContextSchema<T>, VigorRetryErrorCodesWithOptionalContext, VigorRetryErrorCodesWithoutContext>;
/** Error type thrown by the retry module. */
declare class VigorRetryError<C extends VigorRetryErrorCodes, T extends VigorRetrySchema<T>> extends VigorError<C, VigorRetryErrorDatas<C>, VigorRetryErrorContext<C, T>> {
    /**
     * @param code - One of the retry module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorRetryErrorDatas<C>, VigorRetryErrorContext<C, T>>);
}
/**
 * What `isVigorRetryError` narrows `E` to: the typed `VigorRetryError` members
 * already in `E` (so a `requestVerbose()` error keeps its request's
 * `context` type), limited to codes `C`. For an `unknown` input (a `catch`
 * binding, a `request()` rejection) there's no request to take types from,
 * so it's the generic `VigorRetryErrors<any>`.
 */
type VigorRetryErrorsIn<E, C extends VigorRetryErrorCodes = VigorRetryErrorCodes> = [
    Extract<E, VigorRetryError<any, any>>
] extends [never] ? Extract<VigorRetryErrors<any>, {
    code: C;
}> : Extract<Extract<E, VigorRetryError<any, any>>, {
    code: C;
}>;
/**
 * Narrows an error from a failed result envelope to the retry module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 *
 * Pass one or more `codes` to also check the code: the error is then
 * narrowed to just those codes, so `data` is that code's payload right away.
 *
 * @example
 * if (isVigorRetryError(error, "TIMED_OUT")) {
 *     error.data // that code's payload
 * }
 */
declare function isVigorRetryError<E>(error: E): error is E & VigorRetryErrorsIn<E>;
declare function isVigorRetryError<E, const C extends VigorRetryErrorCodes>(error: E, ...codes: [C, ...C[]]): error is E & VigorRetryErrorsIn<E, C>;
/**
 * Like `isVigorRetryError(error, ...codes)`, but also looks inside the errors
 * `error` wraps — `data.error` of `RETRY_EXHAUSTED` / `RESTART_EXHAUSTED`,
 * then `cause` — and returns the first match, outermost first. Returns
 * `null` when there is none. `error` itself is left as it is.
 *
 * A guard can't do this: it narrows the value you pass, so a `true` for a
 * wrapped match would claim the wrapper has the inner error's `data`.
 *
 * @example
 * const timedOut = findVigorRetryError(error, "TIMED_OUT")
 * if (timedOut) timedOut.data.limit
 */
declare function findVigorRetryError<E, const C extends VigorRetryErrorCodes>(error: E, ...codes: [C, ...C[]]): VigorRetryErrorsIn<E, C> | null;

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
        readonly debug: false;
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
/** What `request()` resolves to: the pipeline's result, or what `settings.default` returns. */
type VigorRetryResult<T extends VigorRetrySchema<T>> = VigorExcludeDefault<VigorRetryContextSchema<T>["result"]> | VigorExcludeDefault<VigorRetryErrorPipeResult<T>> | VigorReturnType<T["policy"]["settings"]["default"]>;
/** The builder `T` becomes after merging `P` in (with strategy tree `S`). */
type VigorRetryNext<T, P, S = undefined> = VigorApply<VigorRetryTypeLambda, VigorDeepMerge<T, P, S>>;
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
            readonly debug: false;
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
    target<const N extends VigorExcludeEmpty<VigorRetrySchema<T>["policy"]["target"]>>(func: N): VigorRetryNext<T, {
        policy: {
            target: N;
        };
    }>;
    /** Sets external abort signals that, when aborted, stop retrying. */
    abortSignals<const N extends VigorRetrySchema<T>["policy"]["abortSignals"]>(...sig: N): VigorRetryNext<T, {
        policy: {
            abortSignals: N;
        };
    }>;
    /** Configures the retry policy's general settings (max attempts, timeout, etc). */
    settings<const N extends VigorDeepPartial<VigorRetryPolicySettingsSchema<T>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorRetryPolicySettingsSchema<T>>>): VigorRetryNext<T, {
        policy: {
            settings: N;
        };
    }>;
    settings<const B extends VigorRetryPolicySettings<any>>(input: (s: VigorRetryPolicySettings<T>) => B): VigorRetryNext<T, {
        policy: {
            settings: B["config"]["policy"]["settings"];
        };
    }>;
    settings<const R extends VigorRetrySchema<any>>(input: VigorRetryPolicySettings<R>): VigorRetryNext<T, {
        policy: {
            settings: R["policy"]["settings"];
        };
    }>;
    /** Configures the retry policy's middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorRetryPolicyMiddlewaresSchema<T>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorRetryPolicyMiddlewaresSchema<T>>>): VigorRetryNext<T, {
        policy: {
            middlewares: N;
        };
    }>;
    /**
     * The callback's builder is typed as already holding this instance's
     * middlewares (so each new one sees the pipeline so far), while at
     * runtime it starts empty and its result is appended. Either way, its
     * type is the full list, so it replaces the current one.
     */
    middlewares<const B extends VigorRetryPolicyMiddlewares<any>>(input: (s: VigorRetryPolicyMiddlewares<T>) => B): VigorRetryNext<T, {
        policy: {
            middlewares: B["config"]["policy"]["middlewares"];
        };
    }, {
        policy: {
            middlewares: "replace";
        };
    }>;
    middlewares<const R extends VigorRetrySchema<any>>(input: VigorRetryPolicyMiddlewares<R>): VigorRetryNext<T, {
        policy: {
            middlewares: R["policy"]["middlewares"];
        };
    }>;
    /** Configures the retry policy's delay algorithm. */
    algorithms<const N extends VigorDeepPartial<VigorRetryPolicyAlgorithmsSchema<T>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorRetryPolicyAlgorithmsSchema<T>>>): VigorRetryNext<T, {
        policy: {
            algorithms: N;
        };
    }, {
        policy: {
            algorithms: "replace";
        };
    }>;
    algorithms<const B extends VigorRetryPolicyAlgorithms<any>>(input: (a: VigorRetryPolicyAlgorithms<T>) => B): VigorRetryNext<T, {
        policy: {
            algorithms: B["config"]["policy"]["algorithms"];
        };
    }, {
        policy: {
            algorithms: "replace";
        };
    }>;
    /**
     * Overrides the resolved result type with `T`, taking priority over the
     * type naturally inferred from `target()`. Can be called before or after
     * `target()` (or any other configuration method); whichever `.cast<T>()`
     * call happens last wins.
     */
    cast<const C>(): VigorRetryNext<T, {
        cast: C;
    }, {
        cast: "replace";
    }>;
    /**
     * Runs the target and returns its result directly, throwing on final failure.
     *
     * `R` defaults to the inferred result type. Passing one (`request<User>()`)
     * means "ignore the inference, it's this": it's taken as-is, unchecked.
     * To name the inferred type itself, use `VigorResultOf<typeof builder>`.
     */
    request<R = VigorRetryResult<T>>(): Promise<R>;
    /**
     * Runs the target and returns a result/error envelope instead of throwing,
     * along with the `timeline` of everything the run went through.
     */
    requestVerbose<R = VigorRetryResult<T>>(): Promise<{
        success: false;
        data: null;
        error: VigorRetryRequestError<T>;
        timeline: VigorRetryTimeline;
    } | {
        success: true;
        data: R;
        error: null;
        timeline: VigorRetryTimeline;
    }>;
    /**
     * Internal execution loop implementing the attempt/retry/restart lifecycle.
     * Never throws: every failure, including one from `onError` or `default`,
     * comes back as an envelope carrying the timeline. A restart passes the
     * same `timeline` on, so it keeps growing across runs; `startedAt` is the
     * first run's start, for `REQUEST_END`'s `took`.
     */
    private requestRuntime;
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
    jitter<const N extends VigorRetryPolicyAlgorithmsConstantSchema<any>["jitter"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsConstantTypeLambda, VigorDeepMerge<T, {
        jitter: N;
    }>>;
    /** Sets the fixed delay interval, in milliseconds. */
    interval<const N extends VigorRetryPolicyAlgorithmsConstantSchema<any>["interval"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsConstantTypeLambda, VigorDeepMerge<T, {
        interval: N;
    }>>;
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
    jitter<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["jitter"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsLinearTypeLambda, VigorDeepMerge<T, {
        jitter: N;
    }>>;
    /** Sets the initial delay, in milliseconds, before the first retry. */
    initial<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["initial"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsLinearTypeLambda, VigorDeepMerge<T, {
        initial: N;
    }>>;
    /** Sets how much the delay grows, in milliseconds, per attempt. */
    increment<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["increment"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsLinearTypeLambda, VigorDeepMerge<T, {
        increment: N;
    }>>;
    /** Sets the minimum allowed delay, in milliseconds. */
    minDelay<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["minDelay"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsLinearTypeLambda, VigorDeepMerge<T, {
        minDelay: N;
    }>>;
    /** Sets the maximum allowed delay, in milliseconds. */
    maxDelay<const N extends VigorRetryPolicyAlgorithmsLinearSchema<any>["maxDelay"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsLinearTypeLambda, VigorDeepMerge<T, {
        maxDelay: N;
    }>>;
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
    jitter<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["jitter"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsBackoffTypeLambda, VigorDeepMerge<T, {
        jitter: N;
    }>>;
    /** Sets the initial delay, in milliseconds, before backoff growth is applied. */
    initial<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["initial"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsBackoffTypeLambda, VigorDeepMerge<T, {
        initial: N;
    }>>;
    /** Sets the exponential growth factor applied per attempt. */
    multiplier<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["multiplier"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsBackoffTypeLambda, VigorDeepMerge<T, {
        multiplier: N;
    }>>;
    /** Sets the base unit, in milliseconds, the multiplier is scaled by. */
    unit<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["unit"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsBackoffTypeLambda, VigorDeepMerge<T, {
        unit: N;
    }>>;
    /** Sets the minimum allowed delay, in milliseconds. */
    minDelay<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["minDelay"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsBackoffTypeLambda, VigorDeepMerge<T, {
        minDelay: N;
    }>>;
    /** Sets the maximum allowed delay, in milliseconds. */
    maxDelay<const N extends VigorRetryPolicyAlgorithmsBackoffSchema<any>["maxDelay"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsBackoffTypeLambda, VigorDeepMerge<T, {
        maxDelay: N;
    }>>;
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
    jitter<const N extends VigorRetryPolicyAlgorithmsCustomSchema<any>["jitter"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsCustomTypeLambda, VigorDeepMerge<T, {
        jitter: N;
    }>>;
    /** Sets the minimum allowed delay, in milliseconds. */
    minDelay<const N extends VigorRetryPolicyAlgorithmsCustomSchema<any>["minDelay"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsCustomTypeLambda, VigorDeepMerge<T, {
        minDelay: N;
    }>>;
    /** Sets the maximum allowed delay, in milliseconds. */
    maxDelay<const N extends VigorRetryPolicyAlgorithmsCustomSchema<any>["maxDelay"]>(num: N): VigorApply<VigorRetryPolicyAlgorithmsCustomTypeLambda, VigorDeepMerge<T, {
        maxDelay: N;
    }>>;
    /** Sets the user-supplied function computing the raw delay for an attempt. */
    target<const N extends VigorExcludeEmpty<VigorRetryPolicyAlgorithmsCustomSchema<any>["target"]>>(func: N): VigorApply<VigorRetryPolicyAlgorithmsCustomTypeLambda, VigorDeepMerge<T, {
        target: N;
    }>>;
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
    constant<const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsConstantSchema<any>, "_tag" | "__brand">> = {}>(input?: N & VigorNoExtraKeys<N, VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsConstantSchema<any>, "_tag" | "__brand">>>): VigorApply<VigorRetryPolicyAlgorithmsTypeLambda, VigorDeepMerge<T, {
        policy: {
            algorithms: VigorDeepMerge<typeof VigorRetryPolicyAlgorithmsConstantBase, N>;
        };
    }, {
        policy: {
            algorithms: "replace";
        };
    }>>;
    /** Switches to the linearly-increasing delay algorithm. */
    linear<const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsLinearSchema<any>, "_tag" | "__brand">> = {}>(input?: N & VigorNoExtraKeys<N, VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsLinearSchema<any>, "_tag" | "__brand">>>): VigorApply<VigorRetryPolicyAlgorithmsTypeLambda, VigorDeepMerge<T, {
        policy: {
            algorithms: VigorDeepMerge<typeof VigorRetryPolicyAlgorithmsLinearBase, N>;
        };
    }, {
        policy: {
            algorithms: "replace";
        };
    }>>;
    /** Switches to the exponential-backoff delay algorithm. */
    backoff<const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsBackoffSchema<any>, "_tag" | "__brand">> = {}>(input?: N & VigorNoExtraKeys<N, VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsBackoffSchema<any>, "_tag" | "__brand">>>): VigorApply<VigorRetryPolicyAlgorithmsTypeLambda, VigorDeepMerge<T, {
        policy: {
            algorithms: VigorDeepMerge<typeof VigorRetryPolicyAlgorithmsBackoffBase, N>;
        };
    }, {
        policy: {
            algorithms: "replace";
        };
    }>>;
    /** Switches to a user-supplied custom delay algorithm. */
    custom<const N extends VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsCustomSchema<any>, "_tag" | "__brand">> = {}>(input?: N & VigorNoExtraKeys<N, VigorDeepPartial<Omit<VigorRetryPolicyAlgorithmsCustomSchema<any>, "_tag" | "__brand">>>): VigorApply<VigorRetryPolicyAlgorithmsTypeLambda, VigorDeepMerge<T, {
        policy: {
            algorithms: VigorDeepMerge<typeof VigorRetryPolicyAlgorithmsCustomBase, N>;
        };
    }, {
        policy: {
            algorithms: "replace";
        };
    }>>;
}

type VigorAllPolicySettingsSchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Policy<Settings<Schema">;
    /**
     * Whether `requestVerbose()` records a timeline. Off by default: the
     * `timeline` stays empty and no context snapshots are taken.
     */
    debug: boolean;
    concurrency: number;
    onlySuccess: boolean;
    /** Per-task timeout in milliseconds. `VigorEmpty` (the default), `0`, a negative value, or `Infinity` disables it. */
    timeout: number | VigorEmptyType;
    /** When `true`, the first task failure (not recovered by `onErrorEach`) aborts the remaining tasks and fails the batch. */
    failFast: boolean;
};
declare const VigorAllPolicySettingsBase: {
    readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
    readonly debug: false;
    readonly concurrency: 5;
    readonly onlySuccess: false;
    readonly timeout: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
    readonly failFast: false;
};
/** Immutable builder for an all-policy's general settings. */
declare class VigorAllPolicySettings<T extends VigorAllSchema<T> = typeof VigorAllBase> extends VigorStatus<VigorAllSchema<any>, T, VigorAllPolicySettingsTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorAllPolicySettingsTypeLambda, C>;
    /** Sets the maximum number of tasks run concurrently. */
    concurrency<const N extends VigorAllSchema<any>["policy"]["settings"]["concurrency"]>(num: N): VigorApply<VigorAllPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                concurrency: N;
            };
        };
    }>>;
    /** When enabled, filters the final result down to only the tasks that succeeded. */
    onlySuccess<const N extends VigorAllSchema<any>["policy"]["settings"]["onlySuccess"]>(bool: N): VigorApply<VigorAllPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                onlySuccess: N;
            };
        };
    }>>;
    /** Sets the per-task timeout, in milliseconds. A task exceeding it fails with `TIMED_OUT`. */
    timeout<const N extends VigorExcludeEmpty<VigorAllSchema<any>["policy"]["settings"]["timeout"]>>(num: N): VigorApply<VigorAllPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                timeout: N;
            };
        };
    }>>;
    /** When enabled, the first unrecovered task failure aborts the remaining tasks and fails the batch with that error. */
    failFast<const N extends VigorAllSchema<any>["policy"]["settings"]["failFast"]>(bool: N): VigorApply<VigorAllPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                failFast: N;
            };
        };
    }>>;
    /**
     * Turns timeline recording on or off (off by default). Off, the
     * `timeline` of `requestVerbose()` stays empty and no context snapshots
     * are taken, so it costs nothing unless you're debugging.
     */
    debug<const N extends VigorAllSchema<any>["policy"]["settings"]["debug"]>(bool: N): VigorApply<VigorAllPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                debug: N;
            };
        };
    }>>;
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

/** Per-task hook (`beforeEach` / `afterEach`) — observes/mutates a single task's context, no return value. */
type VigorAllEachMiddlewareFn = (ctx: VigorAllEachContextSchema<any>) => void | Promise<void>;
/** Per-task failure hook (`onErrorEach`) — can override the task's outcome via `api.setResult`. */
type VigorAllEachOnErrorFn = (ctx: VigorAllEachContextSchema<any>, api: {
    setResult: (r: unknown) => void;
}) => void | Promise<void>;
type VigorAllPolicyMiddlewaresSchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
    /** Batch-level: runs once before any task starts. */
    before: (VigorAllPolicyMiddlewaresFluent<T>["before"] | VigorAllPolicyMiddlewaresIntercept<T>["before"])[];
    /** Batch-level: runs once after every task has settled. */
    after: (VigorAllPolicyMiddlewaresFluent<T>["after"] | VigorAllPolicyMiddlewaresIntercept<T>["after"])[];
    /** Batch-level: transforms/validates the aggregate result. */
    onResult: (VigorAllPolicyMiddlewaresFluent<T>["onResult"] | VigorAllPolicyMiddlewaresIntercept<T>["onResult"])[];
    /** Per-task: runs before each individual task is invoked. */
    beforeEach: VigorAllEachMiddlewareFn[];
    /** Per-task: runs after each individual task settles successfully. */
    afterEach: VigorAllEachMiddlewareFn[];
    /** Per-task: runs when an individual task fails. */
    onErrorEach: VigorAllEachOnErrorFn[];
};
declare const VigorAllPolicyMiddlewaresBase: {
    readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
    readonly before: [];
    readonly after: [];
    readonly onResult: [];
    readonly beforeEach: [];
    readonly afterEach: [];
    readonly onErrorEach: [];
};
type VigorAllPolicyMiddlewaresFluent<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Policy<Middlewares<Fluent<Schema">;
    before: {
        _mode: "fluent";
        func: (ctx: VigorAllBeforeContextSchema<T>) => void | Promise<void>;
    };
    after: {
        _mode: "fluent";
        func: (ctx: VigorAllAfterContextSchema<T>) => void | Promise<void>;
    };
    onResult: {
        _mode: "fluent";
        func: (res: VigorAllOnResultContextSchema<T>["result"]) => VigorAllContextSchema<any>["result"] | Promise<VigorAllContextSchema<any>["result"]>;
    };
};
type VigorAllPolicyMiddlewaresApi<T extends VigorAllSchema<T>> = {
    setResult: (res: VigorAllContextSchema<any>["result"]) => void;
    throwError: (err: unknown) => void;
};
type VigorAllPolicyMiddlewaresIntercept<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Policy<Middlewares<Intercept<Schema">;
    before: {
        _mode: "intercept";
        func: (ctx: VigorAllBeforeContextSchema<T>, api: Pick<VigorAllPolicyMiddlewaresApi<T>, "throwError">) => VigorAllContextSchema<any> | Promise<VigorAllContextSchema<any>>;
    };
    after: {
        _mode: "intercept";
        func: (ctx: VigorAllAfterContextSchema<T>, api: Pick<VigorAllPolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorAllContextSchema<any> | Promise<VigorAllContextSchema<any>>;
    };
    onResult: {
        _mode: "intercept";
        func: (ctx: VigorAllOnResultContextSchema<T>, api: Pick<VigorAllPolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorAllContextSchema<any> | Promise<VigorAllContextSchema<any>>;
    };
};
/**
 * Immutable builder for an all-policy's middleware pipeline. Batch-level
 * stages (`before`, `after`, `onResult`) run once for the whole request and
 * accept either "fluent" middleware (returns a plain value merged into the
 * context) or "intercept" middleware (receives an explicit API to mutate
 * control flow). Per-task stages (`beforeEach`, `afterEach`, `onErrorEach`)
 * run once per task and are plain observer/mutator callbacks — there's no
 * batch-level `onError`, since the batch runs its tasks `allSettled`-style
 * and never fails because an individual task did.
 */
declare class VigorAllPolicyMiddlewares<T extends VigorAllSchema<T> = typeof VigorAllBase> extends VigorStatus<VigorAllSchema<any>, T, VigorAllPolicyMiddlewaresTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, C>;
    /** Registers a middleware that runs once before any task starts. */
    before<const N extends VigorAllPolicyMiddlewaresFluent<T>["before"]["func"]>(type: "fluent", func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                before: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    before<const N extends VigorAllPolicyMiddlewaresIntercept<T>["before"]["func"]>(type: "intercept", func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                before: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware that runs once after every task has settled. */
    after<const N extends VigorAllPolicyMiddlewaresFluent<T>["after"]["func"]>(type: "fluent", func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                after: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    after<const N extends VigorAllPolicyMiddlewaresIntercept<T>["after"]["func"]>(type: "intercept", func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                after: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware that transforms or validates the aggregate result. */
    onResult<const N extends VigorAllPolicyMiddlewaresFluent<T>["onResult"]["func"]>(type: "fluent", func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onResult: [{
                    _mode: "fluent";
                    func: N;
                }];
            };
        };
    }>>;
    onResult<const N extends VigorAllPolicyMiddlewaresIntercept<T>["onResult"]["func"]>(type: "intercept", func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onResult: [{
                    _mode: "intercept";
                    func: N;
                }];
            };
        };
    }>>;
    /** Registers a middleware that runs before each task is invoked. */
    beforeEach<const N extends VigorAllEachMiddlewareFn>(func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                beforeEach: [N];
            };
        };
    }>>;
    /** Registers a middleware that runs after each task settles successfully. */
    afterEach<const N extends VigorAllEachMiddlewareFn>(func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                afterEach: [N];
            };
        };
    }>>;
    /** Registers a middleware that runs when an individual task fails. */
    onErrorEach<const N extends VigorAllEachOnErrorFn>(func: N): VigorApply<VigorAllPolicyMiddlewaresTypeLambda, VigorDeepMerge<T, {
        policy: {
            middlewares: {
                onErrorEach: [N];
            };
        };
    }>>;
}
/** The result the batch-level pipeline produces: the tasks' outcomes (or `.cast<T>()`'s), through `after` and `onResult`. */
type VigorAllPipeResult<T extends VigorAllSchema<T>> = VigorAllOnResultContextSchema<T>["result"];

declare const VigorAllErrorMessageFuncs: {
    readonly EMPTY_TARGET: (_: {}) => string;
    readonly TIMED_OUT: ({ limit, index }: {
        limit: number;
        index: number;
    }) => string;
};
type VigorAllErrorCodes = keyof typeof VigorAllErrorMessageFuncs;
type VigorAllErrorDatas<C extends VigorAllErrorCodes> = Parameters<typeof VigorAllErrorMessageFuncs[C]> extends [infer A] ? A : undefined;
/**
 * Every all error code as its own union member, so narrowing by `code`
 * also narrows `data` to that code's payload.
 */
type VigorAllErrors<T extends VigorAllSchema<any> = VigorAllSchema<any>> = {
    [C in VigorAllErrorCodes]: VigorAllError<C, T>;
}[VigorAllErrorCodes];
/**
 * `error` of a failed `requestVerbose()` — this module's errors, or anything else that was thrown (e.g. a task's error under `failFast`).
 *
 * Typed with the request's own schema `T`, so `context` (and anything else
 * that depends on the config) is that request's, not a generic one.
 */
type VigorAllRequestError<T extends VigorAllSchema<any> = any> = VigorResultError<VigorAllErrors<T>>;
/** Codes that may be raised without a run context. */
type VigorAllErrorCodesWithOptionalContext = never;
/** Codes that are never raised with a run context. */
type VigorAllErrorCodesWithoutContext = "TIMED_OUT";
/**
 * The `context` of a `VigorAllError` with code `C`: the run context when
 * the code always has one, `| undefined` when it may not, `undefined` when
 * it never does. `TIMED_OUT` is raised for a single task (`data.index` says which), not with the batch context.
 */
type VigorAllErrorContext<C extends VigorAllErrorCodes, T extends VigorAllSchema<any> = any> = VigorErrorContext<C, VigorAllContextSchema<T>, VigorAllErrorCodesWithOptionalContext, VigorAllErrorCodesWithoutContext>;
/** Error type thrown by the all module. */
declare class VigorAllError<C extends VigorAllErrorCodes, T extends VigorAllSchema<T>> extends VigorError<C, VigorAllErrorDatas<C>, VigorAllErrorContext<C, T>> {
    /**
     * @param code - One of the all module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorAllErrorDatas<C>, VigorAllErrorContext<C, T>>);
}
/**
 * What `isVigorAllError` narrows `E` to: the typed `VigorAllError` members
 * already in `E` (so a `requestVerbose()` error keeps its request's
 * `context` type), limited to codes `C`. For an `unknown` input (a `catch`
 * binding, a `request()` rejection) there's no request to take types from,
 * so it's the generic `VigorAllErrors<any>`.
 */
type VigorAllErrorsIn<E, C extends VigorAllErrorCodes = VigorAllErrorCodes> = [
    Extract<E, VigorAllError<any, any>>
] extends [never] ? Extract<VigorAllErrors<any>, {
    code: C;
}> : Extract<Extract<E, VigorAllError<any, any>>, {
    code: C;
}>;
/**
 * Narrows an error from a failed result envelope to the all module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 *
 * Pass one or more `codes` to also check the code: the error is then
 * narrowed to just those codes, so `data` is that code's payload right away.
 *
 * @example
 * if (isVigorAllError(error, "TIMED_OUT")) {
 *     error.data // that code's payload
 * }
 */
declare function isVigorAllError<E>(error: E): error is E & VigorAllErrorsIn<E>;
declare function isVigorAllError<E, const C extends VigorAllErrorCodes>(error: E, ...codes: [C, ...C[]]): error is E & VigorAllErrorsIn<E, C>;
/**
 * Like `isVigorAllError(error, ...codes)`, but also looks inside the errors
 * `error` wraps — `data.error` of `RETRY_EXHAUSTED` / `RESTART_EXHAUSTED`,
 * then `cause` — and returns the first match, outermost first. Returns
 * `null` when there is none. `error` itself is left as it is.
 *
 * A guard can't do this: it narrows the value you pass, so a `true` for a
 * wrapped match would claim the wrapper has the inner error's `data`.
 *
 * @example
 * const timedOut = findVigorAllError(error, "TIMED_OUT")
 * if (timedOut) timedOut.data.index
 */
declare function findVigorAllError<E, const C extends VigorAllErrorCodes>(error: E, ...codes: [C, ...C[]]): VigorAllErrorsIn<E, C> | null;

/**
 * A single task. It receives an `AbortSignal` that fires when the task's
 * `timeout` elapses, the batch's `abortSignals` abort, or `failFast` stops
 * the batch — tasks that ignore it keep running in the background, but
 * their result is discarded.
 */
type VigorAllTask = (signal: AbortSignal) => unknown | Promise<unknown>;
/** Extracts (and unwraps `Promise`/`Awaited`) the result type of a single task. */
type VigorAllTaskResult<F> = F extends (...args: any[]) => infer R ? Awaited<R> : never;
/**
 * Maps a tuple of tasks to a tuple of their (awaited) result types, in the
 * same order and length as `N`. If `N` isn't a literal tuple (e.g. the
 * default, unconfigured `target`), this degrades to a plain array type.
 */
type VigorAllTasksTuple<N extends readonly VigorAllTask[]> = {
    [K in keyof N]: VigorAllTaskResult<N[K]>;
};
type VigorAllPolicySchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Policy<Schema">;
    target: VigorAllTask[];
    abortSignals: AbortSignal[];
    settings: VigorAllPolicySettingsSchema<T>;
    middlewares: VigorAllPolicyMiddlewaresSchema<T>;
};
declare const VigorAllPolicyBase: {
    readonly __brand: VigorBrand<"All", "Policy<Schema">;
    readonly target: [];
    readonly abortSignals: [];
    readonly settings: {
        readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
        readonly debug: false;
        readonly concurrency: 5;
        readonly onlySuccess: false;
        readonly timeout: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
        readonly failFast: false;
    };
    readonly middlewares: {
        readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
        readonly before: [];
        readonly after: [];
        readonly onResult: [];
        readonly beforeEach: [];
        readonly afterEach: [];
        readonly onErrorEach: [];
    };
};
/**
 * What a failed task's slot holds as `error`: whatever the task threw, or
 * `VigorAllError("TIMED_OUT")` when it hit `settings.timeout`.
 */
type VigorAllTaskError = VigorResultError<VigorAllError<"TIMED_OUT", any>>;
/**
 * One task's outcome, shaped like `requestVerbose()`'s envelope: what it
 * returned (or what `onErrorEach` recovered it with), or what it failed with.
 */
type VigorAllSettled<V> = {
    success: true;
    data: V;
    error: null;
} | {
    success: false;
    data: null;
    error: VigorAllTaskError;
};
/**
 * The naturally-inferred (pre-`.cast<T>()`) result type of `.request()`.
 * When `onlySuccess` is left `false` (the default), every task gets its own
 * tuple slot holding its outcome — `.target(() => 1 as const, () => "a")`
 * infers `[VigorAllSettled<1>, VigorAllSettled<"a">]` — so a failed task
 * can't pass for a result. `onlySuccess: true` keeps only the successful
 * tasks' values, at runtime an arbitrary length, so it becomes an array of
 * the tasks' result types (`(1 | "a")[]`). A non-literal `boolean` could be
 * either, so it gives the union of both.
 */
type VigorAllNaturalResult<T extends VigorAllSchema<T>> = T["policy"]["target"] extends readonly VigorAllTask[] ? VigorAllResultFor<T["policy"]["settings"]["onlySuccess"], VigorAllTasksTuple<T["policy"]["target"]>> : unknown[];
/** Distributes over `boolean`, so a non-literal `onlySuccess` yields both shapes. */
type VigorAllResultFor<OnlySuccess, Tuple extends readonly unknown[]> = OnlySuccess extends true ? Tuple[number][] : {
    [K in keyof Tuple]: VigorAllSettled<Tuple[K]>;
};

type VigorAllTimelineStages = Omit<VigorAllPolicyMiddlewaresSchema<any>, "__brand">;
type VigorAllTimelineApis = {
    [S in "before" | "after" | "onResult"]: Parameters<VigorAllPolicyMiddlewaresIntercept<any>[S]["func"]>[1];
} & {
    beforeEach: {};
    afterEach: {};
    onErrorEach: {
        setResult: (r: unknown) => void;
    };
};
/** Lifecycle steps recorded as `PROCESS_HANDLING`, mapped to their `data`. */
type VigorAllProcessHandler = {
    REQUEST_START: {
        tasks: number;
        concurrency: number;
    };
    /** The batch failed. */
    REQUEST_ERROR: {
        error: unknown;
    };
};
/** Every action an all timeline can record, mapped to its content. */
type VigorAllTimelineEvents = VigorTimelineProcessEvents<VigorAllProcessHandler> & VigorTimelineMiddlewareEvents<VigorAllTimelineStages, VigorAllTimelineApis> & VigorTimelineEndEvents & {
    TASK_STARTED: {
        index: number;
    };
    /** A task settled. `success` is `false` only when it failed and `onErrorEach` didn't recover it. */
    TASK_ENDED: {
        index: number;
        success: boolean;
        took: number;
    };
    /** A task threw (including `TIMED_OUT`), before `onErrorEach` runs. */
    TASK_ERROR: {
        index: number;
        error: unknown;
    };
};
/**
 * A context as stored on a timeline entry: the batch context, or for the
 * per-task actions (`TASK_*` and the `*Each` stages) that task's context.
 */
type VigorAllTimelineSnapshot = VigorTimelineSnapshot<VigorAllContextSchema<any>> | VigorAllEachContextSchema<any>;
type VigorAllTimeline = VigorTimeline<VigorAllTimelineEvents, VigorAllTimelineSnapshot>;

/**
 * Base shape shared by every batch-level `all` context variant. `R` is the
 * type of `result` at the point the context is observed — computed per
 * pipeline stage instead of being fixed on the schema.
 */
type VigorAllContextSchema<T extends VigorAllSchema<T>, R = VigorAllPipeResult<T> | VigorDefaultType> = {
    __brand: VigorBrand<"All", "Context<Schema">;
    result: R;
    policy: T["policy"];
    record: Record<string, any>;
    /** Everything this `requestVerbose()` call has gone through so far. */
    timeline: VigorAllTimeline;
};
/** The result before any batch-level middleware: `.cast<T>()`'s, else the tasks' outcomes. */
type VigorAllCastNaturalResult<T extends VigorAllSchema<T>> = VigorCastResult<T["cast"], VigorAllNaturalResult<T>>;
/**
 * Context seen by `before` middlewares — no task has run yet.
 *
 * Each stage's context is defined on its own — the runtime's view at that
 * point — with whatever the stage's earlier intercept middlewares changed by
 * returning a different context (see `VigorContextStage`).
 */
type VigorAllBeforeContextSchema<T extends VigorAllSchema<T>> = VigorContextStage<VigorAllContextSchema<T, VigorDefaultType>, T["policy"]["middlewares"]["before"]>;
/** Context seen by `after` middlewares — every task has settled; what `before` changed otherwise carries over. */
type VigorAllAfterContextSchema<T extends VigorAllSchema<T>> = VigorContextStage<VigorContextReset<VigorAllBeforeContextSchema<T>, {
    result: VigorAllCastNaturalResult<T>;
}>, T["policy"]["middlewares"]["after"]>;
/** Context seen by `onResult` middlewares — `ctx.result` is what the earlier `onResult` ones left it as. */
type VigorAllOnResultContextSchema<T extends VigorAllSchema<T>> = VigorContextStage<VigorAllAfterContextSchema<T>, T["policy"]["middlewares"]["onResult"], "result">;
/** Context shape once the full batch-level pipeline (`before`/`after`/`onResult`) has run. */
type VigorAllResultContextSchema<T extends VigorAllSchema<T>> = VigorAllContextSchema<T, VigorAllPipeResult<T>>;
declare const VigorAllContextBase: {
    readonly __brand: VigorBrand<"All", "Context<Schema">;
    readonly result: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Default">;
    };
    readonly policy: {
        readonly __brand: VigorBrand<"All", "Policy<Schema">;
        readonly target: [];
        readonly abortSignals: [];
        readonly settings: {
            readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
            readonly debug: false;
            readonly concurrency: 5;
            readonly onlySuccess: false;
            readonly timeout: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly failFast: false;
        };
        readonly middlewares: {
            readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
            readonly before: [];
            readonly after: [];
            readonly onResult: [];
            readonly beforeEach: [];
            readonly afterEach: [];
            readonly onErrorEach: [];
        };
    };
    readonly record: {};
    readonly timeline: VigorAllTimeline;
};
/** Per-task context, seen by `beforeEach` / `afterEach` / `onErrorEach`. */
type VigorAllEachContextSchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "EachContext<Schema">;
    /** Position of this task in the `target` list. */
    index: number;
    result: unknown | VigorDefaultType;
    error: unknown;
    flags: {
        overridden: boolean;
    };
    record: Record<string, any>;
};
declare const VigorAllEachContextBase: {
    readonly __brand: VigorBrand<"All", "EachContext<Schema">;
    readonly index: 0;
    readonly result: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Default">;
    };
    readonly error: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Default">;
    };
    readonly flags: {
        readonly overridden: false;
    };
    readonly record: {};
};

type VigorAllSchema<T extends VigorAllSchema<T>> = {
    __brand: VigorBrand<"All", "Schema">;
    policy: VigorAllPolicySchema<T>;
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown;
};
/** What `request()` resolves to. */
type VigorAllResult<T extends VigorAllSchema<T>> = VigorExcludeDefault<VigorAllContextSchema<T>["result"]>;
/** The builder `T` becomes after merging `P` in (with strategy tree `S`). */
type VigorAllNext<T, P, S = undefined> = VigorApply<VigorAllTypeLambda, VigorDeepMerge<T, P, S>>;
declare const VigorAllBase: {
    readonly __brand: VigorBrand<"All", "Schema">;
    readonly policy: {
        readonly __brand: VigorBrand<"All", "Policy<Schema">;
        readonly target: [];
        readonly abortSignals: [];
        readonly settings: {
            readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
            readonly debug: false;
            readonly concurrency: 5;
            readonly onlySuccess: false;
            readonly timeout: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly failFast: false;
        };
        readonly middlewares: {
            readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
            readonly before: [];
            readonly after: [];
            readonly onResult: [];
            readonly beforeEach: [];
            readonly afterEach: [];
            readonly onErrorEach: [];
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
    target<const N extends VigorAllTask[]>(...funcs: N): VigorAllNext<T, {
        policy: {
            target: N;
        };
    }>;
    /** Sets external abort signals that, when aborted, cancel the remaining tasks and fail the batch. */
    abortSignals<const N extends VigorAllSchema<T>["policy"]["abortSignals"]>(...sig: N): VigorAllNext<T, {
        policy: {
            abortSignals: N;
        };
    }>;
    /** Configures the all-policy's general settings (concurrency, onlySuccess). */
    settings<const N extends VigorDeepPartial<VigorAllPolicySettingsSchema<T>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorAllPolicySettingsSchema<T>>>): VigorAllNext<T, {
        policy: {
            settings: N;
        };
    }>;
    settings<const B extends VigorAllPolicySettings<any>>(input: (s: VigorAllPolicySettings<T>) => B): VigorAllNext<T, {
        policy: {
            settings: B["config"]["policy"]["settings"];
        };
    }>;
    settings<const R extends VigorAllSchema<any>>(input: VigorAllPolicySettings<R>): VigorAllNext<T, {
        policy: {
            settings: R["policy"]["settings"];
        };
    }>;
    /** Configures the all-policy's per-task middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorAllPolicyMiddlewaresSchema<T>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorAllPolicyMiddlewaresSchema<T>>>): VigorAllNext<T, {
        policy: {
            middlewares: N;
        };
    }>;
    /**
     * The callback's builder is typed as already holding this instance's
     * middlewares (so each new one sees the pipeline so far), while at
     * runtime it starts empty and its result is appended. Either way, its
     * type is the full list, so it replaces the current one.
     */
    middlewares<const B extends VigorAllPolicyMiddlewares<any>>(input: (s: VigorAllPolicyMiddlewares<T>) => B): VigorAllNext<T, {
        policy: {
            middlewares: B["config"]["policy"]["middlewares"];
        };
    }, {
        policy: {
            middlewares: "replace";
        };
    }>;
    middlewares<const R extends VigorAllSchema<any>>(input: VigorAllPolicyMiddlewares<R>): VigorAllNext<T, {
        policy: {
            middlewares: R["policy"]["middlewares"];
        };
    }>;
    /** Runs a single task through the beforeEach/afterEach/onErrorEach middleware pipeline. */
    private _runTask;
    /**
     * Overrides the resolved result type with `T`, taking priority over the
     * naturally-inferred `unknown[]`. Can be called before or after
     * `target()` (or any other configuration method); whichever `.cast<T>()`
     * call happens last wins.
     */
    cast<const C>(): VigorAllNext<T, {
        cast: C;
    }, {
        cast: "replace";
    }>;
    /**
     * Runs all tasks and returns the results array directly, throwing on final failure.
     *
     * `R` defaults to the inferred result type. Passing one (`request<User>()`)
     * means "ignore the inference, it's this": it's taken as-is, unchecked.
     * To name the inferred type itself, use `VigorResultOf<typeof builder>`.
     */
    request<R = VigorAllResult<T>>(): Promise<R>;
    /**
     * Runs all tasks and returns a result/error envelope instead of throwing,
     * along with the `timeline` of everything the batch went through.
     */
    requestVerbose<R = VigorAllResult<T>>(): Promise<{
        success: false;
        data: null;
        error: VigorAllRequestError<T>;
        timeline: VigorAllTimeline;
    } | {
        success: true;
        data: R;
        error: null;
        timeline: VigorAllTimeline;
    }>;
    /** Internal execution loop implementing the bounded-concurrency worker pool and the batch-level before/after/onResult pipeline. */
    private requestRuntime;
}

type VigorFetchPolicySettingsSchema<T extends VigorFetchSchema<T>> = {
    __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
    /**
     * Whether `requestVerbose()` records a timeline. Off by default: the
     * `timeline` stays empty and no context snapshots are taken. With it
     * on, the nested retry/parse engines record theirs too.
     */
    debug: boolean;
    retryHeaders: string[];
    unretryStatus: number[];
    /**
     * Upper bound, in milliseconds, on a server-suggested retry delay read
     * from `retryHeaders`. Longer values are clamped to it.
     */
    maxRetryAfter: number;
    /**
     * When `true`, a response that was redirected (or a readable `3xx` with a
     * `Location` header) navigates the page to its target via
     * `window.location.href`. Outside a browser (no `window.location`) this
     * does nothing, exactly like `false` (the default).
     */
    redirect: boolean;
    /**
     * When `true` (the default), the request URL must stay inside the origin
     * it was built from: the same domain, and within the origin's path. A
     * `.path()` segment like `".."` that would climb out of it — e.g. user
     * input landing in `.path("users", id)` — fails the request with
     * `PATH_ESCAPED` instead of sending it. `..` that stays inside is fine.
     */
    confinePath: boolean;
    maxRestarts: number;
    default: ((ctx: VigorFetchContextSchema<T>) => any | Promise<any>) | VigorEmptyType;
};
declare const VigorFetchPolicySettingsBase: {
    readonly __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
    readonly debug: false;
    readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"];
    readonly unretryStatus: [400, 401, 402, 403, 404, 405, 406, 407, 409, 410, 411, 412, 413, 414, 415, 416, 417, 422, 424, 426, 428, 431, 451, 501, 505, 506, 508, 510, 511];
    readonly maxRetryAfter: number;
    readonly redirect: false;
    readonly confinePath: true;
    readonly maxRestarts: 3;
    readonly default: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
};
/** Immutable builder for a fetch policy's general settings. */
declare class VigorFetchPolicySettings<T extends VigorFetchSchema<T> = typeof VigorFetchBase> extends VigorStatus<VigorFetchSchema<any>, T, VigorFetchPolicySettingsTypeLambda> {
    constructor(config?: T);
    protected _create<C>(config: C): VigorApply<VigorFetchPolicySettingsTypeLambda, C>;
    /** Sets (replaces) the response headers consulted to compute a server-suggested retry delay. */
    retryHeaders<const N extends VigorFetchSchema<any>["policy"]["settings"]["retryHeaders"]>(...strs: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                retryHeaders: N;
            };
        };
    }, {
        policy: {
            settings: {
                retryHeaders: "replace";
            };
        };
    }>>;
    /** Sets (replaces) the HTTP status codes that should never be retried. */
    unretryStatus<const N extends VigorFetchSchema<any>["policy"]["settings"]["unretryStatus"]>(...nums: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                unretryStatus: N;
            };
        };
    }, {
        policy: {
            settings: {
                unretryStatus: "replace";
            };
        };
    }>>;
    /** Sets the upper bound, in milliseconds, on a server-suggested retry delay. */
    maxRetryAfter<const N extends VigorFetchSchema<any>["policy"]["settings"]["maxRetryAfter"]>(num: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                maxRetryAfter: N;
            };
        };
    }>>;
    /**
     * When enabled, a redirected response (or a readable `3xx` with a
     * `Location` header) navigates the page to its target
     * (`window.location.href`). Without `window.location` — e.g. in Node —
     * this behaves like `false`.
     */
    /**
     * When enabled (the default), a request whose URL would leave its
     * origin's domain or path (e.g. through a `".."` path segment) fails with
     * `PATH_ESCAPED` instead of being sent.
     */
    confinePath<const N extends VigorFetchSchema<any>["policy"]["settings"]["confinePath"]>(bool: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                confinePath: N;
            };
        };
    }>>;
    redirect<const N extends VigorFetchSchema<any>["policy"]["settings"]["redirect"]>(bool: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                redirect: N;
            };
        };
    }>>;
    /** Sets the maximum number of full restarts allowed. */
    maxRestarts<const N extends VigorFetchSchema<any>["policy"]["settings"]["maxRestarts"]>(num: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                maxRestarts: N;
            };
        };
    }>>;
    /** Sets the fallback value/factory used when the request ultimately fails. */
    default<const N extends VigorExcludeEmpty<VigorFetchPolicySettingsSchema<T>["default"]>>(func: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                default: N;
            };
        };
    }>>;
    /**
     * Turns timeline recording on or off (off by default). Off, the
     * `timeline` of `requestVerbose()` stays empty and no context snapshots
     * are taken, so it costs nothing unless you're debugging. With it on,
     * the nested retry/parse engines record theirs too.
     */
    debug<const N extends VigorFetchSchema<any>["policy"]["settings"]["debug"]>(bool: N): VigorApply<VigorFetchPolicySettingsTypeLambda, VigorDeepMerge<T, {
        policy: {
            settings: {
                debug: N;
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
        readonly debug: false;
        readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"];
        readonly unretryStatus: [400, 401, 402, 403, 404, 405, 406, 407, 409, 410, 411, 412, 413, 414, 415, 416, 417, 422, 424, 426, 428, 431, 451, 501, 505, 506, 508, 510, 511];
        readonly maxRetryAfter: number;
        readonly redirect: false;
        readonly confinePath: true;
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
                readonly debug: false;
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
                readonly debug: false;
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

/** The HTTP methods a route key can start with. */
type VigorApiMethod = NonNullable<VigorFetchOptions["method"]>;
/** A route key: `"<METHOD> /<path>"`, where a `:name` segment is a path parameter. */
type VigorApiRouteKey = `${VigorApiMethod} /${string}`;
/** A whole status class as a `responses` key: `"4xx"` stands for every `4xx` status not listed on its own. */
type VigorApiStatusClass = "2xx" | "3xx" | "4xx" | "5xx";
type VigorDigit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
/** `"404"` → `404`, per member of a union. */
type VigorToNumber<S> = S extends `${infer N extends number}` ? N : never;
/** Every status of a class: `VigorHttpStatusOf<"4">` is `400 | 401 | … | 499`. */
type VigorHttpStatusOf<H extends "2" | "3" | "4" | "5"> = VigorToNumber<`${H}${VigorDigit}${VigorDigit}`>;
/** The statuses a request succeeds with, as at runtime: every `2xx`, and `304 Not Modified`. */
type VigorHttpSuccessStatus = VigorHttpStatusOf<"2"> | 304;
/** The statuses a request fails with `FETCH_FAILED` for: every other `3xx`, `4xx` and `5xx`. */
type VigorHttpFailureStatus = Exclude<VigorHttpStatusOf<"3">, 304> | VigorHttpStatusOf<"4"> | VigorHttpStatusOf<"5">;
/** A path parameter's value, as `.route()` takes it. */
type VigorApiParamValue = Exclude<VigorStringable, null | undefined>;
/**
 * One route's description. Every key is optional:
 *
 * - `responses` — the parsed body per status: an exact status (`200`,
 *   `404`) or a whole class (`"4xx"`). Success statuses (`2xx`, `304`) are
 *   what the request resolves to; the others type `FETCH_FAILED`'s
 *   `data.parsed`, narrowed by `data.status`.
 * - `response` — shorthand for `responses: { "2xx": ... }`.
 * - `params` — the type of each `:name` segment's value in `.route()`.
 * - `query` — the query `.query()` must add up to.
 * - `body` — the body the request must carry (optional when it allows `undefined`).
 *
 * `query` and `body` are checked when the request is sent: `request()` /
 * `requestVerbose()` don't compile on a request that doesn't match.
 */
type VigorApiRoute = {
    response?: unknown;
    responses?: {
        [status: number]: unknown;
    } & {
        [C in VigorApiStatusClass]?: unknown;
    };
    params?: {
        [name: string]: VigorApiParamValue;
    };
    query?: object;
    body?: unknown;
};
/** `responses` keys must be statuses (`404` or `"404"`) or status classes (`"4xx"`). */
type VigorApiRouteCheck<R> = R extends {
    responses: infer S;
} ? VigorApiRoute & {
    responses: {
        [K in keyof S]: K extends number | `${number}` | VigorApiStatusClass ? unknown : never;
    };
} : VigorApiRoute;
/**
 * Validates an API map: every key must be a {@link VigorApiRouteKey} and
 * every value a {@link VigorApiRoute}. Used as `M extends VigorApiMap<M>`.
 *
 * @example
 * type Api = {
 *     "GET /users": { response: User[], query: { page?: number } }
 *     "GET /users/:id": {
 *         params: { id: number }
 *         responses: { 200: User, 404: { error: "not_found" }, "5xx": { message: string } }
 *     }
 *     "POST /users": { body: { name: string }, responses: { 201: User, 422: { fields: Record<string, string> } } }
 * }
 */
type VigorApiMap<M> = {
    [K in keyof M]: K extends VigorApiRouteKey ? VigorApiRouteCheck<M[K]> : never;
};
/**
 * What `.apiMap<M>()` stores on the schema: the map, and the path segments
 * already set when it was called, which every route is relative to.
 */
type VigorApiMapSlot<M, Base extends readonly string[]> = {
    map: M;
    base: Base;
};
/** One `.path()` argument as the string segment it becomes at runtime. */
type VigorPathSegment<V> = V extends Date ? string : V extends string | number | bigint | boolean ? `${V}` : string;
/**
 * The path list `.path(...N)` stores: each argument stringified, with
 * `null`/`undefined` dropped like at runtime. An argument that may or may
 * not be dropped makes the length unknown, so the list becomes `string[]`.
 */
type VigorPathList<N extends readonly unknown[]> = N extends readonly [infer H, ...infer R] ? [H] extends [null | undefined] ? VigorPathList<R> : null extends H ? string[] : undefined extends H ? string[] : [VigorPathSegment<H>, ...VigorPathList<R>] : number extends N["length"] ? string[] : [];
/** Splits a path string on `/`, dropping empty segments (`"/a//b/"` → `["a", "b"]`). */
type VigorSplitPath<P extends string> = P extends `${infer H}/${infer R}` ? [...(H extends "" ? [] : [H]), ...VigorSplitPath<R>] : P extends "" ? [] : [P];
/**
 * The URL path segments a stored path list produces: a literal entry is split
 * on `/` like `_buildUrl` does, a non-literal one (`string`, `` `${number}` ``)
 * stays one unknown segment. A non-tuple list can't be matched, so it stays
 * `string[]`.
 */
type VigorPathSegments<Path> = Path extends readonly [infer H extends string, ...infer R] ? [...(string extends H ? [string] : VigorSplitPath<H>), ...VigorPathSegments<R>] : Path extends readonly [] ? [] : string[];
/** `A` without its first `B["length"]` elements. */
type VigorDropPrefix<A extends readonly string[], B extends readonly string[]> = B extends readonly [any, ...infer BR extends string[]] ? A extends readonly [any, ...infer AR extends string[]] ? VigorDropPrefix<AR, BR> : string[] : A;
/** Whether route segments `R` match actual segments `A`. */
type VigorMatchSegments<R extends readonly string[], A extends readonly string[]> = R extends readonly [infer RH, ...infer RT extends string[]] ? A extends readonly [infer AH, ...infer AT extends string[]] ? RH extends `:${string}` ? VigorMatchSegments<RT, AT> : [AH] extends [RH] ? VigorMatchSegments<RT, AT> : false : false : A extends readonly [] ? true : false;
type VigorRouteCandidate = {
    key: string;
    segs: readonly string[];
};
/** The routes of `M` for `Method` whose path matches `A`. */
type VigorRouteCandidates<M, Method, A extends readonly string[]> = {
    [K in keyof M & string]: K extends `${infer RM} /${infer RP}` ? [RM] extends [Method] ? VigorMatchSegments<VigorSplitPath<RP>, A> extends true ? {
        key: K;
        segs: VigorSplitPath<RP>;
    } : never : never : never;
}[keyof M & string];
type VigorStaticHead<C> = C extends {
    segs: readonly [infer H, ...any];
} ? H extends `:${string}` ? never : C : never;
type VigorDropHead<C> = C extends {
    key: infer K;
    segs: readonly [any, ...infer R extends string[]];
} ? {
    key: K;
    segs: R;
} : never;
/**
 * Picks the most specific of the matching routes, segment by segment from
 * the left: where some candidate has a static segment, the parameter ones
 * drop out (`/users/me` beats `/users/:id`), like a router does.
 */
type VigorMostSpecific<C extends VigorRouteCandidate> = [
    C
] extends [{
    segs: readonly [];
}] ? C["key"] : VigorMostSpecific<VigorDropHead<[VigorStaticHead<C>] extends [never] ? C : VigorStaticHead<C>>>;
/** Marks "no route matched", so the caller can fall back to another type. Type-only. */
type VigorApiNoMatchType = {
    readonly __brand: "@vigor-fetch:::Fetch <- ApiNoMatch";
};
/** A route the request matched: its key and its description. */
type VigorApiMatch<K = string, R = unknown> = {
    key: K;
    route: R;
};
/** The route `A` matches, per possible `A`. */
type VigorApiMatchFor<M, Method, A> = A extends readonly string[] ? number extends A["length"] ? VigorApiNoMatchType : [VigorRouteCandidates<M, Method, A>] extends [never] ? VigorApiNoMatchType : VigorMostSpecific<VigorRouteCandidates<M, Method, A>> extends infer K ? K extends keyof M ? VigorApiMatch<K, M[K]> : VigorApiNoMatchType : never : VigorApiNoMatchType;
/**
 * The route of the API map in `Slot` that a request with `Method` and stored
 * path list `Path` matches, or `VigorApiNoMatchType`. A union path (e.g.
 * `.path(kind)` with `kind: "a" | "b"`) gives a union of matches.
 */
type VigorApiMatched<Slot, Method, Path> = Slot extends VigorApiMapSlot<infer M, infer Base> ? VigorApiMatchFor<M, Method, VigorDropPrefix<VigorPathSegments<Path>, VigorPathSegments<Base>>> : VigorApiNoMatchType;
/** A route's `responses`, with `response` as the `"2xx"` entry it's shorthand for (unless `responses` has one). */
type VigorApiResponsesOf<R> = (R extends {
    responses: infer S;
} ? S : {}) extends infer S ? R extends {
    response: infer X;
} ? "2xx" extends keyof S ? S : S & {
    "2xx": X;
} : S : never;
/** The exact statuses listed in `responses` (`200` and `"200"` alike). */
type VigorApiListedStatus<S> = VigorToNumber<`${keyof S & (number | `${number}`)}`>;
/** The entry for exact status `N`, whether it was written `404` or `"404"`. */
type VigorApiResponseAt<S, N extends number> = N extends keyof S ? S[N] : `${N}` extends keyof S ? S[`${N}` & keyof S] : never;
/** The statuses status class `C` stands for in `S`: the class, minus the ones listed on their own. */
type VigorApiClassStatus<S, C extends VigorApiStatusClass> = C extends `${infer H extends "2" | "3" | "4" | "5"}xx` ? Exclude<VigorHttpStatusOf<H>, VigorApiListedStatus<S>> : never;
/**
 * The success outcomes of a route, as `{ status, data }` per status: the
 * listed `2xx`/`304` entries, `"2xx"` for the other `2xx`, and `"3xx"` for
 * an unlisted `304`. Undeclared success statuses aren't modeled — a route
 * that declares none gives `{ status: number, data: VigorApiNoMatchType }`,
 * so the parse engine's type is used.
 */
type VigorApiSuccessOf<S> = {
    [N in VigorApiListedStatus<S> & VigorHttpSuccessStatus]: {
        status: N;
        data: VigorApiResponseAt<S, N>;
    };
}[VigorApiListedStatus<S> & VigorHttpSuccessStatus] | ("2xx" extends keyof S ? {
    status: VigorApiClassStatus<S, "2xx">;
    data: S["2xx" & keyof S];
} : never) | ("3xx" extends keyof S ? 304 extends VigorApiListedStatus<S> ? never : {
    status: 304;
    data: S["3xx" & keyof S];
} : never) extends infer V ? [V] extends [never] ? {
    status: number;
    data: VigorApiNoMatchType;
} : V : never;
/**
 * The failure outcomes of a route, as `{ status, parsed }` per status: the
 * listed failure entries, each declared class for its remaining statuses,
 * and every status left over with `parsed: unknown` — so narrowing on
 * `status` always lands on the right `parsed`. `parsed` is `undefined` when
 * the failed body couldn't be parsed. A route that declares no failures
 * gives a single `{ status: number, parsed: unknown }`.
 */
type VigorApiFailureOf<S> = {
    [N in VigorApiListedStatus<S> & VigorHttpFailureStatus]: {
        status: N;
        parsed: VigorApiResponseAt<S, N> | undefined;
    };
}[VigorApiListedStatus<S> & VigorHttpFailureStatus] | {
    [C in keyof S & ("3xx" | "4xx" | "5xx")]: {
        status: Exclude<VigorApiClassStatus<S, C>, 304>;
        parsed: S[C] | undefined;
    };
}[keyof S & ("3xx" | "4xx" | "5xx")] extends infer V ? [V] extends [never] ? {
    status: number;
    parsed: unknown;
} : V | VigorApiUnlistedFailure<S> : never;
/** The failure statuses `S` covers neither on their own nor by class, with `parsed: unknown`. */
type VigorApiUnlistedFailure<S> = Exclude<VigorHttpFailureStatus, VigorApiListedStatus<S> | VigorApiClassStatus<S, keyof S & ("3xx" | "4xx" | "5xx")>> extends infer N ? [N] extends [never] ? never : {
    status: N;
    parsed: unknown;
} : never;
/**
 * The success outcomes, `{ status, data }`, of the route a request matches;
 * `{ status: number, data: VigorApiNoMatchType }` where none does.
 */
type VigorApiSuccess<Slot, Method, Path> = VigorApiMatched<Slot, Method, Path> extends infer X ? X extends VigorApiMatch<any, infer R> ? VigorApiSuccessOf<VigorApiResponsesOf<R>> : {
    status: number;
    data: VigorApiNoMatchType;
} : never;
/**
 * The failure outcomes, `{ status, parsed }`, of the route a request
 * matches; `{ status: number, parsed: unknown }` where none does.
 */
type VigorApiFailure<Slot, Method, Path> = VigorApiMatched<Slot, Method, Path> extends infer X ? X extends VigorApiMatch<any, infer R> ? VigorApiFailureOf<VigorApiResponsesOf<R>> : {
    status: number;
    parsed: unknown;
} : never;
/**
 * The response type the API map gives a request with `Method` and stored
 * path list `Path` — the union of its route's success responses — or
 * `VigorApiNoMatchType` when no route matches.
 */
type VigorApiResponse<Slot, Method, Path> = VigorApiSuccess<Slot, Method, Path>["data"];
/** The route of key `K` in the API map stored in `Slot`, or `{}`. */
type VigorApiRouteOf<Slot, K> = Slot extends VigorApiMapSlot<infer M, any> ? K extends keyof M ? M[K] : {} : {};
/**
 * What `request()`'s `this` becomes when the request doesn't match its route:
 * the compiler reports this type, so its keys spell out what's wrong.
 */
type VigorApiRequestIssue<Key, Problem extends string, Expected, Received> = {
    readonly "vigor-fetch: the request doesn't match its apiMap route": `${Key & string} — ${Problem}`;
    readonly expected: Expected;
    readonly received: Received;
};
/** `T` with every `readonly` dropped, deeply — a `const`-inferred value against a declared type. */
type VigorDeepMutable<T> = T extends VigorBuiltin ? T : {
    -readonly [K in keyof T]: VigorDeepMutable<T[K]>;
};
type VigorUnionToIntersection<U> = (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never;
/** Every `.query()` object of the stored list, as the one object they add up to. */
type VigorQueryOf<Q> = Q extends readonly (infer E)[] ? [E] extends [never] ? {} : VigorSimplify<VigorUnionToIntersection<E>> : {};
type VigorApiBodyIssue<Key, R, Body> = "body" extends keyof R ? R["body" & keyof R] extends infer B ? [Body] extends [VigorEmptyType | null] ? undefined extends B ? never : null extends B ? never : VigorApiRequestIssue<Key, "the route requires a body", B, Body> : VigorDeepMutable<Body> extends B ? never : VigorApiRequestIssue<Key, "the body does not match the route", B, Body> : never : never;
type VigorApiQueryIssue<Key, R, Query> = "query" extends keyof R ? [NonNullable<R["query" & keyof R]>, VigorQueryOf<Query>] extends [infer D, infer Q] ? [Exclude<keyof Q, keyof D>] extends [never] ? VigorDeepMutable<Q> extends D ? never : VigorApiRequestIssue<Key, "the query does not match the route", D, Q> : VigorApiRequestIssue<Key, `unknown query key "${Exclude<keyof Q, keyof D> & string}"`, D, Q> : never : never;
/**
 * Everything wrong with a request's `body` (as set) and `query` (the stored
 * `.query()` list) against the route(s) it matches, or `never`. A route
 * without `body`/`query` accepts anything there.
 */
type VigorApiRequestIssues<Slot, Method, Path, Body, Query> = VigorApiMatched<Slot, Method, Path> extends infer X ? X extends VigorApiMatch<infer K, infer R> ? VigorApiBodyIssue<K, R, Body> | VigorApiQueryIssue<K, R, Query> : never : never;
/** The method a request is sent with: the one set, else `POST` with a body and `GET` without. */
type VigorResolvedMethod<Method, Body> = Method extends VigorEmptyType ? Body extends VigorEmptyType | null ? "GET" : "POST" : Method;
/** The route keys of the API map stored in `Slot`. */
type VigorApiKeys<Slot> = Slot extends VigorApiMapSlot<infer M, any> ? keyof M & VigorApiRouteKey : never;
type VigorParamNames<P extends string> = P extends `${infer H}/${infer R}` ? VigorParamName<H> | VigorParamNames<R> : VigorParamName<P>;
type VigorParamName<S extends string> = S extends `:${infer N}` ? N : never;
/** The path part of a route key (`"GET /users/:id"` → `"users/:id"`). */
type VigorRoutePath<K> = K extends `${VigorApiMethod} /${infer P}` ? P : never;
/** The method part of a route key. */
type VigorRouteMethod<K> = K extends `${infer M extends VigorApiMethod} /${string}` ? M : never;
/**
 * The values `.route(key, params)` needs: one per `:name` segment, typed by
 * the route's `params` where it declares one (`R` is the route).
 */
type VigorRouteParams<K, R = {}> = {
    [N in VigorParamNames<VigorRoutePath<K>>]: R extends {
        params: infer P;
    } ? N extends keyof P ? P[N] : VigorApiParamValue : VigorApiParamValue;
};
/** The route keys among `K` without `:name` segments. */
type VigorRouteWithoutParams<K> = K extends unknown ? [VigorParamNames<VigorRoutePath<K>>] extends [never] ? K : never : never;
/** The route keys among `K` with at least one `:name` segment. */
type VigorRouteWithParams<K> = Exclude<K, VigorRouteWithoutParams<K>>;
/** The path list `.route(key, params)` stores: static segments as-is, parameters as their values. */
type VigorRoutePathList<P extends string, Params> = VigorSplitPath<P> extends infer S extends string[] ? {
    [I in keyof S]: S[I] extends `:${infer N}` ? N extends keyof Params ? VigorPathSegment<Params[N]> : string : S[I];
} : never;

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
        func: (ctx: VigorFetchBeforeContextSchema<T>) => void | Promise<void>;
    };
    after: {
        _mode: "fluent";
        func: (ctx: VigorFetchAfterContextSchema<T>) => void | Promise<void>;
    };
    onResult: {
        _mode: "fluent";
        func: (res: VigorFetchOnResultContextSchema<T>["result"]) => VigorFetchContextSchema<any>["result"] | Promise<VigorFetchContextSchema<any>["result"]>;
    };
    onError: {
        _mode: "fluent";
        func: (err: VigorFetchContextSchema<T>["error"]) => void | Promise<void>;
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
        func: (ctx: VigorFetchOnResultContextSchema<T>, api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult" | "throwError">) => VigorFetchContextSchema<any> | Promise<VigorFetchContextSchema<any>>;
    };
    onError: {
        _mode: "intercept";
        func: (ctx: VigorFetchOnErrorContextSchema<T>, api: Pick<VigorFetchPolicyMiddlewaresApi<T>, "setResult" | "throwError" | "proceedRestart" | "cancelRestart">) => VigorFetchContextSchema<any> | Promise<VigorFetchContextSchema<any>>;
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
/**
 * What the parse engine produces from the response: its result type
 * (`.cast<T>()`, `raw`, middlewares, `default`), with the `Response` as target.
 */
type VigorFetchParsedResult<T extends VigorFetchSchema<T>> = VigorDeepMerge<T["policy"]["parse"], {
    policy: {
        target: Response;
    };
}, {
    policy: {
        target: "replace";
    };
}> extends infer P ? P extends VigorParseSchema<any> ? VigorParseResult<P> : unknown : unknown;
/**
 * The result type before `.cast<T>()`: a `raw` parse gives the `Response`
 * itself; otherwise the union of the API map's matched route's success
 * `responses` (see
 * `.apiMap()`), falling back to the parse engine's result where no route
 * matches.
 */
type VigorFetchNaturalResult<T extends VigorFetchSchema<T>> = VigorFetchNaturalFor<T, VigorApiResponse<T["apiMap"], VigorResolvedMethod<T["policy"]["method"], T["policy"]["body"]>, T["policy"]["path"]>>;
/**
 * The result type before `.cast<T>()` for API-map data `D` (one status's,
 * or the union of all): a `raw` parse gives the `Response`, and where no
 * route matched (`VigorApiNoMatchType`) the parse engine's result is used.
 */
type VigorFetchNaturalFor<T extends VigorFetchSchema<T>, D> = T["policy"]["parse"]["policy"]["settings"]["raw"] extends true ? VigorFetchParsedResult<T> : Exclude<D, VigorApiNoMatchType> | (VigorApiNoMatchType extends D ? VigorFetchParsedResult<T> : never);
/**
 * The result the success pipeline produces. `Natural` is the result it
 * starts from (before `.cast<T>()`): by default the API map's whole success
 * union, or one status's data to follow that status through the pipeline.
 */
type VigorFetchPipeResult<T extends VigorFetchSchema<T>, Natural = VigorFetchNaturalResult<T>> = VigorFetchOnResultContextSchema<T, Natural>["result"];
/** `ctx.result` once the `onError` middlewares ran — what a recovered request (`setResult`) resolves to, as far as types go. */
type VigorFetchErrorPipeResult<T extends VigorFetchSchema<T>> = VigorFetchOnErrorContextSchema<T>["result"];

type VigorFetchTimelineStages = Omit<VigorFetchPolicyMiddlewaresSchema<any>, "__brand">;
type VigorFetchTimelineApis = {
    [S in keyof VigorFetchTimelineStages]: Parameters<VigorFetchPolicyMiddlewaresIntercept<any>[S]["func"]>[1];
};
/** Lifecycle steps recorded as `PROCESS_HANDLING`, mapped to their `data`. */
type VigorFetchProcessHandler = {
    /** A run started. `restartAttempt` is `1` for the first run, and increases on every restart. */
    REQUEST_START: {
        restartAttempt: number;
    };
    /** The run failed, before `onError` runs. */
    REQUEST_ERROR: {
        error: unknown;
    };
    /** `onError` asked for a restart; the next run's entries follow. */
    REQUEST_RESTART: {
        restartAttempt: number;
    };
};
/**
 * Which response a parse engine ran on: `"response"` for the result, or
 * `"failedResponse"` for the best-effort parse of a failed response's body.
 */
type VigorFetchParseSource = "response" | "failedResponse";
/** Every action a fetch timeline can record, mapped to its content. */
type VigorFetchTimelineEvents = VigorTimelineProcessEvents<VigorFetchProcessHandler> & VigorTimelineMiddlewareEvents<VigorFetchTimelineStages, VigorFetchTimelineApis> & VigorTimelineEndEvents & {
    BUILT_URL: {
        url: string;
    };
    /** The options actually sent, after `before` has run. */
    SET_OPTIONS: {
        options: VigorFetchContextSchema<any>["options"];
    };
    /** The engines are built. `parseEngine` has no target yet; each parse sets its own. */
    ENGINE_CREATED: {
        retryEngine: VigorRetry<any>;
        parseEngine: VigorParse<any>;
    };
    RETRY_STARTED: {
        engine: VigorRetry<any>;
    };
    /**
     * An attempt got a response (recorded during `RETRY_STARTED`…`RETRY_ENDED`),
     * before it's judged: a failure status still fails the attempt afterwards.
     */
    RESPONSE_RECEIVED: {
        attempt: number;
        status: number;
        statusText: string;
        ok: boolean;
        redirected: boolean;
        url: string;
    };
    /** `timeline` is the retry engine's whole timeline. `response` is `VigorDefault` when it failed. */
    RETRY_ENDED: {
        engine: VigorRetry<any>;
        timeline: VigorRetryTimeline;
        took: number;
        response: Response | VigorDefaultType;
    };
    /** `attempt` is the attempt whose response is parsed. */
    PARSE_STARTED: {
        engine: VigorParse<any>;
        source: VigorFetchParseSource;
        attempt: number;
    };
    /** `timeline` is the parse engine's whole timeline. `result` is `VigorDefault` when it failed. */
    PARSE_ENDED: {
        engine: VigorParse<any>;
        source: VigorFetchParseSource;
        attempt: number;
        timeline: VigorParseTimeline;
        took: number;
        result: unknown;
    };
};
/** A fetch context as stored on a timeline entry. */
type VigorFetchTimelineSnapshot = VigorTimelineSnapshot<VigorFetchContextSchema<any>>;
type VigorFetchTimeline = VigorTimeline<VigorFetchTimelineEvents, VigorFetchTimelineSnapshot>;

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
type VigorFetchContextSchema<T extends VigorFetchSchema<T>, R = VigorFetchPipeResult<T> | VigorDefaultType> = {
    __brand: VigorBrand<"Fetch", "Context<Schema">;
    href: string;
    response: Response | VigorDefaultType;
    result: R;
    error: unknown;
    options: VigorFetchOptions | VigorDefaultType;
    flags: {
        overridden: boolean;
        restarted: boolean;
    };
    record: Record<string, any>;
    /** Everything this `requestVerbose()` call has gone through so far, restarts included. */
    timeline: VigorFetchTimeline;
    policy: T["policy"];
};
/**
 * Context seen by `before` middlewares — the request hasn't been sent yet.
 *
 * Each stage's context is defined on its own — the runtime's view at that
 * point — with whatever the stage's earlier intercept middlewares changed by
 * returning a different context (see `VigorContextStage`).
 */
type VigorFetchBeforeContextSchema<T extends VigorFetchSchema<T>> = VigorContextStage<VigorFetchContextSchema<T, VigorDefaultType>, T["policy"]["middlewares"]["before"]>;
/**
 * Context seen by `after` middlewares — `response` and the parsed `result`
 * are set; what `before` changed otherwise carries over. `Natural` is the
 * result before `.cast<T>()` (one API-map status's, when followed per status).
 */
type VigorFetchAfterContextSchema<T extends VigorFetchSchema<T>, Natural = VigorFetchNaturalResult<T>> = VigorContextStage<VigorContextReset<VigorFetchBeforeContextSchema<T>, {
    result: VigorCastResult<T["cast"], Natural>;
    response: Response;
}>, T["policy"]["middlewares"]["after"]>;
/** Context seen by `onResult` middlewares — `ctx.result` is what the earlier `onResult` ones left it as. */
type VigorFetchOnResultContextSchema<T extends VigorFetchSchema<T>, Natural = VigorFetchNaturalResult<T>> = VigorContextStage<VigorFetchAfterContextSchema<T, Natural>, T["policy"]["middlewares"]["onResult"], "result">;
/** Context seen by `onError` middlewares — the request failed. */
type VigorFetchOnErrorContextSchema<T extends VigorFetchSchema<T>> = VigorContextStage<VigorFetchContextSchema<T>, T["policy"]["middlewares"]["onError"]>;
/** Context shape once the full middleware pipeline (including `onResult`) has run. */
type VigorFetchResultContextSchema<T extends VigorFetchSchema<T>> = VigorFetchContextSchema<T, VigorFetchPipeResult<T>>;
declare const VigorFetchContextBase: {
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
        readonly overridden: false;
        readonly restarted: false;
    };
    readonly record: {};
    readonly timeline: VigorFetchTimeline;
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
            readonly debug: false;
            readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"];
            readonly unretryStatus: [400, 401, 402, 403, 404, 405, 406, 407, 409, 410, 411, 412, 413, 414, 415, 416, 417, 422, 424, 426, 428, 431, 451, 501, 505, 506, 508, 510, 511];
            readonly maxRetryAfter: number;
            readonly redirect: false;
            readonly confinePath: true;
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
                    readonly debug: false;
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
                    readonly debug: false;
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
};

declare const VigorFetchErrorMessageFuncs: {
    readonly VALUE_REQUIRED: ({ key }: {
        key: string;
    }) => string;
    readonly INVALID_BODY: ({ received }: {
        received: unknown;
    }) => string;
    readonly BODY_NOT_ALLOWED: ({ method }: {
        method: string;
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
    readonly PATH_ESCAPED: ({ url, base }: {
        url: string;
        base: string;
    }) => string;
    readonly REDIRECTED: ({ url, status }: {
        url: string;
        status: number;
        response: Response;
    }) => string;
    readonly INVALID_CONTENT_TYPE: ({ received }: {
        received: unknown;
    }) => string;
    readonly PARSER_NOT_FOUND: ({ received, expected }: {
        received: unknown;
        expected: Array<string>;
    }) => string;
    readonly PARSER_ALL_FAILED: ({ tried, errors }: {
        tried: Array<string>;
        errors: Array<unknown>;
    }) => string;
    readonly RETRY_EXHAUSTED: ({ maxAttempts }: {
        maxAttempts: number;
        error: unknown;
    }) => string;
    readonly TIMED_OUT: ({ limit }: {
        limit: number;
    }) => string;
};
type VigorFetchErrorCodes = keyof typeof VigorFetchErrorMessageFuncs;
/**
 * The `data` of error code `C`. Most codes have a fixed shape; three depend
 * on the request `T`:
 *
 * - `FETCH_FAILED` — with an API map route that declares failure
 *   `responses`, one member per status, so narrowing `data.status` narrows
 *   `data.parsed` to that status's declared body.
 * - `RETRY_EXHAUSTED` / `RESTART_EXHAUSTED` — `data.error` (the last
 *   error) is typed as this request's errors, so a guard on it keeps them.
 */
type VigorFetchErrorDatas<C extends VigorFetchErrorCodes, T extends VigorFetchSchema<any> = any> = C extends "FETCH_FAILED" ? VigorFetchFailedData<T> : C extends "RETRY_EXHAUSTED" | "RESTART_EXHAUSTED" ? {
    maxAttempts: number;
    error: VigorFetchRequestError<T>;
} : Parameters<typeof VigorFetchErrorMessageFuncs[C]> extends [infer A] ? A : undefined;
/** `FETCH_FAILED`'s `data` without an API map to take types from. */
type VigorFetchFailedDataBase = Parameters<typeof VigorFetchErrorMessageFuncs["FETCH_FAILED"]>[0];
/**
 * `FETCH_FAILED`'s `data` for request `T`: per declared failure status of
 * its matched route, `{ status, ..., parsed }` (`parsed` being `undefined`
 * when the body couldn't be parsed), with `parsed: unknown` for the rest.
 * Without a matching route, or with a `raw` parse (whose `parsed` is the
 * `Response`), it's the plain shape.
 */
type VigorFetchFailedData<T extends VigorFetchSchema<any>> = 0 extends (1 & T) ? VigorFetchFailedDataBase : T["policy"]["parse"]["policy"]["settings"]["raw"] extends true ? VigorFetchFailedDataBase : VigorApiFailure<T["apiMap"], VigorResolvedMethod<T["policy"]["method"], T["policy"]["body"]>, T["policy"]["path"]> extends infer F ? F extends {
    status: infer S;
    parsed: infer P;
} ? {
    status: S;
    statusText: string;
    response: Response;
    url: string;
    parsed: P;
} : never : never;
/**
 * Every fetch error code as its own union member, so narrowing by `code`
 * also narrows `data` to that code's payload.
 */
type VigorFetchErrors<T extends VigorFetchSchema<any> = VigorFetchSchema<any>> = {
    [C in VigorFetchErrorCodes]: VigorFetchError<C, T>;
}[VigorFetchErrorCodes];
/**
 * `error` of a failed `requestVerbose()`. The nested engines' failures come
 * as fetch errors with their own codes: a retried-out request fails with
 * `VigorFetchError("RETRY_EXHAUSTED")` (its `data.error` holding the last
 * attempt's error), a body that can't be parsed with e.g.
 * `VigorFetchError("PARSER_NOT_FOUND")`.
 *
 * Typed with the request's own schema `T`, so `context` (and anything else
 * that depends on the config) is that request's, not a generic one.
 */
type VigorFetchRequestError<T extends VigorFetchSchema<any> = any> = VigorResultError<VigorFetchErrors<T>>;
/** Codes that may be raised without a run context. */
type VigorFetchErrorCodesWithOptionalContext = "VALUE_REQUIRED";
/** Codes that are never raised with a run context. */
type VigorFetchErrorCodesWithoutContext = never;
/**
 * The `context` of a `VigorFetchError` with code `C`: the run context when
 * the code always has one, `| undefined` when it may not, `undefined` when
 * it never does. `VALUE_REQUIRED` is also raised by `.route()` for a missing param, while building, before any run.
 */
type VigorFetchErrorContext<C extends VigorFetchErrorCodes, T extends VigorFetchSchema<any> = any> = VigorErrorContext<C, VigorFetchContextSchema<T>, VigorFetchErrorCodesWithOptionalContext, VigorFetchErrorCodesWithoutContext>;
/** Error type thrown by the fetch module. */
declare class VigorFetchError<C extends VigorFetchErrorCodes, T extends VigorFetchSchema<T>> extends VigorError<C, VigorFetchErrorDatas<C, T>, VigorFetchErrorContext<C, T>> {
    /**
     * @param code - One of the fetch module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code: C, options: VigorErrorOptions<VigorFetchErrorDatas<C, T>, VigorFetchErrorContext<C, T>>);
}
/**
 * What `isVigorFetchError` narrows `E` to: the typed `VigorFetchError` members
 * already in `E` (so a `requestVerbose()` error keeps its request's
 * `context` type), limited to codes `C`. For an `unknown` input (a `catch`
 * binding, a `request()` rejection) there's no request to take types from,
 * so it's the generic `VigorFetchErrors<any>`.
 */
type VigorFetchErrorsIn<E, C extends VigorFetchErrorCodes = VigorFetchErrorCodes> = [
    Extract<E, VigorFetchError<any, any>>
] extends [never] ? Extract<VigorFetchErrors<any>, {
    code: C;
}> : Extract<Extract<E, VigorFetchError<any, any>>, {
    code: C;
}>;
/**
 * Narrows an error from a failed result envelope to the fetch module's typed
 * error union. Prefer this over a bare `instanceof`: the envelope's `{}`
 * member makes `instanceof` widen `data` back to every code's payload,
 * while this guard keeps `code` and `data` in sync.
 *
 * Pass one or more `codes` to also check the code: the error is then
 * narrowed to just those codes, so `data` is that code's payload right away.
 *
 * @example
 * if (isVigorFetchError(error, "FETCH_FAILED")) {
 *     error.data // that code's payload
 * }
 */
declare function isVigorFetchError<E>(error: E): error is E & VigorFetchErrorsIn<E>;
declare function isVigorFetchError<E, const C extends VigorFetchErrorCodes>(error: E, ...codes: [C, ...C[]]): error is E & VigorFetchErrorsIn<E, C>;
/**
 * Like `isVigorFetchError(error, ...codes)`, but also looks inside the errors
 * `error` wraps — `data.error` of `RETRY_EXHAUSTED` / `RESTART_EXHAUSTED`,
 * then `cause` — and returns the first match, outermost first. Returns
 * `null` when there is none. `error` itself is left as it is.
 *
 * A guard can't do this: it narrows the value you pass, so a `true` for a
 * wrapped match would claim the wrapper has the inner error's `data`.
 *
 * @example
 * const failed = findVigorFetchError(error, "FETCH_FAILED")
 * if (failed) failed.data.status
 */
declare function findVigorFetchError<E, const C extends VigorFetchErrorCodes>(error: E, ...codes: [C, ...C[]]): VigorFetchErrorsIn<E, C> | null;
/**
 * Re-raises an error of the nested retry/parse engine as a `VigorFetchError`
 * with the same `code`, `data`, and `method`, keeping the original as
 * `cause`. A `data.error` (the underlying error of `RETRY_EXHAUSTED` /
 * `RESTART_EXHAUSTED`) is adopted the same way. Anything else — a fetch
 * error, an error your middleware threw, an abort reason — is returned as-is.
 */
declare function adoptVigorFetchError(error: unknown, context: VigorFetchContextSchema<any>): unknown;

type VigorFetchSchema<T extends VigorFetchSchema<T>> = {
    __brand: VigorBrand<"Fetch", "Schema">;
    policy: VigorFetchPolicySchema<T>;
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown;
    /** Type-level API map, set via `.apiMap<M>()`; routes' success `responses` become the result type. */
    apiMap: unknown;
};
/** What `request()` resolves to: the pipeline's result, or what `settings.default` returns. */
type VigorFetchResult<T extends VigorFetchSchema<T>> = VigorExcludeDefault<VigorFetchContextSchema<T>["result"]> | VigorExcludeDefault<VigorFetchErrorPipeResult<T>> | VigorReturnType<T["policy"]["settings"]["default"]>;
/** The builder `T` becomes after merging `P` in (with strategy tree `S`). */
type VigorFetchNext<T, P, S = undefined> = VigorApply<VigorFetchTypeLambda, VigorDeepMerge<T, P, S>>;
/** `requestVerbose()`'s default type argument: "infer the result per status". Type-only. */
type VigorFetchInferResult = {
    readonly __brand: "@vigor-fetch:::Fetch <- InferResult";
};
/** Whether `R` is the {@link VigorFetchInferResult} default rather than a type the caller passed. */
type VigorFetchIsInferred<R> = 0 extends (1 & R) ? false : [R] extends [VigorFetchInferResult] ? [VigorFetchInferResult] extends [R] ? true : false : false;
/** The success outcomes, `{ status, data }`, the API map gives request `T`. */
type VigorFetchSuccessOf<T extends VigorFetchSchema<T>> = VigorApiSuccess<T["apiMap"], VigorResolvedMethod<T["policy"]["method"], T["policy"]["body"]>, T["policy"]["path"]>;
/**
 * A successful `requestVerbose()` whose result was parsed from a response:
 * `status`/`response` are that response's. Inferred, it's one member per
 * status the API map declares, each with that status's data through the
 * middleware pipeline — so narrowing `status` narrows `data`.
 */
type VigorFetchVerboseParsed<T extends VigorFetchSchema<T>, R> = VigorFetchIsInferred<R> extends true ? VigorFetchSuccessOf<T> extends infer V ? V extends {
    status: infer S;
    data: infer D;
} ? {
    success: true;
    data: VigorExcludeDefault<VigorFetchPipeResult<T, VigorFetchNaturalFor<T, D>>>;
    error: null;
    status: S;
    response: Response;
    timeline: VigorFetchTimeline;
} : never : never : {
    success: true;
    data: R;
    error: null;
    status: VigorFetchSuccessOf<T>["status"];
    response: Response;
    timeline: VigorFetchTimeline;
};
/**
 * A successful `requestVerbose()` that recovered from a failure — with
 * `onError`'s `setResult` or `settings.default` — so there's no response:
 * `status`/`response` are `null`. Only possible when one of them is set.
 */
type VigorFetchVerboseRecovered<T extends VigorFetchSchema<T>, R> = (T["policy"]["middlewares"]["onError"] extends readonly [] ? never : VigorExcludeDefault<VigorFetchErrorPipeResult<T>>) | (T["policy"]["settings"]["default"] extends VigorEmptyType ? never : VigorReturnType<T["policy"]["settings"]["default"]>) extends infer D ? [D] extends [never] ? never : {
    success: true;
    data: VigorFetchIsInferred<R> extends true ? D : R;
    error: null;
    status: null;
    response: null;
    timeline: VigorFetchTimeline;
} : never;
/**
 * What `requestVerbose()` resolves to: a success (per status, or
 * recovered), or a failure. `status`/`response` belong to the response the
 * result was parsed from, and are `null` otherwise — a failure's response is
 * on its error (`FETCH_FAILED`'s `data`).
 */
type VigorFetchVerboseResult<T extends VigorFetchSchema<T>, R = VigorFetchInferResult> = VigorFetchVerboseParsed<T, R> | VigorFetchVerboseRecovered<T, R> | {
    success: false;
    data: null;
    error: VigorFetchRequestError<T>;
    status: null;
    response: null;
    timeline: VigorFetchTimeline;
};
/**
 * What `request()`/`requestVerbose()` require of their `this`: the request
 * itself, unless its `body`/`query` don't match its API map route — then a
 * {@link VigorApiRequestIssue} describing the mismatch, so the call doesn't
 * compile. Only computed where those methods are called.
 */
type VigorFetchRequestThis<T extends VigorFetchSchema<T>> = 0 extends (1 & T) ? VigorFetch<T> : T["apiMap"] extends VigorEmptyType ? VigorFetch<T> : VigorApiRequestIssues<T["apiMap"], VigorResolvedMethod<T["policy"]["method"], T["policy"]["body"]>, T["policy"]["path"], T["policy"]["body"], T["policy"]["query"]> extends infer I ? [I] extends [never] ? VigorFetch<T> : I : never;
type VigorFetchMethod = NonNullable<VigorFetchOptions["method"]>;
/** The API map's route keys `.route()` accepts for `T`: those whose method `T` allows. */
type VigorFetchRouteKeys<T extends VigorFetchSchema<T>> = Extract<VigorApiKeys<T["apiMap"]>, `${VigorFetchMethodFor<T>} /${string}`>;
/** Methods allowed for `T`: a `GET`/`HEAD` request can't carry the body already set. */
type VigorFetchMethodFor<T extends VigorFetchSchema<T>> = T["policy"]["body"] extends VigorEmptyType | null ? VigorFetchMethod : Exclude<VigorFetchMethod, "GET" | "HEAD">;
/** Bodies allowed for `T`: only `null` (no body) once the method is `GET`/`HEAD`. */
type VigorFetchBodyFor<T extends VigorFetchSchema<T>> = T["policy"]["method"] extends "GET" | "HEAD" ? null : BodyInit | object | null;
/** `{ ...A, ...B }` when both are plain objects, otherwise `B` — what `body("merge", ...)` does. */
type VigorFetchShallowMerge<A, B> = A extends VigorBuiltin | readonly any[] ? B : B extends VigorBuiltin | readonly any[] ? B : VigorSimplify<Omit<A, keyof B> & B>;
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
            readonly debug: false;
            readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"];
            readonly unretryStatus: [400, 401, 402, 403, 404, 405, 406, 407, 409, 410, 411, 412, 413, 414, 415, 416, 417, 422, 424, 426, 428, 431, 451, 501, 505, 506, 508, 510, 511];
            readonly maxRetryAfter: number;
            readonly redirect: false;
            readonly confinePath: true;
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
                    readonly debug: false;
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
                    readonly debug: false;
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
    readonly apiMap: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
};
/** `retryHeaders`/`unretryStatus` are whole lists: setting them replaces the previous list. */
type VigorFetchSettingsStrategy = {
    policy: {
        settings: {
            retryHeaders: "replace";
            unretryStatus: "replace";
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
    method<const N extends VigorFetchMethodFor<T>>(str: N): VigorFetchNext<T, {
        policy: {
            method: N;
        };
    }>;
    /** Sets the request origin, either an absolute URL or a path relative to the current page. */
    origin<const N extends string>(str: N): VigorFetchNext<T, {
        policy: {
            origin: N;
        };
    }>;
    /** Appends path segments to the request URL. */
    path<const N extends VigorStringable[]>(...strs: N): VigorFetchNext<T, {
        policy: {
            path: VigorPathList<N>;
        };
    }>;
    /** Adds query-string parameter objects to the request URL. */
    query<const N extends VigorFetchPolicySchema<any>["query"][number]>(...objs: N[]): VigorFetchNext<T, {
        policy: {
            query: N[];
        };
    }>;
    /** Sets the URL fragment ("hash"), replacing any previous value. */
    hash<const N extends string>(str: N): VigorFetchNext<T, {
        policy: {
            hash: N;
        };
    }, {
        policy: {
            hash: "replace";
        };
    }>;
    /**
     * Sets request headers.
     *
     * @param mode - `"overwrite"` discards all previously configured headers
     *  and keeps only the ones passed here. `"merge"` behaves like
     *  `Object.assign`, overwriting only the keys that overlap and keeping
     *  the rest.
     */
    headers<const N extends Record<string, string>>(mode: "overwrite", obj: N): VigorFetchNext<T, {
        policy: {
            headers: N;
        };
    }, {
        policy: {
            headers: "replace";
        };
    }>;
    headers<const N extends Record<string, string>>(mode: "merge", obj: N): VigorFetchNext<T, {
        policy: {
            headers: N;
        };
    }>;
    /**
     * Sets the request body.
     *
     * @param mode - `"overwrite"` discards the previous body and fully
     *  replaces it with this value. `"merge"` shallow-merges (via
     *  `Object.assign`) when both the previous and new body are plain
     *  objects; for any other body type (string/Blob/FormData/etc) it is
     *  simply replaced.
     */
    body<const N extends VigorFetchBodyFor<T>>(mode: "overwrite", obj: N): VigorFetchNext<T, {
        policy: {
            body: N;
        };
    }, {
        policy: {
            body: "replace";
        };
    }>;
    body<const N extends VigorFetchBodyFor<T>>(mode: "merge", obj: N): VigorFetchNext<T, {
        policy: {
            body: VigorFetchShallowMerge<T["policy"]["body"], N>;
        };
    }, {
        policy: {
            body: "replace";
        };
    }>;
    /**
     * Sets additional `RequestInit` options other than headers/body/method/signal
     * (e.g. `credentials`, `mode`, `cache`, `redirect`, `referrer`,
     * `referrerPolicy`, `keepalive`, `integrity`).
     *
     * @param mode - `"overwrite"` discards all previously configured options
     *  and replaces them with this value. `"merge"` shallow-merges this
     *  value onto the previous options.
     */
    options<const N extends VigorFetchPolicySchema<any>["extra"]>(mode: "overwrite", obj: N): VigorFetchNext<T, {
        policy: {
            extra: N;
        };
    }, {
        policy: {
            extra: "replace";
        };
    }>;
    options<const N extends VigorFetchPolicySchema<any>["extra"]>(mode: "merge", obj: N): VigorFetchNext<T, {
        policy: {
            extra: VigorSimplify<Omit<T["policy"]["extra"], keyof N> & N>;
        };
    }, {
        policy: {
            extra: "replace";
        };
    }>;
    /** Configures the fetch policy's general settings. */
    settings<const N extends VigorDeepPartial<VigorFetchPolicySettingsSchema<T>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorFetchPolicySettingsSchema<T>>>): VigorFetchNext<T, {
        policy: {
            settings: N;
        };
    }, VigorFetchSettingsStrategy>;
    settings<const B extends VigorFetchPolicySettings<any>>(input: (s: VigorFetchPolicySettings<T>) => B): VigorFetchNext<T, {
        policy: {
            settings: B["config"]["policy"]["settings"];
        };
    }, VigorFetchSettingsStrategy>;
    settings<const R extends VigorFetchSchema<any>>(input: VigorFetchPolicySettings<R>): VigorFetchNext<T, {
        policy: {
            settings: R["policy"]["settings"];
        };
    }, VigorFetchSettingsStrategy>;
    /** Configures the fetch policy's middleware pipeline. */
    middlewares<const N extends VigorDeepPartial<VigorFetchPolicyMiddlewaresSchema<T>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorFetchPolicyMiddlewaresSchema<T>>>): VigorFetchNext<T, {
        policy: {
            middlewares: N;
        };
    }>;
    /**
     * The callback's builder is typed as already holding this instance's
     * middlewares (so each new one sees the pipeline so far), while at
     * runtime it starts empty and its result is appended. Either way, its
     * type is the full list, so it replaces the current one.
     */
    middlewares<const B extends VigorFetchPolicyMiddlewares<any>>(input: (s: VigorFetchPolicyMiddlewares<T>) => B): VigorFetchNext<T, {
        policy: {
            middlewares: B["config"]["policy"]["middlewares"];
        };
    }, {
        policy: {
            middlewares: "replace";
        };
    }>;
    middlewares<const R extends VigorFetchSchema<any>>(input: VigorFetchPolicyMiddlewares<R>): VigorFetchNext<T, {
        policy: {
            middlewares: R["policy"]["middlewares"];
        };
    }>;
    /**
     * Configures the retry engine used to send the underlying request. This
     * replaces the previous engine config; a config object is applied on
     * top of the retry defaults.
     */
    retry<const N extends VigorDeepPartial<VigorRetrySchema<any>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorRetrySchema<any>>>): VigorFetchNext<T, {
        policy: {
            retry: VigorDeepMerge<typeof VigorRetryBase, N>;
        };
    }, {
        policy: {
            retry: "replace";
        };
    }>;
    retry<const B extends VigorRetry<any>>(input: (r: VigorRetry) => B): VigorFetchNext<T, {
        policy: {
            retry: B["config"];
        };
    }, {
        policy: {
            retry: "replace";
        };
    }>;
    retry<const R extends VigorRetrySchema<any>>(input: VigorRetry<R>): VigorFetchNext<T, {
        policy: {
            retry: R;
        };
    }, {
        policy: {
            retry: "replace";
        };
    }>;
    /**
     * Configures the parse engine used to interpret the response. This
     * replaces the previous engine config; a config object is applied on
     * top of the parse defaults. Its result type (including `.cast<T>()`,
     * `raw`, and its middlewares) becomes this request's result type.
     */
    parse<const N extends VigorDeepPartial<VigorParseSchema<any>>>(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorParseSchema<any>>>): VigorFetchNext<T, {
        policy: {
            parse: VigorDeepMerge<typeof VigorParseBase, N>;
        };
    }, {
        policy: {
            parse: "replace";
        };
    }>;
    parse<const B extends VigorParse<any>>(input: (p: VigorParse) => B): VigorFetchNext<T, {
        policy: {
            parse: B["config"];
        };
    }, {
        policy: {
            parse: "replace";
        };
    }>;
    parse<const R extends VigorParseSchema<any>>(input: VigorParse<R>): VigorFetchNext<T, {
        policy: {
            parse: R;
        };
    }, {
        policy: {
            parse: "replace";
        };
    }>;
    /** Whether `v` is a plain object literal (not an array, `FormData`, `Blob`, ...). */
    protected _isPlainObject(v: unknown): v is Record<string, unknown>;
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
     * resolved against it. Throws `INVALID_PROTOCOL` (with `context`) if
     * neither is possible, and with `settings.confinePath` on, `PATH_ESCAPED`
     * if the result leaves the origin's domain or path.
     */
    protected _buildUrl(origin: string, path: string[], query: VigorFetchPolicySchema<any>["query"], hash: string, context: VigorFetchContextSchema<any>): string;
    /** Infers the `Content-Type` header and serializes `body` into a `BodyInit`. Throws `INVALID_BODY` (with `context`) for anything else. */
    protected _normalizeBody(body: unknown, context: VigorFetchContextSchema<any>): {
        headers: Record<string, string>;
        body: BodyInit | null | undefined;
    };
    /**
     * Returns the absolute URL a redirect points at, or `null` when the
     * response isn't a redirect. A response `fetch` already followed
     * (`redirect: "follow"`, the default) yields its final URL; a readable
     * `3xx` (`redirect: "manual"` outside browsers) yields its `Location`,
     * resolved against the responding URL.
     */
    protected _resolveRedirect(response: Response, href: string): string | null;
    /** The browser's `location`, or `null` in environments without one (e.g. Node). */
    protected _browserLocation(): {
        href: string;
    } | null;
    /** Assigns `source` headers onto `target`, replacing any existing key that differs only in case. */
    protected _assignHeaders(target: Record<string, string>, source: Record<string, string>): void;
    /**
     * Converts a rate-limit header value into a delay in milliseconds, or
     * `null` if it can't be used. Accepts delta seconds (`Retry-After: 120`),
     * Unix epoch seconds or milliseconds (`X-RateLimit-Reset: 1735689600`),
     * and HTTP dates.
     */
    protected _parseRetryHeader(value: string | null): number | null;
    /**
     * Overrides the resolved result type with `T`, taking priority over the
     * default `unknown` result. Can be called before or after `parse()` (or
     * any other configuration method); whichever `.cast<T>()` call happens
     * last wins.
     */
    /**
     * Attaches a type-level API map: a request whose method and path match a
     * route resolves to that route's success `responses` (see `VigorApiRoute`
     * for `responses`/`params`/`query`/`body`). Keys are
     * `"<METHOD> /<path>"`, where a `:name` segment matches any one segment.
     * Routes are relative to the path set so far, so a base path can be set
     * first: `vigor.fetch(origin).path("v1").apiMap<Api>()`. Purely a type —
     * nothing changes at runtime. `.cast<T>()` and a `raw` parse still win.
     *
     * @example
     * type Api = {
     *     "GET /users": { response: User[] }
     *     "GET /users/:id": { response: User }
     * }
     * const api = vigor.fetch("https://api.example.com").apiMap<Api>()
     * const user = await api.path("users", id).request() // User
     */
    apiMap<const M extends VigorApiMap<M>>(): VigorFetchNext<T, {
        apiMap: VigorApiMapSlot<M, T["policy"]["path"]>;
    }, {
        apiMap: "replace";
    }>;
    /**
     * Sets the method and path from a route of the API map (see `.apiMap()`),
     * filling its `:name` segments from `params`. The path is appended to the
     * one set so far, like `.path()`.
     *
     * @example
     * await api.route("GET /users/:id", { id: 1 }).request() // User
     */
    route<const K extends VigorRouteWithoutParams<VigorFetchRouteKeys<T>>>(key: K): VigorFetchNext<T, {
        policy: {
            method: VigorRouteMethod<K>;
            path: VigorRoutePathList<VigorRoutePath<K>, {}>;
        };
    }>;
    route<const K extends VigorRouteWithParams<VigorFetchRouteKeys<T>>, const P extends VigorRouteParams<K, VigorApiRouteOf<T["apiMap"], K>>>(key: K, params: P & VigorNoExtraKeys<P, VigorRouteParams<K, VigorApiRouteOf<T["apiMap"], K>>>): VigorFetchNext<T, {
        policy: {
            method: VigorRouteMethod<K>;
            path: VigorRoutePathList<VigorRoutePath<K>, P>;
        };
    }>;
    cast<const C>(): VigorFetchNext<T, {
        cast: C;
    }, {
        cast: "replace";
    }>;
    /**
     * Runs the request and returns its parsed result directly, throwing on final failure.
     *
     * `R` defaults to the inferred result type. Passing one (`request<User>()`)
     * means "ignore the inference, it's this": it's taken as-is, unchecked.
     * To name the inferred type itself, use `VigorResultOf<typeof builder>`.
     *
     * With an API map, the request's `body`/`query` must match its route's
     * (see {@link VigorFetchRequestThis}), or the call doesn't compile.
     */
    request<R = VigorFetchResult<T>>(this: VigorFetchRequestThis<T>): Promise<R>;
    /**
     * Runs the request and returns a result/error envelope instead of throwing,
     * along with the `timeline` of everything the run went through. The
     * nested retry/parse engines' full timelines are kept inside it, on their
     * `RETRY_ENDED`/`PARSE_ENDED` entries.
     *
     * A success carries the `status` and `response` its result was parsed
     * from; with an API map, narrowing `status` narrows `data` (see
     * {@link VigorFetchVerboseResult}). Passing `R` types every success's
     * `data` as `R`, unchecked.
     */
    requestVerbose<R = VigorFetchInferResult>(this: VigorFetchRequestThis<T>): Promise<VigorFetchVerboseResult<T, R>>;
    /**
     * Internal execution loop implementing URL building, retry, parsing, and
     * restart handling. Never throws: every failure, including one from
     * `onError` or `default`, comes back as an envelope carrying the timeline.
     * A restart passes the same `timeline` on, so it keeps growing across runs.
     */
    private requestRuntime;
}

/**
 * The result type `request()` infers for a builder — what `ReturnType`
 * can't give you, since `request<R>()`'s `R` is a free override.
 *
 * @example
 * const users = vigor.fetch(origin).path("users").cast<User[]>()
 * type Users = VigorResultOf<typeof users> // User[]
 */
type VigorResultOf<B> = B extends VigorRetry<infer T> ? VigorRetryResult<VigorRetryIn<T>> : B extends VigorParse<infer T> ? VigorParseResult<VigorParseIn<T>> : B extends VigorFetch<infer T> ? VigorFetchResult<VigorFetchIn<T>> : B extends VigorAll<infer T> ? VigorAllResult<VigorAllIn<T>> : never;
/**
 * Small named helpers that actually *call* the target/origin method with the
 * generic argument `F`. These exist purely so `ReturnType<typeof xWithY<F>>`
 * can forward `F` into the real merged config type — referencing the method
 * type directly (e.g. `VigorRetry["target"]`) would leave `F` unapplied and
 * collapse back to the method's own parameter type.
 */
declare function retryWithTarget<const F extends Parameters<VigorRetry["target"]>[0]>(task: F): VigorRetry<VigorRetryIn<{
    policy: {
        target: unknown extends F ? F : undefined extends F ? (symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        }) | (0 extends 1 & Exclude<F, F & undefined> ? Exclude<F, F & undefined> : Exclude<F, F & undefined>) : 0 extends 1 & F ? F : F;
        __brand: VigorBrand<"Retry", "Policy<Schema">;
        abortSignals: [];
        settings: {
            readonly __brand: VigorBrand<"Retry", "Policy<Settings<Schema">;
            readonly debug: false;
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
        target: unknown extends F ? F : undefined extends F ? (symbol & {
            __brand: VigorBrand<"Core", "Symbol_Default">;
        }) | (0 extends 1 & Exclude<F, F & undefined> ? Exclude<F, F & undefined> : Exclude<F, F & undefined>) : 0 extends 1 & F ? F : F;
        __brand: VigorBrand<"Parse", "Policy<Schema">;
        settings: {
            readonly __brand: VigorBrand<"Parse", "Policy<Settings<Schema">;
            readonly debug: false;
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
        origin: unknown extends F ? F : undefined extends F ? (symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        }) | (0 extends 1 & Exclude<F, never> ? Exclude<F, never> : Exclude<F, never>) : F;
        __brand: VigorBrand<"Fetch", "Policy<Schema">;
        settings: {
            readonly __brand: VigorBrand<"Fetch", "Policy<Settings<Schema">;
            readonly debug: false;
            readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"];
            readonly unretryStatus: [400, 401, 402, 403, 404, 405, 406, 407, 409, 410, 411, 412, 413, 414, 415, 416, 417, 422, 424, 426, 428, 431, 451, 501, 505, 506, 508, 510, 511];
            readonly maxRetryAfter: number;
            readonly redirect: false;
            readonly confinePath: true;
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
        method: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
        headers: {};
        body: symbol & {
            __brand: VigorBrand<"Core", "Symbol_Empty">;
        };
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
                    readonly debug: false;
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
                    readonly debug: false;
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
    apiMap: symbol & {
        __brand: VigorBrand<"Core", "Symbol_Empty">;
    };
}>>;
declare function allWithTargets<const F extends VigorAllTask[]>(tasks: F): VigorAll<VigorAllIn<{
    policy: {
        target: unknown extends F ? F : undefined extends F ? [] | (0 extends 1 & Exclude<F, F & undefined> ? Exclude<F, F & undefined> : Exclude<F, F & undefined> extends infer T ? T extends Exclude<F, F & undefined> ? T extends VigorBuiltin ? T : T extends readonly any[] ? [...T] : T : never : never) : 0 extends 1 & F ? F : F extends VigorBuiltin ? F : F extends readonly any[] ? [...F] : F;
        __brand: VigorBrand<"All", "Policy<Schema">;
        abortSignals: [];
        settings: {
            readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
            readonly debug: false;
            readonly concurrency: 5;
            readonly onlySuccess: false;
            readonly timeout: symbol & {
                __brand: VigorBrand<"Core", "Symbol_Empty">;
            };
            readonly failFast: false;
        };
        middlewares: {
            readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
            readonly before: [];
            readonly after: [];
            readonly onResult: [];
            readonly beforeEach: [];
            readonly afterEach: [];
            readonly onErrorEach: [];
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
                        readonly debug: false;
                        readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"];
                        readonly unretryStatus: [400, 401, 402, 403, 404, 405, 406, 407, 409, 410, 411, 412, 413, 414, 415, 416, 417, 422, 424, 426, 428, 431, 451, 501, 505, 506, 508, 510, 511];
                        readonly maxRetryAfter: number;
                        readonly redirect: false;
                        readonly confinePath: true;
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
                                readonly debug: false;
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
                                readonly debug: false;
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
                readonly apiMap: symbol & {
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
                        readonly debug: false;
                        readonly retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"];
                        readonly unretryStatus: [400, 401, 402, 403, 404, 405, 406, 407, 409, 410, 411, 412, 413, 414, 415, 416, 417, 422, 424, 426, 428, 431, 451, 501, 505, 506, 508, 510, 511];
                        readonly maxRetryAfter: number;
                        readonly redirect: false;
                        readonly confinePath: true;
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
                                readonly debug: false;
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
                                readonly debug: false;
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
                readonly apiMap: symbol & {
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
                        readonly debug: false;
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
                        readonly debug: false;
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
                        readonly debug: false;
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
                        readonly debug: false;
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
                        readonly debug: false;
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
                        readonly debug: false;
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
                    readonly target: [];
                    readonly abortSignals: [];
                    readonly settings: {
                        readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
                        readonly debug: false;
                        readonly concurrency: 5;
                        readonly onlySuccess: false;
                        readonly timeout: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly failFast: false;
                    };
                    readonly middlewares: {
                        readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
                        readonly before: [];
                        readonly after: [];
                        readonly onResult: [];
                        readonly beforeEach: [];
                        readonly afterEach: [];
                        readonly onErrorEach: [];
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
                    readonly target: [];
                    readonly abortSignals: [];
                    readonly settings: {
                        readonly __brand: VigorBrand<"All", "Policy<Settings<Schema">;
                        readonly debug: false;
                        readonly concurrency: 5;
                        readonly onlySuccess: false;
                        readonly timeout: symbol & {
                            __brand: VigorBrand<"Core", "Symbol_Empty">;
                        };
                        readonly failFast: false;
                    };
                    readonly middlewares: {
                        readonly __brand: VigorBrand<"All", "Policy<Middlewares<Schema">;
                        readonly before: [];
                        readonly after: [];
                        readonly onResult: [];
                        readonly beforeEach: [];
                        readonly afterEach: [];
                        readonly onErrorEach: [];
                    };
                };
                readonly cast: symbol & {
                    __brand: VigorBrand<"Core", "Symbol_Empty">;
                };
            }>;
        };
    };
    guards: {
        retry: typeof isVigorRetryError & {
            find: typeof findVigorRetryError;
        };
        parse: typeof isVigorParseError & {
            find: typeof findVigorParseError;
        };
        fetch: typeof isVigorFetchError & {
            find: typeof findVigorFetchError;
        };
        all: typeof isVigorAllError & {
            find: typeof findVigorAllError;
        };
    };
};
/** `A` with `B`'s properties replacing same-named ones, like `{ ...A, ...B }`. */
type VigorOverride<A, B> = Omit<A, keyof B> & B;
/**
 * `Ext` accumulates every plugin extension applied so far, so `use().use()`
 * keeps all of them. A later extension replaces an earlier property of the
 * same name (including a built-in one), exactly as `use()` does at runtime.
 */
type VigorInstance<Ext = {}> = VigorOverride<typeof vigorBase, Ext> & {
    use: <P extends VigorPlugin<any, any>>(plugin: P, options?: Partial<P["options"]>) => VigorInstance<VigorOverride<Ext, ReturnType<P["func"]>>>;
};
/**
 * A plugin never mutates the `VigorInstance` it receives — it reads from it
 * (e.g. to wrap an existing method) and returns `Ext`, the properties to
 * merge into a *new* instance. `use()` owns cloning/merging, so plugins stay
 * pure and `vigor` itself is never touched.
 *
 * `options` holds the defaults: `func` receives them with whatever was
 * passed to `use()` shallow-merged on top, so it always gets a full `O`.
 */
type VigorPlugin<O extends {
    [str: string]: any;
} = {}, Ext extends Record<string, any> = Record<string, any>> = {
    options: O;
    func: (v: VigorInstance, options: O) => Ext;
};
declare const vigor: VigorInstance;

export { VigorAll, type VigorAllAfterContextSchema, VigorAllBase, type VigorAllBeforeContextSchema, type VigorAllCastNaturalResult, VigorAllContextBase, type VigorAllContextSchema, VigorAllEachContextBase, type VigorAllEachContextSchema, type VigorAllEachMiddlewareFn, type VigorAllEachOnErrorFn, VigorAllError, type VigorAllErrorCodes, type VigorAllErrorCodesWithOptionalContext, type VigorAllErrorCodesWithoutContext, type VigorAllErrorContext, type VigorAllErrorDatas, VigorAllErrorMessageFuncs, type VigorAllErrors, type VigorAllErrorsIn, type VigorAllNaturalResult, type VigorAllOnResultContextSchema, type VigorAllPipeResult, VigorAllPolicyBase, VigorAllPolicyMiddlewares, type VigorAllPolicyMiddlewaresApi, VigorAllPolicyMiddlewaresBase, type VigorAllPolicyMiddlewaresFluent, type VigorAllPolicyMiddlewaresIntercept, type VigorAllPolicyMiddlewaresSchema, type VigorAllPolicySchema, VigorAllPolicySettings, VigorAllPolicySettingsBase, type VigorAllPolicySettingsSchema, type VigorAllProcessHandler, type VigorAllRequestError, type VigorAllResult, type VigorAllResultContextSchema, type VigorAllSchema, type VigorAllSettled, type VigorAllTask, type VigorAllTaskError, type VigorAllTaskResult, type VigorAllTasksTuple, type VigorAllTimeline, type VigorAllTimelineEvents, type VigorAllTimelineSnapshot, type VigorApiFailure, type VigorApiKeys, type VigorApiMap, type VigorApiMapSlot, type VigorApiMatch, type VigorApiMatched, type VigorApiMethod, type VigorApiNoMatchType, type VigorApiParamValue, type VigorApiRequestIssue, type VigorApiRequestIssues, type VigorApiResponse, type VigorApiRoute, type VigorApiRouteKey, type VigorApiRouteOf, type VigorApiStatusClass, type VigorApiSuccess, type VigorBrand, type VigorBuiltin, VigorCastPlaceholder, type VigorCastPlaceholderType, type VigorCastResult, type VigorConcat, type VigorContextApply, type VigorContextChanges, type VigorContextReset, type VigorContextStage, type VigorDeepMerge, type VigorDeepPartial, VigorDefault, type VigorDefaultType, VigorEmpty, type VigorEmptyType, VigorError, type VigorErrorContext, type VigorErrorOptions, type VigorExcludeDefault, type VigorExcludeEmpty, VigorFetch, type VigorFetchAfterContextSchema, VigorFetchBase, type VigorFetchBeforeContextSchema, type VigorFetchBodyFor, VigorFetchContextBase, type VigorFetchContextSchema, VigorFetchError, type VigorFetchErrorCodes, type VigorFetchErrorCodesWithOptionalContext, type VigorFetchErrorCodesWithoutContext, type VigorFetchErrorContext, type VigorFetchErrorDatas, VigorFetchErrorMessageFuncs, type VigorFetchErrorPipeResult, type VigorFetchErrors, type VigorFetchErrorsIn, type VigorFetchExtraOptions, type VigorFetchFailedData, type VigorFetchInferResult, type VigorFetchMethodFor, type VigorFetchNaturalFor, type VigorFetchNaturalResult, type VigorFetchOnErrorContextSchema, type VigorFetchOnResultContextSchema, type VigorFetchOptions, type VigorFetchParseSource, type VigorFetchParsedResult, type VigorFetchPipeResult, VigorFetchPolicyBase, VigorFetchPolicyMiddlewares, type VigorFetchPolicyMiddlewaresApi, VigorFetchPolicyMiddlewaresBase, type VigorFetchPolicyMiddlewaresFluent, type VigorFetchPolicyMiddlewaresIntercept, type VigorFetchPolicyMiddlewaresSchema, type VigorFetchPolicySchema, VigorFetchPolicySettings, VigorFetchPolicySettingsBase, type VigorFetchPolicySettingsSchema, type VigorFetchProcessHandler, type VigorFetchRequestError, type VigorFetchRequestThis, type VigorFetchResult, type VigorFetchResultContextSchema, type VigorFetchRouteKeys, type VigorFetchSchema, type VigorFetchTimeline, type VigorFetchTimelineEvents, type VigorFetchTimelineSnapshot, type VigorFetchVerboseResult, type VigorHttpFailureStatus, type VigorHttpStatusOf, type VigorHttpSuccessStatus, type VigorInstance, type VigorIsSame, VigorJitter, type VigorLastOf, type VigorMergeMode, type VigorMergeStrategy, type VigorNoExtraKeys, VigorParse, type VigorParseAfterContextSchema, VigorParseBase, type VigorParseBeforeContextSchema, type VigorParseBody, VigorParseContentTypeStrategy, VigorParseContextBase, type VigorParseContextSchema, VigorParseError, type VigorParseErrorCodes, type VigorParseErrorCodesWithOptionalContext, type VigorParseErrorCodesWithoutContext, type VigorParseErrorContext, type VigorParseErrorDatas, VigorParseErrorMessageFuncs, type VigorParseErrorPipeResult, type VigorParseErrors, type VigorParseErrorsIn, type VigorParseNaturalResult, type VigorParseOnErrorContextSchema, type VigorParseOnResultContextSchema, type VigorParsePipeResult, VigorParsePolicyBase, VigorParsePolicyMiddlewares, type VigorParsePolicyMiddlewaresApi, VigorParsePolicyMiddlewaresBase, type VigorParsePolicyMiddlewaresFluent, type VigorParsePolicyMiddlewaresIntercept, type VigorParsePolicyMiddlewaresSchema, type VigorParsePolicySchema, VigorParsePolicySettings, VigorParsePolicySettingsBase, type VigorParsePolicySettingsSchema, VigorParsePolicyStrategies, VigorParsePolicyStrategiesBase, type VigorParsePolicyStrategiesSchema, type VigorParseProcessHandler, type VigorParseRequestError, type VigorParseResult, type VigorParseResultContextSchema, type VigorParseSchema, VigorParseSniffStrategy, type VigorParseStrategyFunc, type VigorParseTimeline, type VigorParseTimelineEvents, type VigorParseTimelineSnapshot, type VigorPathList, type VigorPathSegments, type VigorPlugin, type VigorPrimitive, type VigorReplaceType, type VigorResolvedMethod, type VigorResultError, type VigorResultOf, VigorRetry, type VigorRetryAfterContextSchema, VigorRetryBase, type VigorRetryBeforeContextSchema, VigorRetryContextBase, type VigorRetryContextSchema, type VigorRetryDecisionReason, VigorRetryError, type VigorRetryErrorCodes, type VigorRetryErrorCodesWithOptionalContext, type VigorRetryErrorCodesWithoutContext, type VigorRetryErrorContext, type VigorRetryErrorDatas, VigorRetryErrorMessageFuncs, type VigorRetryErrorPipeResult, type VigorRetryErrors, type VigorRetryErrorsIn, type VigorRetryNaturalResult, type VigorRetryOnErrorContextSchema, type VigorRetryOnResultContextSchema, type VigorRetryOnRetryContextSchema, type VigorRetryPipeResult, VigorRetryPolicyAlgorithms, VigorRetryPolicyAlgorithmsBackoff, VigorRetryPolicyAlgorithmsBackoffBase, type VigorRetryPolicyAlgorithmsBackoffSchema, VigorRetryPolicyAlgorithmsBase, VigorRetryPolicyAlgorithmsConstant, VigorRetryPolicyAlgorithmsConstantBase, type VigorRetryPolicyAlgorithmsConstantSchema, VigorRetryPolicyAlgorithmsCustom, VigorRetryPolicyAlgorithmsCustomBase, type VigorRetryPolicyAlgorithmsCustomSchema, VigorRetryPolicyAlgorithmsLinear, VigorRetryPolicyAlgorithmsLinearBase, type VigorRetryPolicyAlgorithmsLinearSchema, type VigorRetryPolicyAlgorithmsSchema, VigorRetryPolicyBase, VigorRetryPolicyMiddlewares, type VigorRetryPolicyMiddlewaresApi, VigorRetryPolicyMiddlewaresBase, type VigorRetryPolicyMiddlewaresFluent, type VigorRetryPolicyMiddlewaresIntercept, type VigorRetryPolicyMiddlewaresSchema, type VigorRetryPolicySchema, VigorRetryPolicySettings, VigorRetryPolicySettingsBase, type VigorRetryPolicySettingsSchema, type VigorRetryProcessHandler, type VigorRetryRequestError, type VigorRetryResult, type VigorRetryResultContextSchema, type VigorRetryRetryIfContextSchema, type VigorRetrySchema, type VigorRetryTimeline, type VigorRetryTimelineEvents, type VigorRetryTimelineSnapshot, type VigorReturnType, type VigorRouteMethod, type VigorRouteParams, type VigorRoutePath, type VigorRoutePathList, type VigorRouteWithParams, type VigorRouteWithoutParams, type VigorSimplify, VigorStatus, type VigorStringable, type VigorTimeline, type VigorTimelineEndEvents, type VigorTimelineItem, type VigorTimelineMiddlewareEvents, type VigorTimelineOutcome, type VigorTimelineProcessEvents, type VigorTimelineSnapshot, adoptVigorFetchError, createBrand, createVigorTimelineRecorder, vigor as default, findInVigorErrorChain, findVigorAllError, findVigorFetchError, findVigorParseError, findVigorRetryError, isVigorAllError, isVigorDefault, isVigorEmpty, isVigorFetchError, isVigorInternalMiddleware, isVigorParseError, isVigorRetryError, markVigorInternal, readVigorParseBody, vigor };
