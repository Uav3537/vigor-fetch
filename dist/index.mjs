/**
 * Builds the literal brand string used by {@link VigorBrand}, preserving the
 * `Branch`/`Name` literal types for use as a `__brand` value.
 */
function createBrand(b, n) {
    return `@vigor-fetch:::${b} <- ${n}`;
}
const VigorDefault = Symbol("VigorDefault");
/** Type guard checking whether a value is the {@link VigorDefault} sentinel. */
const isVigorDefault = (v) => v === VigorDefault;
const VigorEmpty = Symbol("VigorEmpty");
/** Type guard checking whether a value is the {@link VigorEmpty} sentinel. */
const isVigorEmpty = (v) => v === VigorEmpty;

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
class VigorStatus {
    _base;
    _config;
    /**
     * @param base - The default/base config for this builder.
     * @param config - The (possibly partial) config to merge onto `base`.
     */
    constructor(base, config) {
        this._base = base;
        this._config = this._merge(base, config);
    }
    /**
     * Derives a new instance by merging `patch` onto the current config.
     *
     * @param patch - Values to overwrite/merge in for this step.
     * @param strategy - Optional tree mirroring the shape of `patch`, whose
     *  leaves may be `"replace" | "concat" | "merge"` to force the merge
     *  behavior at that path. Paths without a strategy fall back to the
     *  default behavior (deep merge for objects, concat for arrays).
     */
    _next(patch, strategy) {
        const merged = this._merge(this._config, patch, strategy);
        return this._create(merged);
    }
    /**
     * Deep-merges `target` onto `source`, honoring an optional per-path
     * `strategy` tree. Objects merge key by key, arrays concatenate (unless
     * `"replace"` is specified), and any other value is overwritten.
     */
    _merge(source, target, strategy) {
        const isObj = (v) => v !== null &&
            typeof v === "object" &&
            Object.getPrototypeOf(v) === Object.prototype;
        const merge = (a, b, s) => {
            if (b === undefined || b === null)
                return a;
            if (s === "replace")
                return b;
            if (Array.isArray(a) && Array.isArray(b)) {
                return s === "replace" ? b : [...a, ...b];
            }
            if (isObj(a) && isObj(b)) {
                const r = { ...a };
                const sObj = isObj(s) ? s : undefined;
                for (const k of Object.keys(b)) {
                    r[k] = merge(a[k], b[k], sObj?.[k]);
                }
                return r;
            }
            return b;
        };
        return merge(source, target, strategy);
    }
    /** The default/base config this builder was constructed with. */
    get base() {
        return this._base;
    }
    /** The current, merged config for this builder instance. */
    get config() {
        return this._config;
    }
}

const VigorAllPolicySettingsBase = {
    __brand: createBrand("All", "Policy<Settings<Schema"),
    concurrency: 5,
    onlySuccess: false
};
/** Immutable builder for an all-policy's general settings. */
class VigorAllPolicySettings extends VigorStatus {
    constructor(config = VigorAllBase) {
        super(VigorAllBase, config);
    }
    _create(config) {
        return new VigorAllPolicySettings(config);
    }
    /** Sets the maximum number of tasks run concurrently. */
    concurrency(num) {
        return this._next({ policy: { settings: { concurrency: num } } });
    }
    /** When enabled, filters the final result down to only the tasks that succeeded. */
    onlySuccess(bool) {
        return this._next({ policy: { settings: { onlySuccess: bool } } });
    }
}

const VigorAllPolicyMiddlewaresBase = {
    __brand: createBrand("All", "Policy<Middlewares<Schema"),
    before: [],
    after: [],
    onError: []
};
/** Immutable builder for an all-policy's per-task middleware pipeline (`before`, `after`, `onError`). */
class VigorAllPolicyMiddlewares extends VigorStatus {
    constructor(config = VigorAllBase) {
        super(VigorAllBase, config);
    }
    _create(config) {
        return new VigorAllPolicyMiddlewares(config);
    }
    /** Registers a middleware that runs before each task is invoked. */
    before(func) {
        return this._next({ policy: { middlewares: { before: [func] } } });
    }
    /** Registers a middleware that runs after each task settles successfully. */
    after(func) {
        return this._next({ policy: { middlewares: { after: [func] } } });
    }
    /** Registers a middleware that runs when an individual task fails. */
    onError(func) {
        return this._next({ policy: { middlewares: { onError: [func] } } });
    }
}

const VigorAllPolicyBase = {
    __brand: createBrand("All", "Policy<Schema"),
    target: [],
    settings: VigorAllPolicySettingsBase,
    middlewares: VigorAllPolicyMiddlewaresBase
};

const VigorAllContextBase = {
    __brand: createBrand("All", "Context<Schema"),
    result: VigorDefault,
    policy: VigorAllPolicyBase,
    record: {}
};
const VigorAllEachContextBase = {
    __brand: createBrand("All", "EachContext<Schema"),
    result: VigorDefault,
    error: VigorDefault,
    flags: { overrided: false },
    record: {}
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
class VigorError extends Error {
    timestamp = new Date();
    cause;
    code;
    data;
    method;
    context;
    /**
     * @param code - Machine-readable error code.
     * @param message - Human-readable message (rendered after the `[code]` prefix).
     * @param options - Additional error metadata (cause, data, method, context).
     */
    constructor(code, message, options) {
        super(`[${code}] ${message}`);
        this.name = new.target.name;
        this.code = code;
        this.cause = options.cause;
        this.data = options.data;
        this.method = options.method;
        this.context = options.context;
        Object.setPrototypeOf(this, new.target.prototype);
        Error.captureStackTrace?.(this, new.target);
    }
}

const VigorAllErrorMessageFuncs = {
    EMPTY_TARGET: (_) => `Empty target list`,
};
/** Error type thrown by the all module. */
class VigorAllError extends VigorError {
    /**
     * @param code - One of the all module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code, options) {
        const messageFn = VigorAllErrorMessageFuncs[code];
        super(code, messageFn(options.data), options);
    }
}

const VigorAllBase = {
    __brand: createBrand("All", "Schema"),
    policy: VigorAllPolicyBase,
    context: VigorAllContextBase
};
/**
 * Immutable builder that runs a list of independent tasks with bounded
 * concurrency, per-task middleware, and either an all-results or
 * only-successes result mode.
 */
class VigorAll extends VigorStatus {
    constructor(config = VigorAllBase) {
        super(VigorAllBase, config);
    }
    _create(config) {
        return new VigorAll(config);
    }
    /** Sets the list of tasks to run. */
    target(...funcs) {
        return this._next({ policy: { target: funcs } });
    }
    /** Configures the all-policy's general settings (concurrency, onlySuccess). */
    settings(input) {
        if (typeof input === 'function' || input instanceof VigorAllPolicySettings) {
            const result = typeof input === 'function'
                ? input(new VigorAllPolicySettings())
                : input;
            return this._next(result.config);
        }
        return this._next({ policy: { settings: input } });
    }
    /** Configures the all-policy's per-task middleware pipeline. */
    middlewares(input) {
        if (typeof input === 'function' || input instanceof VigorAllPolicyMiddlewares) {
            const result = typeof input === 'function'
                ? input(new VigorAllPolicyMiddlewares())
                : input;
            return this._next(result.config);
        }
        return this._next({ policy: { middlewares: input } });
    }
    /** Runs a single task through the before/after/onError middleware pipeline. */
    async _runTask(task, policy) {
        let ctx = { ...VigorAllEachContextBase };
        try {
            for (const before of policy.middlewares.before)
                await before(ctx);
            ctx.result = await task();
            for (const after of policy.middlewares.after)
                await after(ctx);
            return { success: true, value: ctx.result };
        }
        catch (error) {
            ctx.error = error;
            const setResult = (r) => { ctx.flags.overrided = true; ctx.result = r; };
            for (const onError of policy.middlewares.onError)
                await onError(ctx, { setResult });
            if (ctx.flags.overrided)
                return { success: true, value: ctx.result };
            return { success: false, value: error };
        }
    }
    /** Runs all tasks and returns the results array directly, throwing on final failure. */
    async request() {
        const res = await this.requestVerbose();
        if (res.success)
            return res.data;
        throw res.error;
    }
    /** Runs all tasks and returns a result/error envelope instead of throwing. */
    async requestVerbose() {
        return await this.requestRuntime();
    }
    /** Internal execution loop implementing the bounded-concurrency worker pool. */
    async requestRuntime(restartAttempt = 1) {
        const config = this._merge(this.config, {});
        const policy = config.policy;
        try {
            if (policy.target.length === 0)
                throw new VigorAllError("EMPTY_TARGET", {
                    method: "request",
                    data: {}
                });
            const concurrency = Math.max(1, policy.settings.concurrency);
            const results = new Array(policy.target.length);
            let cursor = 0;
            const worker = async () => {
                while (true) {
                    const i = cursor++;
                    if (i >= policy.target.length)
                        return;
                    results[i] = await this._runTask(policy.target[i], policy);
                }
            };
            await Promise.all(Array.from({ length: Math.min(concurrency, policy.target.length) }, () => worker()));
            const result = policy.settings.onlySuccess
                ? results.filter(r => r.success).map(r => r.value)
                : results.map(r => r.value);
            return {
                success: true,
                data: result,
                error: null
            };
        }
        catch (error) {
            return {
                success: false,
                data: null,
                error
            };
        }
    }
}

const VigorFetchPolicySettingsBase = {
    __brand: createBrand("Fetch", "Policy<Settings<Schema"),
    retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"],
    unretryStatus: [400, 401, 403, 404, 405, 413, 422],
    maxRestarts: 3,
    default: VigorEmpty
};
/** Immutable builder for a fetch policy's general settings. */
class VigorFetchPolicySettings extends VigorStatus {
    constructor(config = VigorFetchBase) {
        super(VigorFetchBase, config);
    }
    _create(config) {
        return new VigorFetchPolicySettings(config);
    }
    /** Sets response headers consulted to compute a server-suggested retry delay. */
    retryHeaders(...strs) {
        return this._next({ policy: { settings: { retryHeaders: strs } } });
    }
    /** Sets HTTP status codes that should never be retried. */
    unretryStatus(...nums) {
        return this._next({ policy: { settings: { unretryStatus: nums } } });
    }
    /** Sets the maximum number of full restarts allowed. */
    maxRestarts(num) {
        return this._next({ policy: { settings: { maxRestarts: num } } });
    }
    /** Sets the fallback value/factory used when the request ultimately fails. */
    default(func) {
        return this._next({ policy: { settings: { default: func } } });
    }
}

const VigorFetchPolicyMiddlewaresBase = {
    __brand: createBrand("Fetch", "Policy<Middlewares<Schema"),
    before: [],
    after: [],
    onResult: [],
    onError: []
};
/**
 * Immutable builder for a fetch policy's middleware pipeline (`before`,
 * `after`, `onResult`, `onError`). Each stage accepts either "fluent"
 * middleware (returns a plain value merged into the context) or
 * "intercept" middleware (receives an explicit API to mutate control flow).
 */
class VigorFetchPolicyMiddlewares extends VigorStatus {
    constructor(config = VigorFetchBase) {
        super(VigorFetchBase, config);
    }
    _create(config) {
        return new VigorFetchPolicyMiddlewares(config);
    }
    before(type, func) {
        return this._next({ policy: { middlewares: { before: [{ _mode: type, func }] } } });
    }
    after(type, func) {
        return this._next({ policy: { middlewares: { after: [{ _mode: type, func }] } } });
    }
    onResult(type, func) {
        return this._next({ policy: { middlewares: { onResult: [{ _mode: type, func }] } } });
    }
    onError(type, func) {
        return this._next({ policy: { middlewares: { onError: [{ _mode: type, func }] } } });
    }
}

const VigorRetryPolicySettingsBase = {
    __brand: createBrand("Retry", "Policy<Settings<Schema"),
    default: VigorEmpty,
    maxAttempts: 5,
    maxRestarts: 3,
    timeout: 20000
};
/** Immutable builder for a retry policy's general settings. */
class VigorRetryPolicySettings extends VigorStatus {
    constructor(config = VigorRetryBase) {
        super(VigorRetryBase, config);
    }
    _create(config) {
        return new VigorRetryPolicySettings(config);
    }
    /** Sets the fallback value/factory used when the target ultimately fails. */
    default(func) {
        return this._next({
            policy: { settings: { default: func } }
        });
    }
    /** Sets the maximum number of retry attempts before giving up. */
    maxAttempts(num) {
        return this._next({
            policy: { settings: { maxAttempts: num } }
        });
    }
    /** Sets the maximum number of full restarts allowed. */
    maxRestarts(num) {
        return this._next({
            policy: { settings: { maxRestarts: num } }
        });
    }
    /** Sets the timeout, in milliseconds, for a single attempt. */
    timeout(num) {
        return this._next({
            policy: { settings: { timeout: num } }
        });
    }
}

const VigorRetryPolicyMiddlewaresBase = {
    __brand: createBrand("Retry", "Policy<Middlewares<Schema"),
    before: [],
    after: [],
    onResult: [],
    retryIf: [],
    onRetry: [],
    onError: []
};
/**
 * Immutable builder for a retry policy's middleware pipeline (`before`,
 * `after`, `onResult`, `retryIf`, `onRetry`, `onError`). Each stage accepts
 * either "fluent" middleware (returns a plain value merged into the
 * context) or "intercept" middleware (receives an explicit API to mutate
 * control flow).
 */
class VigorRetryPolicyMiddlewares extends VigorStatus {
    constructor(config = VigorRetryBase) {
        super(VigorRetryBase, config);
    }
    _create(config) {
        return new VigorRetryPolicyMiddlewares(config);
    }
    before(type, func) {
        return this._next({
            policy: { middlewares: { before: [{ _mode: type, func }] } }
        });
    }
    after(type, func) {
        return this._next({
            policy: { middlewares: { after: [{ _mode: type, func }] } }
        });
    }
    onResult(type, func) {
        return this._next({
            policy: { middlewares: { onResult: [{ _mode: type, func }] } }
        });
    }
    retryIf(type, func) {
        return this._next({
            policy: { middlewares: { retryIf: [{ _mode: type, func }] } }
        });
    }
    onRetry(type, func) {
        return this._next({
            policy: { middlewares: { onRetry: [{ _mode: type, func }] } }
        });
    }
    onError(type, func) {
        return this._next({
            policy: { middlewares: { onError: [{ _mode: type, func }] } }
        });
    }
}

const VigorRetryErrorMessageFuncs = {
    VALUE_REQUIRED: ({ key }) => `Value Required (missing ${key})`,
    RETRY_EXHAUSTED: ({ maxAttempts }) => `Retry exhausted, (max ${maxAttempts})`,
    RESTART_EXHAUSTED: ({ maxAttempts }) => `Restart exhausted, (max ${maxAttempts})`,
    TIMED_OUT: ({ limit }) => `Timeout: exceeded ${limit}ms`,
};
/** Error type thrown by the retry module. */
class VigorRetryError extends VigorError {
    /**
     * @param code - One of the retry module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code, options) {
        const messageFn = VigorRetryErrorMessageFuncs[code];
        super(code, messageFn(options.data), options);
    }
}

/** Returns a random offset in the range `[-jitter, +jitter]` to randomize a computed delay. */
function VigorJitter(jitter) {
    return (Math.random() * 2 - 1) * jitter;
}
const VigorRetryPolicyAlgorithmsConstantBase = {
    __brand: createBrand("Retry", "Policy<Algorithms<Constant<Schema"),
    _tag: "constant",
    jitter: 1000,
    interval: 2000,
    _calculateDelay: (att, config) => {
        const { interval, jitter } = config;
        const min = jitter;
        let delay = Math.max(min, interval);
        delay += VigorJitter(jitter);
        return delay;
    }
};
/** Immutable builder for the constant-interval retry delay algorithm. */
class VigorRetryPolicyAlgorithmsConstant extends VigorStatus {
    constructor(config = VigorRetryPolicyAlgorithmsConstantBase) {
        super(VigorRetryPolicyAlgorithmsConstantBase, config);
    }
    _create(config) {
        return new VigorRetryPolicyAlgorithmsConstant(config);
    }
    /** Sets the amount of random jitter added to the computed delay. */
    jitter(num) {
        return this._next({ jitter: num });
    }
    /** Sets the fixed delay interval, in milliseconds. */
    interval(num) {
        return this._next({ interval: num });
    }
}
const VigorRetryPolicyAlgorithmsLinearBase = {
    __brand: createBrand("Retry", "Policy<Algorithms<Linear<Schema"),
    _tag: "linear",
    jitter: 1000,
    initial: 500,
    increment: 1000,
    minDelay: 0,
    maxDelay: 10000,
    _calculateDelay: (att, config) => {
        const { initial, jitter, increment, minDelay, maxDelay } = config;
        const range = maxDelay - minDelay;
        const j = Math.min(jitter, range / 2);
        const min = minDelay + j;
        const max = maxDelay - j;
        let delay = initial + increment * att;
        delay = Math.max(min, Math.min(max, delay));
        delay += VigorJitter(j);
        return delay;
    }
};
/** Immutable builder for the linearly-increasing retry delay algorithm. */
class VigorRetryPolicyAlgorithmsLinear extends VigorStatus {
    constructor(config = VigorRetryPolicyAlgorithmsLinearBase) {
        super(VigorRetryPolicyAlgorithmsLinearBase, config);
    }
    _create(config) {
        return new VigorRetryPolicyAlgorithmsLinear(config);
    }
    /** Sets the amount of random jitter added to the computed delay. */
    jitter(num) {
        return this._next({ jitter: num });
    }
    /** Sets the initial delay, in milliseconds, before the first retry. */
    initial(num) {
        return this._next({ initial: num });
    }
    /** Sets how much the delay grows, in milliseconds, per attempt. */
    increment(num) {
        return this._next({ increment: num });
    }
    /** Sets the minimum allowed delay, in milliseconds. */
    minDelay(num) {
        return this._next({ minDelay: num });
    }
    /** Sets the maximum allowed delay, in milliseconds. */
    maxDelay(num) {
        return this._next({ maxDelay: num });
    }
}
const VigorRetryPolicyAlgorithmsBackoffBase = {
    __brand: createBrand("Retry", "Policy<Algorithms<Backoff<Schema"),
    _tag: "backoff",
    jitter: 800,
    initial: 0,
    multiplier: 1.7,
    unit: 1000,
    minDelay: 500,
    maxDelay: 10000,
    _calculateDelay: (att, config) => {
        const { jitter, initial, multiplier, unit, minDelay, maxDelay } = config;
        const range = maxDelay - minDelay;
        const j = Math.min(jitter, range / 2);
        const min = minDelay + j;
        const max = maxDelay - j;
        let delay = initial + unit * Math.pow(multiplier, att);
        delay = Math.max(min, Math.min(max, delay));
        delay += VigorJitter(j);
        return delay;
    }
};
/** Immutable builder for the exponential-backoff retry delay algorithm. */
class VigorRetryPolicyAlgorithmsBackoff extends VigorStatus {
    constructor(config = VigorRetryPolicyAlgorithmsBackoffBase) {
        super(VigorRetryPolicyAlgorithmsBackoffBase, config);
    }
    _create(config) {
        return new VigorRetryPolicyAlgorithmsBackoff(config);
    }
    /** Sets the amount of random jitter added to the computed delay. */
    jitter(num) {
        return this._next({ jitter: num });
    }
    /** Sets the initial delay, in milliseconds, before backoff growth is applied. */
    initial(num) {
        return this._next({ initial: num });
    }
    /** Sets the exponential growth factor applied per attempt. */
    multiplier(num) {
        return this._next({ multiplier: num });
    }
    /** Sets the base unit, in milliseconds, the multiplier is scaled by. */
    unit(num) {
        return this._next({ unit: num });
    }
    /** Sets the minimum allowed delay, in milliseconds. */
    minDelay(num) {
        return this._next({ minDelay: num });
    }
    /** Sets the maximum allowed delay, in milliseconds. */
    maxDelay(num) {
        return this._next({ maxDelay: num });
    }
}
const VigorRetryPolicyAlgorithmsCustomBase = {
    __brand: createBrand("Retry", "Policy<Algorithms<Custom<Schema"),
    _tag: "custom",
    jitter: 800,
    minDelay: 500,
    maxDelay: 10000,
    target: VigorEmpty,
    _calculateDelay: (att, config) => {
        const { jitter, minDelay, maxDelay, target } = config;
        if (isVigorEmpty(target))
            throw new VigorRetryError("VALUE_REQUIRED", {
                method: "_calculateDelay",
                data: {
                    key: "target"
                }
            });
        const range = maxDelay - minDelay;
        const j = Math.min(jitter, range / 2);
        const min = minDelay + j;
        const max = maxDelay - j;
        let delay = target(att);
        delay = Math.max(min, Math.min(max, delay));
        delay += VigorJitter(j);
        return delay;
    }
};
/** Immutable builder for a user-supplied custom retry delay algorithm. */
class VigorRetryPolicyAlgorithmsCustom extends VigorStatus {
    constructor(config = VigorRetryPolicyAlgorithmsCustomBase) {
        super(VigorRetryPolicyAlgorithmsCustomBase, config);
    }
    _create(config) {
        return new VigorRetryPolicyAlgorithmsCustom(config);
    }
    /** Sets the amount of random jitter added to the computed delay. */
    jitter(num) {
        return this._next({ jitter: num });
    }
    /** Sets the minimum allowed delay, in milliseconds. */
    minDelay(num) {
        return this._next({ minDelay: num });
    }
    /** Sets the maximum allowed delay, in milliseconds. */
    maxDelay(num) {
        return this._next({ maxDelay: num });
    }
    /** Sets the user-supplied function computing the raw delay for an attempt. */
    target(func) {
        return this._next({ target: func });
    }
}
const VigorRetryPolicyAlgorithmsBase = VigorRetryPolicyAlgorithmsConstantBase;
/**
 * Immutable builder for selecting a retry policy's delay algorithm.
 *
 * Switching algorithms (`constant`/`linear`/`backoff`/`custom`) always
 * replaces the previous algorithm's config wholesale via the `"replace"`
 * merge strategy, since the different algorithms' fields are not
 * compatible with one another.
 */
class VigorRetryPolicyAlgorithms extends VigorStatus {
    constructor(config = VigorRetryBase) {
        super(VigorRetryBase, config);
    }
    _create(config) {
        return new VigorRetryPolicyAlgorithms(config);
    }
    /** Switches to the constant-interval delay algorithm. */
    constant(input) {
        const leaf = this._merge(VigorRetryPolicyAlgorithmsConstantBase, input ?? {});
        return this._next({
            policy: { algorithms: leaf }
        }, { policy: { algorithms: "replace" } });
    }
    /** Switches to the linearly-increasing delay algorithm. */
    linear(input) {
        const leaf = this._merge(VigorRetryPolicyAlgorithmsLinearBase, input ?? {});
        return this._next({
            policy: { algorithms: leaf }
        }, { policy: { algorithms: "replace" } });
    }
    /** Switches to the exponential-backoff delay algorithm. */
    backoff(input) {
        const leaf = this._merge(VigorRetryPolicyAlgorithmsBackoffBase, input ?? {});
        return this._next({
            policy: { algorithms: leaf }
        }, { policy: { algorithms: "replace" } });
    }
    /** Switches to a user-supplied custom delay algorithm. */
    custom(input) {
        const leaf = this._merge(VigorRetryPolicyAlgorithmsCustomBase, input ?? {});
        return this._next({
            policy: { algorithms: leaf }
        }, { policy: { algorithms: "replace" } });
    }
}

const VigorRetryPolicyBase = {
    __brand: createBrand("Retry", "Policy<Schema"),
    target: VigorEmpty,
    abortSignals: [],
    settings: VigorRetryPolicySettingsBase,
    middlewares: VigorRetryPolicyMiddlewaresBase,
    algorithms: VigorRetryPolicyAlgorithmsBase
};

const VigorRetryContextBase = {
    __brand: createBrand("Retry", "Context<Schema"),
    result: VigorDefault,
    error: VigorDefault,
    system: {
        delay: VigorDefault,
        attempt: 0
    },
    flags: {
        doRetry: true,
        doRestart: false,
        brokeRetry: false,
        overridden: false
    },
    record: {},
    policy: VigorRetryPolicyBase
};

const VigorRetryBase = {
    __brand: createBrand("Retry", "Schema"),
    policy: VigorRetryPolicyBase,
    context: VigorRetryContextBase
};
/**
 * Immutable builder that executes a target function with retry, restart,
 * timeout, and abort support, driven by a configurable delay algorithm and
 * middleware pipeline.
 */
class VigorRetry extends VigorStatus {
    constructor(config = VigorRetryBase) {
        super(VigorRetryBase, config);
    }
    _create(config) {
        return new VigorRetry(config);
    }
    /** Sets the target function to invoke, with retry/timeout applied. */
    target(func) {
        return this._next({
            policy: { target: func }
        });
    }
    /** Sets external abort signals that, when aborted, stop retrying. */
    abortSignals(...sig) {
        return this._next({
            policy: { abortSignals: sig }
        });
    }
    /** Configures the retry policy's general settings (max attempts, timeout, etc). */
    settings(input) {
        if (typeof input === 'function' || input instanceof VigorRetryPolicySettings) {
            const result = typeof input === 'function'
                ? input(new VigorRetryPolicySettings())
                : input;
            return this._next(result.config);
        }
        return this._next({
            policy: { settings: input }
        });
    }
    /** Configures the retry policy's middleware pipeline. */
    middlewares(input) {
        if (typeof input === 'function' || input instanceof VigorRetryPolicyMiddlewares) {
            const result = typeof input === 'function'
                ? input(new VigorRetryPolicyMiddlewares())
                : input;
            return this._next(result.config);
        }
        return this._next({
            policy: { middlewares: input }
        });
    }
    /** Configures the retry policy's delay algorithm. */
    algorithms(input) {
        if (typeof input === 'function') {
            const result = input(new VigorRetryPolicyAlgorithms());
            const algoSlice = result.config.policy.algorithms;
            return this._next({
                policy: { algorithms: algoSlice }
            }, { policy: { algorithms: "replace" } });
        }
        return this._next({
            policy: { algorithms: input }
        }, { policy: { algorithms: "replace" } });
    }
    /** Runs the target and returns its result directly, throwing on final failure. */
    async request() {
        const res = await this.requestVerbose();
        if (res.success)
            return res.data;
        throw res.error;
    }
    /** Runs the target and returns a result/error envelope instead of throwing. */
    async requestVerbose() {
        return await this.requestRuntime();
    }
    /** Internal execution loop implementing the attempt/retry/restart lifecycle. */
    async requestRuntime(restartAttempt = 1) {
        const config = this._merge(this.config, {});
        let ctx = {
            ...config.context,
            policy: config.policy
        };
        if (isVigorEmpty(ctx.policy.target))
            throw new VigorRetryError("VALUE_REQUIRED", {
                method: "request",
                data: {
                    key: "target"
                },
                context: ctx
            });
        const target = ctx.policy.target;
        const throwError = (err) => {
            throw err;
        };
        try {
            while (ctx.system.attempt < ctx.policy.settings.maxAttempts) {
                ctx.system.attempt++;
                try {
                    const breakRetry = (err) => {
                        ctx.flags.brokeRetry = true;
                        throw err;
                    };
                    const userController = new AbortController();
                    const timeoutController = new AbortController();
                    const innerSignals = AbortSignal.any([
                        userController.signal,
                        timeoutController.signal
                    ]);
                    const outerSignals = AbortSignal.any(ctx.policy.abortSignals);
                    const autoBreak = () => {
                        ctx.flags.brokeRetry = true;
                    };
                    outerSignals.addEventListener("abort", autoBreak);
                    const mergedSignals = AbortSignal.any([
                        innerSignals,
                        outerSignals
                    ]);
                    let onAbort;
                    let timeoutId;
                    try {
                        for (const middleware of ctx.policy.middlewares.before) {
                            if (middleware._mode === "fluent") {
                                await middleware.func(ctx);
                            }
                            else {
                                ctx = await middleware.func(ctx, {
                                    abort: (reason) => userController.abort(reason),
                                    throwError,
                                    breakRetry
                                });
                            }
                        }
                        mergedSignals.throwIfAborted();
                        timeoutId = setTimeout(() => timeoutController.abort(new VigorRetryError("TIMED_OUT", {
                            method: "request",
                            data: {
                                limit: ctx.policy.settings.timeout
                            }
                        })), ctx.policy.settings.timeout);
                        ctx.result = await Promise.race([
                            target(mergedSignals),
                            new Promise((_, rej) => {
                                onAbort = () => rej(mergedSignals.reason);
                                mergedSignals.addEventListener("abort", onAbort);
                            })
                        ]);
                        for (const middleware of ctx.policy.middlewares.after) {
                            if (middleware._mode === "fluent") {
                                await middleware.func(ctx);
                            }
                            else {
                                ctx = await middleware.func(ctx, {
                                    throwError
                                });
                            }
                        }
                        const setResult = (res) => {
                            ctx.result = res;
                        };
                        for (const middleware of ctx.policy.middlewares.onResult) {
                            if (middleware._mode === "fluent") {
                                ctx.result = await middleware.func(ctx.result);
                            }
                            else {
                                ctx = await middleware.func(ctx, {
                                    setResult,
                                    throwError
                                });
                            }
                        }
                        return {
                            success: true,
                            data: ctx.result,
                            error: null
                        };
                    }
                    finally {
                        clearTimeout(timeoutId);
                        outerSignals.removeEventListener("abort", autoBreak);
                        if (onAbort)
                            mergedSignals.removeEventListener("abort", onAbort);
                    }
                }
                catch (error) {
                    ctx.error = error;
                    if (ctx.flags.brokeRetry)
                        throw ctx.error;
                    ctx.flags.doRetry = true;
                    const proceedRetry = () => ctx.flags.doRetry = true;
                    const cancelRetry = () => ctx.flags.doRetry = false;
                    for (const middleware of ctx.policy.middlewares.retryIf) {
                        if (middleware._mode === "fluent") {
                            ctx.flags.doRetry = await middleware.func(ctx.error);
                        }
                        else {
                            ctx = await middleware.func(ctx, {
                                proceedRetry,
                                cancelRetry
                            });
                        }
                    }
                    if (!ctx.flags.doRetry)
                        throw ctx.error;
                    ctx.system.delay = ctx.policy.algorithms._calculateDelay(ctx.system.attempt, ctx.policy.algorithms);
                    const setDelay = (num) => {
                        ctx.system.delay = num;
                    };
                    for (const middleware of ctx.policy.middlewares.onRetry) {
                        if (middleware._mode === "fluent") {
                            await middleware.func(ctx.error);
                        }
                        else {
                            ctx = await middleware.func(ctx, {
                                throwError,
                                setDelay
                            });
                        }
                    }
                    const delay = ctx.system.delay;
                    await new Promise(res => setTimeout(res, delay));
                }
            }
            throw new VigorRetryError("RETRY_EXHAUSTED", {
                method: "request",
                data: {
                    maxAttempts: ctx.policy.settings.maxAttempts
                }
            });
        }
        catch (error) {
            ctx.error = error;
            ctx.flags.doRestart = false;
            ctx.flags.overridden = false;
            const setResult = (res) => {
                ctx.flags.overridden = true;
                ctx.result = res;
            };
            const proceedRestart = () => ctx.flags.doRestart = true;
            const cancelRestart = () => ctx.flags.doRestart = false;
            for (const middleware of ctx.policy.middlewares.onError) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx.error);
                }
                else {
                    ctx = await middleware.func(ctx, {
                        setResult,
                        throwError,
                        proceedRestart,
                        cancelRestart
                    });
                }
            }
            if (ctx.flags.doRestart) {
                if (restartAttempt + 1 > ctx.policy.settings.maxRestarts)
                    throw new VigorRetryError("RESTART_EXHAUSTED", {
                        method: "request",
                        data: {
                            maxAttempts: ctx.policy.settings.maxRestarts
                        }
                    });
                return await this.requestRuntime(restartAttempt + 1);
            }
            if (ctx.flags.overridden)
                return {
                    success: true,
                    data: ctx.result,
                    error: null
                };
            if (!isVigorEmpty(ctx.policy.settings.default)) {
                const data = await ctx.policy.settings.default(ctx);
                return {
                    success: true,
                    data,
                    error: null
                };
            }
            return {
                success: false,
                data: null,
                error: ctx.error
            };
        }
    }
}

const VigorParsePolicySettingsBase = {
    __brand: createBrand("Parse", "Policy<Settings<Schema"),
    raw: false,
    default: VigorEmpty,
    maxRestarts: 3
};
/** Immutable builder for a parse policy's general settings. */
class VigorParsePolicySettings extends VigorStatus {
    constructor(config = VigorParseBase) {
        super(VigorParseBase, config);
    }
    _create(config) {
        return new VigorParsePolicySettings(config);
    }
    /** When enabled, skips content-type based parsing and returns the raw response. */
    raw(bool) {
        return this._next({
            policy: { settings: { raw: bool } }
        });
    }
    /** Sets the fallback value/factory used when parsing ultimately fails. */
    default(func) {
        return this._next({
            policy: { settings: { default: func } }
        });
    }
    /** Sets the maximum number of full restarts allowed. */
    maxRestarts(num) {
        return this._next({
            policy: { settings: { maxRestarts: num } }
        });
    }
}

const VigorParsePolicyMiddlewaresBase = {
    __brand: createBrand("Parse", "Policy<Middlewares<Schema"),
    before: [],
    after: [],
    onResult: [],
    onError: []
};
/**
 * Immutable builder for a parse policy's middleware pipeline (`before`,
 * `after`, `onResult`, `onError`). Each stage accepts either "fluent"
 * middleware (returns a plain value merged into the context) or
 * "intercept" middleware (receives an explicit API to mutate control flow).
 */
class VigorParsePolicyMiddlewares extends VigorStatus {
    constructor(config = VigorParseBase) {
        super(VigorParseBase, config);
    }
    _create(config) {
        return new VigorParsePolicyMiddlewares(config);
    }
    before(type, func) {
        return this._next({ policy: { middlewares: { before: [{ _mode: type, func }] } } });
    }
    after(type, func) {
        return this._next({ policy: { middlewares: { after: [{ _mode: type, func }] } } });
    }
    onResult(type, func) {
        return this._next({ policy: { middlewares: { onResult: [{ _mode: type, func }] } } });
    }
    onError(type, func) {
        return this._next({ policy: { middlewares: { onError: [{ _mode: type, func }] } } });
    }
}

const VigorParseErrorMessageFuncs = {
    VALUE_REQUIRED: ({ key }) => `Value Required (missing ${key})`,
    INVALID_CONTENT_TYPE: ({ received }) => `Invalid Content-Type header: ${String(received)}`,
    PARSER_NOT_FOUND: ({ received, expected }) => `Parser not found for Content-Type "${String(received)}" (known: ${expected.join(", ")})`,
    PARSER_ALL_FAILED: ({ tried }) => `All parsers failed, tried: ${tried.join(", ")}`,
    RESTART_EXHAUSTED: ({ maxAttempts }) => `Restart exhausted, (max ${maxAttempts})`,
};
/** Error type thrown by the parse module. */
class VigorParseError extends VigorError {
    /**
     * @param code - One of the parse module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code, options) {
        const messageFn = VigorParseErrorMessageFuncs[code];
        super(code, messageFn(options.data), options);
    }
}

const VigorParsePolicyStrategiesBase = {
    __brand: createBrand("Parse", "Policy<Strategies<Schema"),
    funcs: []
};
const ContentTypeParsers = [
    { header: "application/json", regExp: /application\/(.+\+)?json(.+\+)?/i, method: (res) => res.json() },
    { header: "application/xml", regExp: /application\/(.+\+)?xml(.+\+)?/i, method: (res) => res.text() },
    { header: "application/x-www-form-urlencoded", regExp: /application\/(.+\+)?x-www-form-urlencoded(.+\+)?/i, method: (res) => res.formData() },
    { header: "application/octet-stream", regExp: /application\/(.+\+)?octet-stream(.+\+)?/i, method: (res) => res.arrayBuffer() },
    { header: "image/*", regExp: /^image\/.+/i, method: (res) => res.blob() },
    { header: "audio/*", regExp: /^audio\/.+/i, method: (res) => res.blob() },
    { header: "video/*", regExp: /^video\/.+/i, method: (res) => res.blob() },
    { header: "multipart/form-data", regExp: /multipart\/(.+\+)?form-data(.+\+)?/i, method: (res) => res.formData() },
    { header: "text/*", regExp: /^text\/.+/i, method: (res) => res.text() },
];
const SniffMethods = [
    { title: "json", method: (res) => res.json() },
    { title: "formData", method: (res) => res.formData() },
    { title: "text", method: (res) => res.text() },
    { title: "blob", method: (res) => res.blob() },
];
/** Parses a response by matching its `Content-Type` header against a known parser table. */
const VigorParseContentTypeStrategy = async (response) => {
    const contentTypeHeader = response.headers.get("content-type");
    if (!contentTypeHeader)
        throw new VigorParseError("INVALID_CONTENT_TYPE", {
            method: "VigorParseContentTypeStrategy",
            data: { received: contentTypeHeader }
        });
    const toDo = ContentTypeParsers.find(parser => parser.regExp.test(contentTypeHeader));
    if (!toDo)
        throw new VigorParseError("PARSER_NOT_FOUND", {
            method: "VigorParseContentTypeStrategy",
            data: {
                expected: ContentTypeParsers.map(p => p.header),
                received: contentTypeHeader
            }
        });
    return await toDo.method(response);
};
/** Parses a response by trying a sequence of body-reading methods until one succeeds. */
const VigorParseSniffStrategy = async (response) => {
    for (const [i, parser] of SniffMethods.entries()) {
        const cloned = (i === SniffMethods.length - 1) ? response : response.clone();
        try {
            return await parser.method(cloned);
        }
        catch { }
    }
    throw new VigorParseError("PARSER_ALL_FAILED", {
        method: "VigorParseSniffStrategy",
        data: { tried: SniffMethods.map(p => p.title) }
    });
};
/** Immutable builder for a parse policy's fallback chain of parsing strategies. */
class VigorParsePolicyStrategies extends VigorStatus {
    constructor(config = VigorParseBase) {
        super(VigorParseBase, config);
    }
    _create(config) {
        return new VigorParsePolicyStrategies(config);
    }
    /**
     * Adds strategy functions to the fallback chain.
     *
     * @param replace - When `true`, replaces the existing chain instead of
     *  appending to it (the default is to concat, since strategies are
     *  tried in sequence as a fallback chain).
     */
    _set(funcs, replace) {
        return this._next({ policy: { strategies: { funcs } } }, replace ? { policy: { strategies: { funcs: "replace" } } } : undefined);
    }
    /** Adds the content-type based parsing strategy. */
    contentType(replace) { return this._set([VigorParseContentTypeStrategy], replace); }
    /** Adds the sniffing (try-each-method) parsing strategy. */
    sniff(replace) { return this._set([VigorParseSniffStrategy], replace); }
    /** Adds a strategy that always parses the response as JSON. */
    json(replace) { return this._set([(res) => res.json()], replace); }
    /** Adds a strategy that always parses the response as text. */
    text(replace) { return this._set([(res) => res.text()], replace); }
    /** Adds a strategy that always parses the response as an `ArrayBuffer`. */
    arrayBuffer(replace) { return this._set([(res) => res.arrayBuffer()], replace); }
    /** Adds a strategy that always parses the response as a `Blob`. */
    blob(replace) { return this._set([(res) => res.blob()], replace); }
    /** Adds a strategy that always parses the response as a `Uint8Array`. */
    bytes(replace) { return this._set([(res) => res.arrayBuffer().then(b => new Uint8Array(b))], replace); }
    /** Adds a strategy that always parses the response as `FormData`. */
    formData(replace) { return this._set([(res) => res.formData()], replace); }
    /** Adds a user-supplied custom parsing strategy. */
    custom(func, replace) { return this._set([func], replace); }
}

const VigorParsePolicyBase = {
    __brand: createBrand("Parse", "Policy<Schema"),
    target: VigorDefault,
    settings: VigorParsePolicySettingsBase,
    middlewares: VigorParsePolicyMiddlewaresBase,
    strategies: VigorParsePolicyStrategiesBase
};

const VigorParseContextBase = {
    __brand: createBrand("Parse", "Context<Schema"),
    result: VigorDefault,
    error: VigorDefault,
    response: VigorDefault,
    flags: {
        overrided: false,
        restarted: false
    },
    record: {},
    policy: VigorParsePolicyBase
};

const VigorParseBase = {
    __brand: createBrand("Parse", "Schema"),
    policy: VigorParsePolicyBase,
    context: VigorParseContextBase
};
/**
 * Immutable builder that parses an HTTP response into a result value,
 * trying each configured strategy in sequence with an optional middleware
 * pipeline and restart-on-failure support.
 */
class VigorParse extends VigorStatus {
    constructor(config = VigorParseBase) {
        super(VigorParseBase, config);
    }
    _create(config) {
        return new VigorParse(config);
    }
    /** Sets the `Response` object to parse. */
    target(response) {
        return this._next({ policy: { target: response } });
    }
    /** Configures the parse policy's general settings. */
    settings(input) {
        if (typeof input === 'function' || input instanceof VigorParsePolicySettings) {
            const result = typeof input === 'function'
                ? input(new VigorParsePolicySettings())
                : input;
            return this._next(result.config);
        }
        return this._next({ policy: { settings: input } });
    }
    /** Configures the parse policy's middleware pipeline. */
    middlewares(input) {
        if (typeof input === 'function' || input instanceof VigorParsePolicyMiddlewares) {
            const result = typeof input === 'function'
                ? input(new VigorParsePolicyMiddlewares())
                : input;
            return this._next(result.config);
        }
        return this._next({ policy: { middlewares: input } });
    }
    /** Configures the parse policy's fallback chain of parsing strategies. */
    strategies(input) {
        if (typeof input === 'function' || input instanceof VigorParsePolicyStrategies) {
            const result = typeof input === 'function'
                ? input(new VigorParsePolicyStrategies())
                : input;
            return this._next(result.config);
        }
        return this._next({ policy: { strategies: input } });
    }
    /** Runs parsing and returns the result directly, throwing on final failure. */
    async request() {
        const res = await this.requestVerbose();
        if (res.success)
            return res.data;
        throw res.error;
    }
    /** Runs parsing and returns a result/error envelope instead of throwing. */
    async requestVerbose() {
        return await this.requestRuntime();
    }
    /** Internal execution loop implementing the strategy fallback and restart handling. */
    async requestRuntime(restartAttempt = 1) {
        const config = this._merge(this.config, {});
        let ctx = {
            ...config.context,
            policy: config.policy
        };
        if (isVigorDefault(ctx.policy.target))
            throw new VigorParseError("VALUE_REQUIRED", {
                method: "request",
                data: { key: "target" },
                context: ctx
            });
        ctx.response = ctx.policy.target;
        const throwError = (err) => { throw err; };
        try {
            for (const middleware of ctx.policy.middlewares.before) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx);
                }
                else {
                    ctx = await middleware.func(ctx, { throwError });
                }
            }
            const response = ctx.response;
            if (ctx.policy.settings.raw) {
                ctx.result = response;
            }
            else {
                const funcs = ctx.policy.strategies.funcs.length > 0
                    ? ctx.policy.strategies.funcs
                    : [VigorParseContentTypeStrategy];
                let parsed = false;
                for (const [i, func] of funcs.entries()) {
                    const cloned = (i === funcs.length - 1) ? response : response.clone();
                    try {
                        ctx.result = await func(cloned);
                        parsed = true;
                        break;
                    }
                    catch { }
                }
                if (!parsed)
                    throw new VigorParseError("PARSER_ALL_FAILED", {
                        method: "request",
                        data: { tried: funcs.map((_, i) => `strategy#${i}`) },
                        context: ctx
                    });
            }
            const setResult = (res) => { ctx.result = res; };
            for (const middleware of ctx.policy.middlewares.after) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx);
                }
                else {
                    ctx = await middleware.func(ctx, { setResult, throwError });
                }
            }
            for (const middleware of ctx.policy.middlewares.onResult) {
                if (middleware._mode === "fluent") {
                    ctx.result = await middleware.func(ctx.result);
                }
                else {
                    ctx = await middleware.func(ctx, { setResult, throwError });
                }
            }
            return {
                success: true,
                data: ctx.result,
                error: null
            };
        }
        catch (error) {
            ctx.error = error;
            ctx.flags.overrided = false;
            ctx.flags.restarted = false;
            const setResult = (res) => {
                ctx.flags.overrided = true;
                ctx.result = res;
            };
            const proceedRestart = () => ctx.flags.restarted = true;
            const cancelRestart = () => ctx.flags.restarted = false;
            for (const middleware of ctx.policy.middlewares.onError) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx.error);
                }
                else {
                    ctx = await middleware.func(ctx, { setResult, throwError, proceedRestart, cancelRestart });
                }
            }
            if (ctx.flags.restarted) {
                if (restartAttempt + 1 > ctx.policy.settings.maxRestarts)
                    throw new VigorParseError("RESTART_EXHAUSTED", {
                        method: "request",
                        data: {
                            maxAttempts: ctx.policy.settings.maxRestarts
                        }
                    });
                return await this.requestRuntime(restartAttempt + 1);
            }
            if (ctx.flags.overrided)
                return {
                    success: true,
                    data: ctx.result,
                    error: null
                };
            if (!isVigorEmpty(ctx.policy.settings.default)) {
                const data = await ctx.policy.settings.default(ctx);
                return {
                    success: true,
                    data,
                    error: null
                };
            }
            return {
                success: false,
                data: null,
                error: ctx.error
            };
        }
    }
}

const VigorFetchPolicyBase = {
    __brand: createBrand("Fetch", "Policy<Schema"),
    method: VigorEmpty,
    origin: VigorEmpty,
    path: [],
    query: [],
    hash: "",
    headers: {},
    body: VigorEmpty,
    extra: {},
    settings: VigorFetchPolicySettingsBase,
    middlewares: VigorFetchPolicyMiddlewaresBase,
    retry: VigorRetryBase,
    parse: VigorParseBase
};

const VigorFetchContextBase = {
    __brand: createBrand("Fetch", "Context<Schema"),
    href: "",
    response: VigorDefault,
    result: VigorDefault,
    error: VigorDefault,
    options: VigorDefault,
    flags: {
        overrided: false,
        restarted: false
    },
    record: {},
    policy: VigorFetchPolicyBase
};

const VigorFetchErrorMessageFuncs = {
    VALUE_REQUIRED: ({ key }) => `Value Required (missing ${key})`,
    INVALID_BODY: ({ received }) => `Invalid Body type: ${typeof received}`,
    INVALID_PROTOCOL: ({ origin, base }) => base
        ? `Invalid URL: could not resolve "${origin}" against base "${base}"`
        : `Invalid URL: "${origin}" is not an absolute URL, and no base (window.location) is available to resolve it against — pass an absolute origin (e.g. "https://api.example.com") when running outside a browser`,
    FETCH_FAILED: ({ status, statusText }) => `Fetch Failed: ${status} ${statusText}`,
    RESTART_EXHAUSTED: ({ maxAttempts }) => `Restart exhausted, (max ${maxAttempts})`,
};
/** Error type thrown by the fetch module. */
class VigorFetchError extends VigorError {
    /**
     * @param code - One of the fetch module's error codes.
     * @param options - Error metadata, including the `data` payload for `code`.
     */
    constructor(code, options) {
        const messageFn = VigorFetchErrorMessageFuncs[code];
        super(code, messageFn(options.data), options);
    }
}

const VigorFetchBase = {
    __brand: createBrand("Fetch", "Schema"),
    policy: VigorFetchPolicyBase,
    context: VigorFetchContextBase
};
/**
 * Immutable builder that performs an HTTP request, composing an internal
 * {@link VigorRetry} engine (for retry/timeout/backoff) and a
 * {@link VigorParse} engine (for response parsing), with a configurable
 * middleware pipeline around request building and response handling.
 */
class VigorFetch extends VigorStatus {
    constructor(config = VigorFetchBase) {
        super(VigorFetchBase, config);
    }
    _create(config) {
        return new VigorFetch(config);
    }
    /** Sets the HTTP method. Defaults to `POST` when a body is set, otherwise `GET`. */
    method(str) { return this._next({ policy: { method: str } }); }
    /** Sets the request origin, either an absolute URL or a path relative to the current page. */
    origin(str) { return this._next({ policy: { origin: str } }); }
    /** Appends path segments to the request URL. */
    path(...strs) {
        return this._next({ policy: { path: this._stringifyList(strs) } });
    }
    /** Adds query-string parameter objects to the request URL. */
    query(...objs) {
        return this._next({ policy: { query: objs } });
    }
    /** Sets the URL fragment ("hash"), replacing any previous value. */
    hash(str) { return this._next({ policy: { hash: str } }, { policy: { hash: "replace" } }); }
    /**
     * Sets request headers.
     *
     * @param mode - `"overwrite"` discards all previously configured headers
     *  and keeps only the ones passed here. `"merge"` behaves like
     *  `Object.assign`, overwriting only the keys that overlap and keeping
     *  the rest.
     */
    headers(mode, obj) {
        if (mode === "overwrite")
            return this._next({ policy: { headers: obj } }, { policy: { headers: "replace" } });
        return this._next({ policy: { headers: obj } });
    }
    /**
     * Sets the request body.
     *
     * @param mode - `"overwrite"` discards the previous body and fully
     *  replaces it with this value. `"merge"` shallow-merges (via
     *  `Object.assign`) when both the previous and new body are plain
     *  objects; for any other body type (string/Blob/FormData/etc) it is
     *  simply replaced.
     */
    body(mode, obj) {
        if (mode === "overwrite")
            return this._next({ policy: { body: obj } }, { policy: { body: "replace" } });
        return this._next({ policy: { body: obj } });
    }
    /**
     * Sets additional `RequestInit` options other than headers/body/method/signal
     * (e.g. `credentials`, `mode`, `cache`, `redirect`, `referrer`,
     * `referrerPolicy`, `keepalive`, `integrity`).
     *
     * @param mode - `"overwrite"` discards all previously configured options
     *  and replaces them with this value. `"merge"` shallow-merges this
     *  value onto the previous options.
     */
    options(mode, obj) {
        if (mode === "overwrite")
            return this._next({ policy: { extra: obj } }, { policy: { extra: "replace" } });
        return this._next({ policy: { extra: obj } });
    }
    /** Configures the fetch policy's general settings. */
    settings(input) {
        if (typeof input === 'function' || input instanceof VigorFetchPolicySettings) {
            const result = typeof input === 'function'
                ? input(new VigorFetchPolicySettings())
                : input;
            return this._next(result.config);
        }
        return this._next({ policy: { settings: input } });
    }
    /** Configures the fetch policy's middleware pipeline. */
    middlewares(input) {
        if (typeof input === 'function' || input instanceof VigorFetchPolicyMiddlewares) {
            const result = typeof input === 'function'
                ? input(new VigorFetchPolicyMiddlewares())
                : input;
            return this._next(result.config);
        }
        return this._next({ policy: { middlewares: input } });
    }
    /** Configures the retry engine used to send the underlying request. */
    retry(input) {
        if (typeof input === 'function' || input instanceof VigorRetry) {
            const result = typeof input === 'function'
                ? input(new VigorRetry())
                : input;
            return this._next({ policy: { retry: result.config } }, { policy: { retry: "replace" } });
        }
        return this._next({ policy: { retry: input } }, { policy: { retry: "replace" } });
    }
    /** Configures the parse engine used to interpret the response. */
    parse(input) {
        if (typeof input === 'function' || input instanceof VigorParse) {
            const result = typeof input === 'function'
                ? input(new VigorParse())
                : input;
            return this._next({ policy: { parse: result.config } }, { policy: { parse: "replace" } });
        }
        return this._next({ policy: { parse: input } }, { policy: { parse: "replace" } });
    }
    /** Converts a list of stringable values into strings, dropping `null`/`undefined` entries. */
    _stringifyList(unkList) {
        return unkList
            .filter(unk => unk !== null && unk !== undefined)
            .map(unk => unk instanceof Date ? unk.toISOString() : String(unk));
    }
    /**
     * Resolves the base URL used to interpret a relative `origin`. In a
     * browser environment this is the current page location; in
     * environments without `location` (e.g. Node), no base is available and
     * `origin` must be an absolute URL.
     */
    _resolveBase() {
        if (typeof globalThis !== 'undefined' && globalThis.location?.href) {
            return globalThis.location.href;
        }
        return undefined;
    }
    /**
     * Builds the final request URL from the configured origin, path
     * segments, query parameters, and hash. An absolute `origin` ignores
     * the resolved base (per the `URL` spec); a relative `origin` is
     * resolved against it. Throws `INVALID_PROTOCOL` if neither is possible.
     */
    _buildUrl(origin, path, query, hash) {
        const base = this._resolveBase();
        let originObj;
        try {
            originObj = new URL(origin, base);
        }
        catch {
            throw new VigorFetchError("INVALID_PROTOCOL", {
                method: "_buildUrl",
                data: { origin, base }
            });
        }
        const baseStr = originObj.origin;
        const pathParts = [originObj.pathname.replace(/^\/+|\/+$/g, '')];
        for (const p of path)
            pathParts.push(p.replace(/^\/+|\/+$/g, ''));
        const pathStr = pathParts.filter(Boolean).join('/');
        const mainObj = new URL(pathStr, baseStr);
        const parseVal = (val) => val instanceof Date ? val.toISOString() : String(val);
        const queryEntries = [...originObj.searchParams.entries(), ...query.flatMap(q => Object.entries(q))];
        for (const [key, val] of queryEntries) {
            if (val === undefined || val === null)
                continue;
            if (Array.isArray(val)) {
                for (const e of val)
                    mainObj.searchParams.append(key, parseVal(e));
            }
            else {
                mainObj.searchParams.append(key, parseVal(val));
            }
        }
        mainObj.hash = hash || originObj.hash;
        return mainObj.href;
    }
    /** Infers the `Content-Type` header and serializes `body` into a `BodyInit`. */
    _normalizeBody(body) {
        if (body == null)
            return { headers: {}, body: body };
        if (typeof body === "string")
            return { headers: { "Content-Type": "text/plain;charset=UTF-8" }, body };
        if (body instanceof Blob)
            return { headers: body.type ? { "Content-Type": body.type } : {}, body };
        if (body instanceof ArrayBuffer)
            return { headers: { "Content-Type": "application/octet-stream" }, body };
        if (body instanceof URLSearchParams)
            return { headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body };
        if (body instanceof FormData)
            return { headers: {}, body };
        if (typeof body === "object")
            return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
        throw new VigorFetchError("INVALID_BODY", {
            method: "_normalizeBody",
            data: { received: body }
        });
    }
    /** Runs the request and returns its parsed result directly, throwing on final failure. */
    async request() {
        const res = await this.requestVerbose();
        if (res.success)
            return res.data;
        throw res.error;
    }
    /** Runs the request and returns a result/error envelope instead of throwing. */
    async requestVerbose() {
        return await this.requestRuntime();
    }
    /** Internal execution loop implementing URL building, retry, parsing, and restart handling. */
    async requestRuntime(restartAttempt = 1) {
        const config = this._merge(this.config, {});
        let ctx = {
            ...config.context,
            policy: config.policy
        };
        const throwError = (err) => { throw err; };
        try {
            if (isVigorEmpty(ctx.policy.origin))
                throw new VigorFetchError("VALUE_REQUIRED", {
                    method: "request",
                    data: { key: "origin" }
                });
            ctx.href = this._buildUrl(ctx.policy.origin, ctx.policy.path, ctx.policy.query, ctx.policy.hash);
            const hasBody = !isVigorEmpty(ctx.policy.body) && ctx.policy.body !== undefined;
            const method = ctx.policy.method || (hasBody ? "POST" : "GET");
            let options = {
                ...ctx.policy.extra,
                method: method,
                headers: {}
            };
            if (hasBody) {
                const normalized = this._normalizeBody(ctx.policy.body);
                if (normalized.body !== undefined)
                    options.body = normalized.body;
                Object.assign(options.headers, normalized.headers);
            }
            Object.assign(options.headers, ctx.policy.headers);
            for (const middleware of ctx.policy.middlewares.before) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx);
                }
                else {
                    ctx = await middleware.func(ctx, {
                        throwError,
                        setOptions: (o) => { options = o; },
                        setHeaders: (h) => { options.headers = h; },
                        setBody: (b) => { options.body = b; }
                    });
                }
            }
            ctx.options = options;
            const retryEngine = new VigorRetry(ctx.policy.retry)
                .target(async (signal) => {
                return await fetch(ctx.href, { ...options, signal });
            })
                .middlewares(m => m
                .after("intercept", async (rctx, api) => {
                const response = rctx.result;
                if (!response.ok) {
                    let parsed = undefined;
                    try {
                        parsed = await new VigorParse(ctx.policy.parse).target(response.clone()).request();
                    }
                    catch {
                    }
                    api.throwError(new VigorFetchError("FETCH_FAILED", {
                        method: "request",
                        data: {
                            status: response.status,
                            statusText: response.statusText,
                            response,
                            url: response.url,
                            parsed
                        }
                    }));
                }
                return rctx;
            })
                .retryIf("intercept", async (rctx, api) => {
                const response = rctx.error instanceof VigorFetchError
                    ? rctx.error.data?.response
                    : undefined;
                if (response && ctx.policy.settings.unretryStatus.includes(response.status))
                    api.cancelRetry();
                else
                    api.proceedRetry();
                return rctx;
            })
                .onRetry("intercept", async (rctx, api) => {
                const response = rctx.error instanceof VigorFetchError
                    ? rctx.error.data?.response
                    : undefined;
                if (response?.status === 429) {
                    let retryHeader = null;
                    for (const header of ctx.policy.settings.retryHeaders) {
                        retryHeader = response.headers.get(header);
                        if (retryHeader)
                            break;
                    }
                    if (retryHeader) {
                        const toNumber = Number(retryHeader);
                        const delay = !isNaN(toNumber)
                            ? toNumber * 1000
                            : (() => {
                                const toDate = new Date(retryHeader).getTime();
                                return !isNaN(toDate) ? toDate - Date.now() : null;
                            })();
                        if (delay !== null && delay > 0)
                            api.setDelay(delay);
                    }
                }
                return rctx;
            }));
            ctx.response = await retryEngine.request();
            const parseEngine = new VigorParse(ctx.policy.parse).target(ctx.response);
            ctx.result = await parseEngine.request();
            for (const middleware of ctx.policy.middlewares.after) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx);
                }
                else {
                    ctx = await middleware.func(ctx, { throwError, setResult: (r) => { ctx.result = r; } });
                }
            }
            const setResult = (r) => { ctx.result = r; };
            for (const middleware of ctx.policy.middlewares.onResult) {
                if (middleware._mode === "fluent") {
                    ctx.result = await middleware.func(ctx.result);
                }
                else {
                    ctx = await middleware.func(ctx, { setResult, throwError });
                }
            }
            return {
                success: true,
                data: ctx.result,
                error: null
            };
        }
        catch (error) {
            ctx.error = error;
            ctx.flags.overrided = false;
            ctx.flags.restarted = false;
            const setResult = (r) => {
                ctx.flags.overrided = true;
                ctx.result = r;
            };
            const proceedRestart = () => ctx.flags.restarted = true;
            const cancelRestart = () => ctx.flags.restarted = false;
            for (const middleware of ctx.policy.middlewares.onError) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx.error);
                }
                else {
                    ctx = await middleware.func(ctx, { setResult, throwError, proceedRestart, cancelRestart });
                }
            }
            if (ctx.flags.restarted) {
                if (restartAttempt + 1 > ctx.policy.settings.maxRestarts)
                    throw new VigorFetchError("RESTART_EXHAUSTED", {
                        method: "request",
                        data: {
                            maxAttempts: ctx.policy.settings.maxRestarts
                        }
                    });
                return await this.requestRuntime(restartAttempt + 1);
            }
            if (ctx.flags.overrided)
                return {
                    success: true,
                    data: ctx.result,
                    error: null
                };
            if (!isVigorEmpty(ctx.policy.settings.default)) {
                const data = await ctx.policy.settings.default(ctx);
                return {
                    success: true,
                    data,
                    error: null
                };
            }
            return {
                success: false,
                data: null,
                error
            };
        }
    }
}

const vigor = {
    use: (plugin, options) => {
        plugin.func(vigor, options);
    },
    retry: (task) => task ? new VigorRetry().target(task) : new VigorRetry(),
    parse: (response) => response ? new VigorParse().target(response) : new VigorParse(),
    fetch: (origin) => origin ? new VigorFetch().origin(origin) : new VigorFetch(),
    all: (...tasks) => tasks.length > 0 ? new VigorAll().target(...tasks) : new VigorAll()
};

export { VigorAll, VigorAllBase, VigorAllError, VigorAllErrorMessageFuncs, VigorAllPolicyBase, VigorAllPolicyMiddlewares, VigorAllPolicyMiddlewaresBase, VigorAllPolicySettings, VigorAllPolicySettingsBase, VigorError, VigorFetch, VigorFetchBase, VigorFetchError, VigorFetchErrorMessageFuncs, VigorFetchPolicyBase, VigorFetchPolicyMiddlewares, VigorFetchPolicyMiddlewaresBase, VigorFetchPolicySettings, VigorFetchPolicySettingsBase, VigorJitter, VigorParse, VigorParseBase, VigorParseContentTypeStrategy, VigorParseError, VigorParseErrorMessageFuncs, VigorParsePolicyBase, VigorParsePolicyMiddlewares, VigorParsePolicyMiddlewaresBase, VigorParsePolicySettings, VigorParsePolicySettingsBase, VigorParsePolicyStrategies, VigorParsePolicyStrategiesBase, VigorParseSniffStrategy, VigorRetry, VigorRetryBase, VigorRetryError, VigorRetryErrorMessageFuncs, VigorRetryPolicyAlgorithms, VigorRetryPolicyAlgorithmsBackoff, VigorRetryPolicyAlgorithmsBackoffBase, VigorRetryPolicyAlgorithmsBase, VigorRetryPolicyAlgorithmsConstant, VigorRetryPolicyAlgorithmsConstantBase, VigorRetryPolicyAlgorithmsCustom, VigorRetryPolicyAlgorithmsCustomBase, VigorRetryPolicyAlgorithmsLinear, VigorRetryPolicyAlgorithmsLinearBase, VigorRetryPolicyBase, VigorRetryPolicyMiddlewares, VigorRetryPolicyMiddlewaresBase, VigorRetryPolicySettings, VigorRetryPolicySettingsBase, VigorStatus, vigor as default, vigor };
