// src/core/symbol.ts
function createBrand(b, n) {
  return `@vigor-fetch:::${b} <- ${n}`;
}
var VigorDefault = /* @__PURE__ */ Symbol("VigorDefault");
var isVigorDefault = (v) => v === VigorDefault;
var VigorEmpty = /* @__PURE__ */ Symbol("VigorEmpty");
var isVigorEmpty = (v) => v === VigorEmpty;
var VigorCastPlaceholder = /* @__PURE__ */ Symbol("VigorCastPlaceholder");

// src/core/status.ts
var VigorStatus = class {
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
    const isObj = (v) => v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
    const merge = (a, b, s) => {
      if (b === void 0 || b === null) return a;
      if (s === "replace") return b;
      if (Array.isArray(a) && Array.isArray(b)) {
        return s === "replace" ? b : [...a, ...b];
      }
      if (isObj(a) && isObj(b)) {
        const r = { ...a };
        const sObj = isObj(s) ? s : void 0;
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
};

// src/all/settings.ts
var VigorAllPolicySettingsBase = {
  __brand: createBrand("All", "Policy<Settings<Schema"),
  concurrency: 5,
  onlySuccess: false
};
var VigorAllPolicySettings = class _VigorAllPolicySettings extends VigorStatus {
  constructor(config = VigorAllBase) {
    super(VigorAllBase, config);
  }
  _create(config) {
    return new _VigorAllPolicySettings(config);
  }
  /** Sets the maximum number of tasks run concurrently. */
  concurrency(num) {
    return this._next({ policy: { settings: { concurrency: num } } });
  }
  /** When enabled, filters the final result down to only the tasks that succeeded. */
  onlySuccess(bool) {
    return this._next({ policy: { settings: { onlySuccess: bool } } });
  }
};

// src/all/middlewares.ts
var VigorAllPolicyMiddlewaresBase = {
  __brand: createBrand("All", "Policy<Middlewares<Schema"),
  before: [],
  after: [],
  onResult: [],
  beforeEach: [],
  afterEach: [],
  onErrorEach: []
};
var VigorAllPolicyMiddlewares = class _VigorAllPolicyMiddlewares extends VigorStatus {
  constructor(config = VigorAllBase) {
    super(VigorAllBase, config);
  }
  _create(config) {
    return new _VigorAllPolicyMiddlewares(config);
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
  /** Registers a middleware that runs before each task is invoked. */
  beforeEach(func) {
    return this._next({ policy: { middlewares: { beforeEach: [func] } } });
  }
  /** Registers a middleware that runs after each task settles successfully. */
  afterEach(func) {
    return this._next({ policy: { middlewares: { afterEach: [func] } } });
  }
  /** Registers a middleware that runs when an individual task fails. */
  onErrorEach(func) {
    return this._next({ policy: { middlewares: { onErrorEach: [func] } } });
  }
};

// src/all/policy.ts
var VigorAllPolicyBase = {
  __brand: createBrand("All", "Policy<Schema"),
  target: [],
  settings: VigorAllPolicySettingsBase,
  middlewares: VigorAllPolicyMiddlewaresBase
};

// src/all/context.ts
var VigorAllContextBase = {
  __brand: createBrand("All", "Context<Schema"),
  result: VigorDefault,
  policy: VigorAllPolicyBase,
  record: {}
};
var VigorAllEachContextBase = {
  __brand: createBrand("All", "EachContext<Schema"),
  result: VigorDefault,
  error: VigorDefault,
  flags: { overrided: false },
  record: {}
};

// src/core/error.ts
var VigorError = class extends Error {
  timestamp = /* @__PURE__ */ new Date();
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
};

// src/all/error.ts
var VigorAllErrorMessageFuncs = {
  EMPTY_TARGET: (_) => `Empty target list`
};
var VigorAllError = class extends VigorError {
  /**
   * @param code - One of the all module's error codes.
   * @param options - Error metadata, including the `data` payload for `code`.
   */
  constructor(code, options) {
    const messageFn = VigorAllErrorMessageFuncs[code];
    super(code, messageFn(options.data), options);
  }
};

// src/all/main.ts
var VigorAllBase = {
  __brand: createBrand("All", "Schema"),
  policy: VigorAllPolicyBase,
  cast: VigorEmpty
};
var VigorAll = class _VigorAll extends VigorStatus {
  constructor(config = VigorAllBase) {
    super(VigorAllBase, config);
  }
  _create(config) {
    return new _VigorAll(config);
  }
  /** Sets the list of tasks to run. */
  target(...funcs) {
    return this._next({ policy: { target: funcs } });
  }
  settings(input) {
    if (typeof input === "function" || input instanceof VigorAllPolicySettings) {
      const result = typeof input === "function" ? input(new VigorAllPolicySettings()) : input;
      return this._next({
        policy: { settings: result.config.policy.settings }
      });
    }
    return this._next({ policy: { settings: input } });
  }
  middlewares(input) {
    if (typeof input === "function" || input instanceof VigorAllPolicyMiddlewares) {
      const result = typeof input === "function" ? input(new VigorAllPolicyMiddlewares()) : input;
      return this._next({
        policy: { middlewares: result.config.policy.middlewares }
      });
    }
    return this._next({ policy: { middlewares: input } });
  }
  /** Runs a single task through the beforeEach/afterEach/onErrorEach middleware pipeline. */
  async _runTask(task, policy) {
    let ctx = { ...VigorAllEachContextBase };
    try {
      for (const beforeEach of policy.middlewares.beforeEach) await beforeEach(ctx);
      ctx.result = await task();
      for (const afterEach of policy.middlewares.afterEach) await afterEach(ctx);
      return { success: true, value: ctx.result };
    } catch (error) {
      ctx.error = error;
      const setResult = (r) => {
        ctx.flags.overrided = true;
        ctx.result = r;
      };
      for (const onErrorEach of policy.middlewares.onErrorEach) await onErrorEach(ctx, { setResult });
      if (ctx.flags.overrided) return { success: true, value: ctx.result };
      return { success: false, value: error };
    }
  }
  /**
   * Overrides the resolved result type with `T`, taking priority over the
   * naturally-inferred `unknown[]`. Can be called before or after
   * `target()` (or any other configuration method); whichever `.cast<T>()`
   * call happens last wins.
   */
  cast() {
    return this._next(
      { cast: VigorCastPlaceholder },
      { cast: "replace" }
    );
  }
  /** Runs all tasks and returns the results array directly, throwing on final failure. */
  async request() {
    const res = await this.requestVerbose();
    if (res.success) return res.data;
    throw res.error;
  }
  /** Runs all tasks and returns a result/error envelope instead of throwing. */
  async requestVerbose() {
    return await this.requestRuntime();
  }
  /** Internal execution loop implementing the bounded-concurrency worker pool and the batch-level before/after/onResult pipeline. */
  async requestRuntime(restartAttempt = 1) {
    const config = this._merge(this.config, {});
    const policy = config.policy;
    let ctx = { ...VigorAllContextBase, policy };
    const setResult = (r) => {
      ctx = { ...ctx, result: r };
    };
    const throwError = (err) => {
      throw err;
    };
    try {
      if (policy.target.length === 0) throw new VigorAllError("EMPTY_TARGET", {
        method: "request",
        data: {}
      });
      for (const mw of policy.middlewares.before) {
        if (mw._mode === "fluent") {
          await mw.func(ctx);
        } else {
          ctx = await mw.func(ctx, { throwError });
        }
      }
      const concurrency = Math.max(1, policy.settings.concurrency);
      const results = new Array(policy.target.length);
      let cursor = 0;
      const worker = async () => {
        while (true) {
          const i = cursor++;
          if (i >= policy.target.length) return;
          results[i] = await this._runTask(policy.target[i], policy);
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(concurrency, policy.target.length) }, () => worker())
      );
      ctx.result = policy.settings.onlySuccess ? results.filter((r) => r.success).map((r) => r.value) : results.map((r) => r.value);
      for (const mw of policy.middlewares.after) {
        if (mw._mode === "fluent") {
          await mw.func(ctx);
        } else {
          ctx = await mw.func(ctx, { setResult, throwError });
        }
      }
      for (const mw of policy.middlewares.onResult) {
        if (mw._mode === "fluent") {
          ctx.result = await mw.func(ctx.result);
        } else {
          ctx = await mw.func(ctx, { setResult, throwError });
        }
      }
      return {
        success: true,
        data: ctx.result,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        error
      };
    }
  }
};

// src/fetch/settings.ts
var VigorFetchPolicySettingsBase = {
  __brand: createBrand("Fetch", "Policy<Settings<Schema"),
  retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after", "chrome-proxy-next-link"],
  unretryStatus: [400, 401, 403, 404, 405, 413, 422],
  maxRestarts: 3,
  default: VigorEmpty
};
var VigorFetchPolicySettings = class _VigorFetchPolicySettings extends VigorStatus {
  constructor(config = VigorFetchBase) {
    super(VigorFetchBase, config);
  }
  _create(config) {
    return new _VigorFetchPolicySettings(config);
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
};

// src/fetch/middlewares.ts
var VigorFetchPolicyMiddlewaresBase = {
  __brand: createBrand("Fetch", "Policy<Middlewares<Schema"),
  before: [],
  after: [],
  onResult: [],
  onError: []
};
var VigorFetchPolicyMiddlewares = class _VigorFetchPolicyMiddlewares extends VigorStatus {
  constructor(config = VigorFetchBase) {
    super(VigorFetchBase, config);
  }
  _create(config) {
    return new _VigorFetchPolicyMiddlewares(config);
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
};

// src/retry/settings.ts
var VigorRetryPolicySettingsBase = {
  __brand: createBrand("Retry", "Policy<Settings<Schema"),
  default: VigorEmpty,
  maxAttempts: 5,
  maxRestarts: 3,
  timeout: 2e4
};
var VigorRetryPolicySettings = class _VigorRetryPolicySettings extends VigorStatus {
  constructor(config = VigorRetryBase) {
    super(VigorRetryBase, config);
  }
  _create(config) {
    return new _VigorRetryPolicySettings(config);
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
};

// src/retry/middlewares.ts
var VigorRetryPolicyMiddlewaresBase = {
  __brand: createBrand("Retry", "Policy<Middlewares<Schema"),
  before: [],
  after: [],
  onResult: [],
  retryIf: [],
  onRetry: [],
  onError: []
};
var VigorRetryPolicyMiddlewares = class _VigorRetryPolicyMiddlewares extends VigorStatus {
  constructor(config = VigorRetryBase) {
    super(VigorRetryBase, config);
  }
  _create(config) {
    return new _VigorRetryPolicyMiddlewares(config);
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
};

// src/retry/error.ts
var VigorRetryErrorMessageFuncs = {
  VALUE_REQUIRED: ({ key }) => `Value Required (missing ${key})`,
  RETRY_EXHAUSTED: ({ maxAttempts }) => `Retry exhausted, (max ${maxAttempts})`,
  RESTART_EXHAUSTED: ({ maxAttempts }) => `Restart exhausted, (max ${maxAttempts})`,
  TIMED_OUT: ({ limit }) => `Timeout: exceeded ${limit}ms`
};
var VigorRetryError = class extends VigorError {
  /**
   * @param code - One of the retry module's error codes.
   * @param options - Error metadata, including the `data` payload for `code`.
   */
  constructor(code, options) {
    const messageFn = VigorRetryErrorMessageFuncs[code];
    super(code, messageFn(options.data), options);
  }
};

// src/retry/algorithms.ts
function VigorJitter(jitter) {
  return (Math.random() * 2 - 1) * jitter;
}
var VigorRetryPolicyAlgorithmsConstantBase = {
  __brand: createBrand("Retry", "Policy<Algorithms<Constant<Schema"),
  _tag: "constant",
  jitter: 1e3,
  interval: 2e3,
  _calculateDelay: (att, config) => {
    const { interval, jitter } = config;
    const min = jitter;
    let delay = Math.max(min, interval);
    delay += VigorJitter(jitter);
    return delay;
  }
};
var VigorRetryPolicyAlgorithmsConstant = class _VigorRetryPolicyAlgorithmsConstant extends VigorStatus {
  constructor(config = VigorRetryPolicyAlgorithmsConstantBase) {
    super(VigorRetryPolicyAlgorithmsConstantBase, config);
  }
  _create(config) {
    return new _VigorRetryPolicyAlgorithmsConstant(config);
  }
  /** Sets the amount of random jitter added to the computed delay. */
  jitter(num) {
    return this._next({ jitter: num });
  }
  /** Sets the fixed delay interval, in milliseconds. */
  interval(num) {
    return this._next({ interval: num });
  }
};
var VigorRetryPolicyAlgorithmsLinearBase = {
  __brand: createBrand("Retry", "Policy<Algorithms<Linear<Schema"),
  _tag: "linear",
  jitter: 1e3,
  initial: 500,
  increment: 1e3,
  minDelay: 0,
  maxDelay: 1e4,
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
var VigorRetryPolicyAlgorithmsLinear = class _VigorRetryPolicyAlgorithmsLinear extends VigorStatus {
  constructor(config = VigorRetryPolicyAlgorithmsLinearBase) {
    super(VigorRetryPolicyAlgorithmsLinearBase, config);
  }
  _create(config) {
    return new _VigorRetryPolicyAlgorithmsLinear(config);
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
};
var VigorRetryPolicyAlgorithmsBackoffBase = {
  __brand: createBrand("Retry", "Policy<Algorithms<Backoff<Schema"),
  _tag: "backoff",
  jitter: 800,
  initial: 0,
  multiplier: 1.7,
  unit: 1e3,
  minDelay: 500,
  maxDelay: 1e4,
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
var VigorRetryPolicyAlgorithmsBackoff = class _VigorRetryPolicyAlgorithmsBackoff extends VigorStatus {
  constructor(config = VigorRetryPolicyAlgorithmsBackoffBase) {
    super(VigorRetryPolicyAlgorithmsBackoffBase, config);
  }
  _create(config) {
    return new _VigorRetryPolicyAlgorithmsBackoff(config);
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
};
var VigorRetryPolicyAlgorithmsCustomBase = {
  __brand: createBrand("Retry", "Policy<Algorithms<Custom<Schema"),
  _tag: "custom",
  jitter: 800,
  minDelay: 500,
  maxDelay: 1e4,
  target: VigorEmpty,
  _calculateDelay: (att, config) => {
    const { jitter, minDelay, maxDelay, target } = config;
    if (isVigorEmpty(target)) throw new VigorRetryError("VALUE_REQUIRED", {
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
var VigorRetryPolicyAlgorithmsCustom = class _VigorRetryPolicyAlgorithmsCustom extends VigorStatus {
  constructor(config = VigorRetryPolicyAlgorithmsCustomBase) {
    super(VigorRetryPolicyAlgorithmsCustomBase, config);
  }
  _create(config) {
    return new _VigorRetryPolicyAlgorithmsCustom(config);
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
};
var VigorRetryPolicyAlgorithmsBase = VigorRetryPolicyAlgorithmsConstantBase;
var VigorRetryPolicyAlgorithms = class _VigorRetryPolicyAlgorithms extends VigorStatus {
  constructor(config = VigorRetryBase) {
    super(VigorRetryBase, config);
  }
  _create(config) {
    return new _VigorRetryPolicyAlgorithms(config);
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
};

// src/retry/policy.ts
var VigorRetryPolicyBase = {
  __brand: createBrand("Retry", "Policy<Schema"),
  target: VigorEmpty,
  abortSignals: [],
  settings: VigorRetryPolicySettingsBase,
  middlewares: VigorRetryPolicyMiddlewaresBase,
  algorithms: VigorRetryPolicyAlgorithmsBase
};

// src/retry/context.ts
var VigorRetryContextBase = {
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

// src/retry/main.ts
var VigorRetryBase = {
  __brand: createBrand("Retry", "Schema"),
  policy: VigorRetryPolicyBase,
  cast: VigorEmpty
};
var VigorRetry = class _VigorRetry extends VigorStatus {
  constructor(config = VigorRetryBase) {
    super(VigorRetryBase, config);
  }
  _create(config) {
    return new _VigorRetry(config);
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
  settings(input) {
    if (typeof input === "function" || input instanceof VigorRetryPolicySettings) {
      const result = typeof input === "function" ? input(new VigorRetryPolicySettings()) : input;
      return this._next({
        policy: { settings: result.config.policy.settings }
      });
    }
    return this._next({
      policy: { settings: input }
    });
  }
  middlewares(input) {
    if (typeof input === "function" || input instanceof VigorRetryPolicyMiddlewares) {
      const result = typeof input === "function" ? input(new VigorRetryPolicyMiddlewares()) : input;
      return this._next({
        policy: { middlewares: result.config.policy.middlewares }
      });
    }
    return this._next({
      policy: { middlewares: input }
    });
  }
  algorithms(input) {
    if (typeof input === "function") {
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
  /**
   * Overrides the resolved result type with `T`, taking priority over the
   * type naturally inferred from `target()`. Can be called before or after
   * `target()` (or any other configuration method); whichever `.cast<T>()`
   * call happens last wins.
   */
  cast() {
    return this._next(
      { cast: VigorCastPlaceholder },
      { cast: "replace" }
    );
  }
  /** Runs the target and returns its result directly, throwing on final failure. */
  async request() {
    const res = await this.requestVerbose();
    if (res.success) return res.data;
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
      ...VigorRetryContextBase,
      policy: config.policy
    };
    if (isVigorEmpty(ctx.policy.target)) throw new VigorRetryError("VALUE_REQUIRED", {
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
              } else {
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
              } else {
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
              } else {
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
          } finally {
            clearTimeout(timeoutId);
            outerSignals.removeEventListener("abort", autoBreak);
            if (onAbort) mergedSignals.removeEventListener("abort", onAbort);
          }
        } catch (error) {
          ctx.error = error;
          if (ctx.flags.brokeRetry) throw ctx.error;
          ctx.flags.doRetry = true;
          const proceedRetry = () => ctx.flags.doRetry = true;
          const cancelRetry = () => ctx.flags.doRetry = false;
          for (const middleware of ctx.policy.middlewares.retryIf) {
            if (middleware._mode === "fluent") {
              ctx.flags.doRetry = await middleware.func(ctx.error);
            } else {
              ctx = await middleware.func(ctx, {
                proceedRetry,
                cancelRetry
              });
            }
          }
          if (!ctx.flags.doRetry) throw ctx.error;
          ctx.system.delay = ctx.policy.algorithms._calculateDelay(ctx.system.attempt, ctx.policy.algorithms);
          const setDelay = (num) => {
            ctx.system.delay = num;
          };
          for (const middleware of ctx.policy.middlewares.onRetry) {
            if (middleware._mode === "fluent") {
              await middleware.func(ctx.error);
            } else {
              ctx = await middleware.func(ctx, {
                throwError,
                setDelay
              });
            }
          }
          const delay = ctx.system.delay;
          await new Promise((res) => setTimeout(res, delay));
        }
      }
      throw new VigorRetryError("RETRY_EXHAUSTED", {
        method: "request",
        cause: ctx.error,
        data: {
          maxAttempts: ctx.policy.settings.maxAttempts,
          error: ctx.error
        }
      });
    } catch (error) {
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
        } else {
          ctx = await middleware.func(ctx, {
            setResult,
            throwError,
            proceedRestart,
            cancelRestart
          });
        }
      }
      if (ctx.flags.doRestart) {
        if (restartAttempt + 1 > ctx.policy.settings.maxRestarts) throw new VigorRetryError("RESTART_EXHAUSTED", {
          method: "request",
          cause: ctx.error,
          data: {
            maxAttempts: ctx.policy.settings.maxRestarts,
            error: ctx.error
          }
        });
        return await this.requestRuntime(restartAttempt + 1);
      }
      if (ctx.flags.overridden) return {
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
};

// src/parse/settings.ts
var VigorParsePolicySettingsBase = {
  __brand: createBrand("Parse", "Policy<Settings<Schema"),
  raw: false,
  default: VigorEmpty,
  maxRestarts: 3
};
var VigorParsePolicySettings = class _VigorParsePolicySettings extends VigorStatus {
  constructor(config = VigorParseBase) {
    super(VigorParseBase, config);
  }
  _create(config) {
    return new _VigorParsePolicySettings(config);
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
};

// src/parse/middlewares.ts
var VigorParsePolicyMiddlewaresBase = {
  __brand: createBrand("Parse", "Policy<Middlewares<Schema"),
  before: [],
  after: [],
  onResult: [],
  onError: []
};
var VigorParsePolicyMiddlewares = class _VigorParsePolicyMiddlewares extends VigorStatus {
  constructor(config = VigorParseBase) {
    super(VigorParseBase, config);
  }
  _create(config) {
    return new _VigorParsePolicyMiddlewares(config);
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
};

// src/parse/error.ts
var VigorParseErrorMessageFuncs = {
  VALUE_REQUIRED: ({ key }) => `Value Required (missing ${key})`,
  INVALID_CONTENT_TYPE: ({ received }) => `Invalid Content-Type header: ${String(received)}`,
  PARSER_NOT_FOUND: ({ received, expected }) => `Parser not found for Content-Type "${String(received)}" (known: ${expected.join(", ")})`,
  PARSER_ALL_FAILED: ({ tried }) => `All parsers failed, tried: ${tried.join(", ")}`,
  RESTART_EXHAUSTED: ({ maxAttempts }) => `Restart exhausted, (max ${maxAttempts})`
};
var VigorParseError = class extends VigorError {
  /**
   * @param code - One of the parse module's error codes.
   * @param options - Error metadata, including the `data` payload for `code`.
   */
  constructor(code, options) {
    const messageFn = VigorParseErrorMessageFuncs[code];
    super(code, messageFn(options.data), options);
  }
};

// src/parse/strategies.ts
var VigorParsePolicyStrategiesBase = {
  __brand: createBrand("Parse", "Policy<Strategies<Schema"),
  funcs: []
};
var ContentTypeParsers = [
  { header: "application/json", regExp: /application\/(.+\+)?json(.+\+)?/i, method: (res) => res.json() },
  { header: "application/xml", regExp: /application\/(.+\+)?xml(.+\+)?/i, method: (res) => res.text() },
  { header: "application/x-www-form-urlencoded", regExp: /application\/(.+\+)?x-www-form-urlencoded(.+\+)?/i, method: (res) => res.formData() },
  { header: "application/octet-stream", regExp: /application\/(.+\+)?octet-stream(.+\+)?/i, method: (res) => res.arrayBuffer() },
  { header: "image/*", regExp: /^image\/.+/i, method: (res) => res.blob() },
  { header: "audio/*", regExp: /^audio\/.+/i, method: (res) => res.blob() },
  { header: "video/*", regExp: /^video\/.+/i, method: (res) => res.blob() },
  { header: "multipart/form-data", regExp: /multipart\/(.+\+)?form-data(.+\+)?/i, method: (res) => res.formData() },
  { header: "text/*", regExp: /^text\/.+/i, method: (res) => res.text() }
];
var SniffMethods = [
  { title: "json", method: (res) => res.json() },
  { title: "formData", method: (res) => res.formData() },
  { title: "text", method: (res) => res.text() },
  { title: "blob", method: (res) => res.blob() }
];
var VigorParseContentTypeStrategy = async (response) => {
  const contentTypeHeader = response.headers.get("content-type");
  if (!contentTypeHeader) throw new VigorParseError("INVALID_CONTENT_TYPE", {
    method: "VigorParseContentTypeStrategy",
    data: { received: contentTypeHeader }
  });
  const toDo = ContentTypeParsers.find((parser) => parser.regExp.test(contentTypeHeader));
  if (!toDo) throw new VigorParseError("PARSER_NOT_FOUND", {
    method: "VigorParseContentTypeStrategy",
    data: {
      expected: ContentTypeParsers.map((p) => p.header),
      received: contentTypeHeader
    }
  });
  return await toDo.method(response);
};
var VigorParseSniffStrategy = async (response) => {
  for (const [i, parser] of SniffMethods.entries()) {
    const cloned = i === SniffMethods.length - 1 ? response : response.clone();
    try {
      return await parser.method(cloned);
    } catch {
    }
  }
  throw new VigorParseError("PARSER_ALL_FAILED", {
    method: "VigorParseSniffStrategy",
    data: { tried: SniffMethods.map((p) => p.title) }
  });
};
var VigorParsePolicyStrategies = class _VigorParsePolicyStrategies extends VigorStatus {
  constructor(config = VigorParseBase) {
    super(VigorParseBase, config);
  }
  _create(config) {
    return new _VigorParsePolicyStrategies(config);
  }
  /**
   * Adds strategy functions to the fallback chain.
   *
   * @param replace - When `true`, replaces the existing chain instead of
   *  appending to it (the default is to concat, since strategies are
   *  tried in sequence as a fallback chain).
   */
  _set(funcs, replace) {
    return this._next(
      { policy: { strategies: { funcs } } },
      replace ? { policy: { strategies: { funcs: "replace" } } } : void 0
    );
  }
  /** Adds the content-type based parsing strategy. */
  contentType(replace) {
    return this._set([VigorParseContentTypeStrategy], replace);
  }
  /** Adds the sniffing (try-each-method) parsing strategy. */
  sniff(replace) {
    return this._set([VigorParseSniffStrategy], replace);
  }
  /** Adds a strategy that always parses the response as JSON. */
  json(replace) {
    return this._set([(res) => res.json()], replace);
  }
  /** Adds a strategy that always parses the response as text. */
  text(replace) {
    return this._set([(res) => res.text()], replace);
  }
  /** Adds a strategy that always parses the response as an `ArrayBuffer`. */
  arrayBuffer(replace) {
    return this._set([(res) => res.arrayBuffer()], replace);
  }
  /** Adds a strategy that always parses the response as a `Blob`. */
  blob(replace) {
    return this._set([(res) => res.blob()], replace);
  }
  /** Adds a strategy that always parses the response as a `Uint8Array`. */
  bytes(replace) {
    return this._set([(res) => res.arrayBuffer().then((b) => new Uint8Array(b))], replace);
  }
  /** Adds a strategy that always parses the response as `FormData`. */
  formData(replace) {
    return this._set([(res) => res.formData()], replace);
  }
  /** Adds a user-supplied custom parsing strategy. */
  custom(func, replace) {
    return this._set([func], replace);
  }
};

// src/parse/policy.ts
var VigorParsePolicyBase = {
  __brand: createBrand("Parse", "Policy<Schema"),
  target: VigorDefault,
  settings: VigorParsePolicySettingsBase,
  middlewares: VigorParsePolicyMiddlewaresBase,
  strategies: VigorParsePolicyStrategiesBase
};

// src/parse/context.ts
var VigorParseContextBase = {
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

// src/parse/main.ts
var VigorParseBase = {
  __brand: createBrand("Parse", "Schema"),
  policy: VigorParsePolicyBase,
  cast: VigorEmpty
};
var VigorParse = class _VigorParse extends VigorStatus {
  constructor(config = VigorParseBase) {
    super(VigorParseBase, config);
  }
  _create(config) {
    return new _VigorParse(config);
  }
  /** Sets the `Response` object to parse. */
  target(response) {
    return this._next({ policy: { target: response } });
  }
  settings(input) {
    if (typeof input === "function" || input instanceof VigorParsePolicySettings) {
      const result = typeof input === "function" ? input(new VigorParsePolicySettings()) : input;
      return this._next({
        policy: { settings: result.config.policy.settings }
      });
    }
    return this._next({ policy: { settings: input } });
  }
  middlewares(input) {
    if (typeof input === "function" || input instanceof VigorParsePolicyMiddlewares) {
      const result = typeof input === "function" ? input(new VigorParsePolicyMiddlewares()) : input;
      return this._next({
        policy: { middlewares: result.config.policy.middlewares }
      });
    }
    return this._next({ policy: { middlewares: input } });
  }
  strategies(input) {
    if (typeof input === "function" || input instanceof VigorParsePolicyStrategies) {
      const result = typeof input === "function" ? input(new VigorParsePolicyStrategies()) : input;
      return this._next({
        policy: { strategies: result.config.policy.strategies }
      });
    }
    return this._next({ policy: { strategies: input } });
  }
  /**
   * Overrides the resolved result type with `T`, taking priority over the
   * default `unknown` result. Can be called before or after `strategies()`
   * (or any other configuration method); whichever `.cast<T>()` call
   * happens last wins.
   */
  cast() {
    return this._next(
      { cast: VigorCastPlaceholder },
      { cast: "replace" }
    );
  }
  /** Runs parsing and returns the result directly, throwing on final failure. */
  async request() {
    const res = await this.requestVerbose();
    if (res.success) return res.data;
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
      ...VigorParseContextBase,
      policy: config.policy
    };
    if (isVigorDefault(ctx.policy.target)) throw new VigorParseError("VALUE_REQUIRED", {
      method: "request",
      data: { key: "target" },
      context: ctx
    });
    ctx.response = ctx.policy.target;
    const throwError = (err) => {
      throw err;
    };
    try {
      for (const middleware of ctx.policy.middlewares.before) {
        if (middleware._mode === "fluent") {
          await middleware.func(ctx);
        } else {
          ctx = await middleware.func(ctx, { throwError });
        }
      }
      if (ctx.policy.settings.raw) {
        ctx.result = ctx.response;
      } else {
        const response = ctx.response;
        const funcs = ctx.policy.strategies.funcs.length > 0 ? ctx.policy.strategies.funcs : [VigorParseContentTypeStrategy];
        let parsed = false;
        for (const [i, func] of funcs.entries()) {
          const cloned = i === funcs.length - 1 ? response : response.clone();
          try {
            ctx.result = await func(cloned);
            parsed = true;
            break;
          } catch {
          }
        }
        if (!parsed) throw new VigorParseError("PARSER_ALL_FAILED", {
          method: "request",
          data: { tried: funcs.map((_, i) => `strategy#${i}`) },
          context: ctx
        });
      }
      const setResult = (res) => {
        ctx.result = res;
      };
      for (const middleware of ctx.policy.middlewares.after) {
        if (middleware._mode === "fluent") {
          await middleware.func(ctx);
        } else {
          ctx = await middleware.func(ctx, { setResult, throwError });
        }
      }
      for (const middleware of ctx.policy.middlewares.onResult) {
        if (middleware._mode === "fluent") {
          ctx.result = await middleware.func(ctx.result);
        } else {
          ctx = await middleware.func(ctx, { setResult, throwError });
        }
      }
      return {
        success: true,
        data: ctx.result,
        error: null
      };
    } catch (error) {
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
        } else {
          ctx = await middleware.func(ctx, { setResult, throwError, proceedRestart, cancelRestart });
        }
      }
      if (ctx.flags.restarted) {
        if (restartAttempt + 1 > ctx.policy.settings.maxRestarts) throw new VigorParseError("RESTART_EXHAUSTED", {
          method: "request",
          cause: ctx.error,
          data: {
            maxAttempts: ctx.policy.settings.maxRestarts,
            error: ctx.error
          }
        });
        return await this.requestRuntime(restartAttempt + 1);
      }
      if (ctx.flags.overrided) return {
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
};

// src/fetch/policy.ts
var VigorFetchPolicyBase = {
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

// src/fetch/context.ts
var VigorFetchContextBase = {
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

// src/fetch/error.ts
var VigorFetchErrorMessageFuncs = {
  VALUE_REQUIRED: ({ key }) => `Value Required (missing ${key})`,
  INVALID_BODY: ({ received }) => `Invalid Body type: ${typeof received}`,
  INVALID_PROTOCOL: ({ origin, base }) => base ? `Invalid URL: could not resolve "${origin}" against base "${base}"` : `Invalid URL: "${origin}" is not an absolute URL, and no base (window.location) is available to resolve it against \u2014 pass an absolute origin (e.g. "https://api.example.com") when running outside a browser`,
  FETCH_FAILED: ({ status, statusText }) => `Fetch Failed: ${status} ${statusText}`,
  RESTART_EXHAUSTED: ({ maxAttempts }) => `Restart exhausted, (max ${maxAttempts})`
};
var VigorFetchError = class extends VigorError {
  /**
   * @param code - One of the fetch module's error codes.
   * @param options - Error metadata, including the `data` payload for `code`.
   */
  constructor(code, options) {
    const messageFn = VigorFetchErrorMessageFuncs[code];
    super(code, messageFn(options.data), options);
  }
};

// src/fetch/main.ts
var VigorFetchBase = {
  __brand: createBrand("Fetch", "Schema"),
  policy: VigorFetchPolicyBase,
  cast: VigorEmpty
};
var VigorFetch = class _VigorFetch extends VigorStatus {
  constructor(config = VigorFetchBase) {
    super(VigorFetchBase, config);
  }
  _create(config) {
    return new _VigorFetch(config);
  }
  /** Sets the HTTP method. Defaults to `POST` when a body is set, otherwise `GET`. */
  method(str) {
    return this._next({ policy: { method: str } });
  }
  /** Sets the request origin, either an absolute URL or a path relative to the current page. */
  origin(str) {
    return this._next({ policy: { origin: str } });
  }
  /** Appends path segments to the request URL. */
  path(...strs) {
    return this._next({ policy: { path: this._stringifyList(strs) } });
  }
  /** Adds query-string parameter objects to the request URL. */
  query(...objs) {
    return this._next({ policy: { query: objs } });
  }
  /** Sets the URL fragment ("hash"), replacing any previous value. */
  hash(str) {
    return this._next({ policy: { hash: str } }, { policy: { hash: "replace" } });
  }
  /**
   * Sets request headers.
   *
   * @param mode - `"overwrite"` discards all previously configured headers
   *  and keeps only the ones passed here. `"merge"` behaves like
   *  `Object.assign`, overwriting only the keys that overlap and keeping
   *  the rest.
   */
  headers(mode, obj) {
    if (mode === "overwrite") return this._next({ policy: { headers: obj } }, { policy: { headers: "replace" } });
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
    if (mode === "overwrite") return this._next({ policy: { body: obj } }, { policy: { body: "replace" } });
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
    if (mode === "overwrite") return this._next({ policy: { extra: obj } }, { policy: { extra: "replace" } });
    return this._next({ policy: { extra: obj } });
  }
  settings(input) {
    if (typeof input === "function" || input instanceof VigorFetchPolicySettings) {
      const result = typeof input === "function" ? input(new VigorFetchPolicySettings()) : input;
      return this._next(
        { policy: { settings: result.config.policy.settings } }
      );
    }
    return this._next({ policy: { settings: input } });
  }
  middlewares(input) {
    if (typeof input === "function" || input instanceof VigorFetchPolicyMiddlewares) {
      const result = typeof input === "function" ? input(new VigorFetchPolicyMiddlewares()) : input;
      return this._next(
        { policy: { middlewares: result.config.policy.middlewares } }
      );
    }
    return this._next({ policy: { middlewares: input } });
  }
  retry(input) {
    if (typeof input === "function" || input instanceof VigorRetry) {
      const result = typeof input === "function" ? input(new VigorRetry()) : input;
      return this._next({ policy: { retry: result.config } }, { policy: { retry: "replace" } });
    }
    return this._next({ policy: { retry: input } }, { policy: { retry: "replace" } });
  }
  parse(input) {
    if (typeof input === "function" || input instanceof VigorParse) {
      const result = typeof input === "function" ? input(new VigorParse()) : input;
      return this._next({ policy: { parse: result.config } }, { policy: { parse: "replace" } });
    }
    return this._next({ policy: { parse: input } }, { policy: { parse: "replace" } });
  }
  /** Converts a list of stringable values into strings, dropping `null`/`undefined` entries. */
  _stringifyList(unkList) {
    return unkList.filter((unk) => unk !== null && unk !== void 0).map((unk) => unk instanceof Date ? unk.toISOString() : String(unk));
  }
  /**
   * Resolves the base URL used to interpret a relative `origin`. In a
   * browser environment this is the current page location; in
   * environments without `location` (e.g. Node), no base is available and
   * `origin` must be an absolute URL.
   */
  _resolveBase() {
    if (typeof globalThis !== "undefined" && globalThis.location?.href) {
      return globalThis.location.href;
    }
    return void 0;
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
    } catch {
      throw new VigorFetchError("INVALID_PROTOCOL", {
        method: "_buildUrl",
        data: { origin, base }
      });
    }
    const baseStr = originObj.origin;
    const pathParts = [originObj.pathname.replace(/^\/+|\/+$/g, "")];
    for (const p of path) pathParts.push(p.replace(/^\/+|\/+$/g, ""));
    const pathStr = pathParts.filter(Boolean).join("/");
    const mainObj = new URL(pathStr, baseStr);
    const parseVal = (val) => val instanceof Date ? val.toISOString() : String(val);
    const queryEntries = [...originObj.searchParams.entries(), ...query.flatMap((q) => Object.entries(q))];
    for (const [key, val] of queryEntries) {
      if (val === void 0 || val === null) continue;
      if (Array.isArray(val)) {
        for (const e of val) mainObj.searchParams.append(key, parseVal(e));
      } else {
        mainObj.searchParams.append(key, parseVal(val));
      }
    }
    mainObj.hash = hash || originObj.hash;
    return mainObj.href;
  }
  /** Infers the `Content-Type` header and serializes `body` into a `BodyInit`. */
  _normalizeBody(body) {
    if (body == null) return { headers: {}, body };
    if (typeof body === "string") return { headers: { "Content-Type": "text/plain;charset=UTF-8" }, body };
    if (body instanceof Blob) return { headers: body.type ? { "Content-Type": body.type } : {}, body };
    if (body instanceof ArrayBuffer) return { headers: { "Content-Type": "application/octet-stream" }, body };
    if (body instanceof URLSearchParams) return { headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body };
    if (body instanceof FormData) return { headers: {}, body };
    if (typeof body === "object") return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
    throw new VigorFetchError("INVALID_BODY", {
      method: "_normalizeBody",
      data: { received: body }
    });
  }
  /**
   * Overrides the resolved result type with `T`, taking priority over the
   * default `unknown` result. Can be called before or after `parse()` (or
   * any other configuration method); whichever `.cast<T>()` call happens
   * last wins.
   */
  cast() {
    return this._next(
      { cast: VigorCastPlaceholder },
      { cast: "replace" }
    );
  }
  /** Runs the request and returns its parsed result directly, throwing on final failure. */
  async request() {
    const res = await this.requestVerbose();
    if (res.success) return res.data;
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
      ...VigorFetchContextBase,
      policy: config.policy
    };
    const throwError = (err) => {
      throw err;
    };
    try {
      if (isVigorEmpty(ctx.policy.origin)) throw new VigorFetchError("VALUE_REQUIRED", {
        method: "request",
        data: { key: "origin" }
      });
      ctx.href = this._buildUrl(ctx.policy.origin, ctx.policy.path, ctx.policy.query, ctx.policy.hash);
      const hasBody = !isVigorEmpty(ctx.policy.body) && ctx.policy.body !== void 0;
      const method = isVigorEmpty(ctx.policy.method) ? hasBody ? "POST" : "GET" : ctx.policy.method;
      let options = {
        ...ctx.policy.extra,
        method,
        headers: {}
      };
      if (hasBody) {
        const normalized = this._normalizeBody(ctx.policy.body);
        if (normalized.body !== void 0) options.body = normalized.body;
        Object.assign(options.headers, normalized.headers);
      }
      Object.assign(options.headers, ctx.policy.headers);
      for (const middleware of ctx.policy.middlewares.before) {
        if (middleware._mode === "fluent") {
          await middleware.func(ctx);
        } else {
          ctx = await middleware.func(ctx, {
            throwError,
            setOptions: (o) => {
              options = o;
            },
            setHeaders: (h) => {
              options.headers = h;
            },
            setBody: (b) => {
              options.body = b;
            }
          });
        }
      }
      ctx.options = options;
      const retryEngine = new VigorRetry(ctx.policy.retry).target(async (signal) => {
        return await fetch(ctx.href, { ...options, signal });
      }).middlewares(
        (m) => m.after("intercept", async (rctx, api) => {
          const response = rctx.result;
          if (!response.ok) {
            let parsed = void 0;
            try {
              parsed = await new VigorParse(ctx.policy.parse).target(response.clone()).request();
            } catch {
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
        }).retryIf("intercept", async (rctx, api) => {
          const response = rctx.error instanceof VigorFetchError ? rctx.error.data?.response : void 0;
          if (response && ctx.policy.settings.unretryStatus.includes(response.status)) api.cancelRetry();
          else api.proceedRetry();
          return rctx;
        }).onRetry("intercept", async (rctx, api) => {
          const response = rctx.error instanceof VigorFetchError ? rctx.error.data?.response : void 0;
          if (response?.status === 429) {
            let retryHeader = null;
            for (const header of ctx.policy.settings.retryHeaders) {
              retryHeader = response.headers.get(header);
              if (retryHeader) break;
            }
            if (retryHeader) {
              const toNumber = Number(retryHeader);
              const delay = !isNaN(toNumber) ? toNumber * 1e3 : (() => {
                const toDate = new Date(retryHeader).getTime();
                return !isNaN(toDate) ? toDate - Date.now() : null;
              })();
              if (delay !== null && delay > 0) api.setDelay(delay);
            }
          }
          return rctx;
        })
      );
      ctx.response = await retryEngine.request();
      const parseEngine = new VigorParse(ctx.policy.parse).target(ctx.response);
      ctx.result = await parseEngine.request();
      for (const middleware of ctx.policy.middlewares.after) {
        if (middleware._mode === "fluent") {
          await middleware.func(ctx);
        } else {
          ctx = await middleware.func(ctx, { throwError, setResult: (r) => {
            ctx.result = r;
          } });
        }
      }
      const setResult = (r) => {
        ctx.result = r;
      };
      for (const middleware of ctx.policy.middlewares.onResult) {
        if (middleware._mode === "fluent") {
          ctx.result = await middleware.func(ctx.result);
        } else {
          ctx = await middleware.func(ctx, { setResult, throwError });
        }
      }
      return {
        success: true,
        data: ctx.result,
        error: null
      };
    } catch (error) {
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
        } else {
          ctx = await middleware.func(ctx, { setResult, throwError, proceedRestart, cancelRestart });
        }
      }
      if (ctx.flags.restarted) {
        if (restartAttempt + 1 > ctx.policy.settings.maxRestarts) throw new VigorFetchError("RESTART_EXHAUSTED", {
          method: "request",
          cause: ctx.error,
          data: {
            maxAttempts: ctx.policy.settings.maxRestarts,
            error: ctx.error
          }
        });
        return await this.requestRuntime(restartAttempt + 1);
      }
      if (ctx.flags.overrided) return {
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
};

// src/entry/main.ts
function retryWithTarget(task) {
  return new VigorRetry().target(task);
}
function parseWithTarget(response) {
  return new VigorParse().target(response);
}
function fetchWithOrigin(origin) {
  return new VigorFetch().origin(origin);
}
function allWithTargets(tasks) {
  return new VigorAll().target(...tasks);
}
var vigorBase = {
  retry: ((task) => task !== void 0 ? retryWithTarget(task) : new VigorRetry()),
  parse: ((response) => response !== void 0 ? parseWithTarget(response) : new VigorParse()),
  fetch: ((origin) => origin !== void 0 ? fetchWithOrigin(origin) : new VigorFetch()),
  all: ((...tasks) => tasks.length > 0 ? allWithTargets(tasks) : new VigorAll()),
  builders: {
    fetch: {
      settings: () => new VigorFetchPolicySettings(),
      middlewares: () => new VigorFetchPolicyMiddlewares()
    },
    retry: {
      settings: () => new VigorRetryPolicySettings(),
      middlewares: () => new VigorRetryPolicyMiddlewares(),
      algorithms: () => new VigorRetryPolicyAlgorithms(),
      algorithm: {
        constant: () => new VigorRetryPolicyAlgorithmsConstant(),
        linear: () => new VigorRetryPolicyAlgorithmsLinear(),
        backoff: () => new VigorRetryPolicyAlgorithmsBackoff(),
        custom: () => new VigorRetryPolicyAlgorithmsCustom()
      }
    },
    parse: {
      settings: () => new VigorParsePolicySettings(),
      middlewares: () => new VigorParsePolicyMiddlewares(),
      strategies: () => new VigorParsePolicyStrategies()
    },
    all: {
      settings: () => new VigorAllPolicySettings(),
      middlewares: () => new VigorAllPolicyMiddlewares()
    }
  }
};
var cloneVigor = (v) => ({
  ...v,
  builders: {
    fetch: { ...v.builders.fetch },
    retry: { ...v.builders.retry, algorithm: { ...v.builders.retry.algorithm } },
    parse: { ...v.builders.parse },
    all: { ...v.builders.all }
  }
});
var vigor = {
  ...vigorBase,
  use: (plugin, options) => {
    const ext = plugin.func(vigor, options);
    return { ...cloneVigor(vigor), ...ext };
  }
};

// src/index.ts
var index_default = vigor;
export {
  VigorAll,
  VigorAllBase,
  VigorAllError,
  VigorAllErrorMessageFuncs,
  VigorAllPolicyBase,
  VigorAllPolicyMiddlewares,
  VigorAllPolicyMiddlewaresBase,
  VigorAllPolicySettings,
  VigorAllPolicySettingsBase,
  VigorError,
  VigorFetch,
  VigorFetchBase,
  VigorFetchError,
  VigorFetchErrorMessageFuncs,
  VigorFetchPolicyBase,
  VigorFetchPolicyMiddlewares,
  VigorFetchPolicyMiddlewaresBase,
  VigorFetchPolicySettings,
  VigorFetchPolicySettingsBase,
  VigorJitter,
  VigorParse,
  VigorParseBase,
  VigorParseContentTypeStrategy,
  VigorParseError,
  VigorParseErrorMessageFuncs,
  VigorParsePolicyBase,
  VigorParsePolicyMiddlewares,
  VigorParsePolicyMiddlewaresBase,
  VigorParsePolicySettings,
  VigorParsePolicySettingsBase,
  VigorParsePolicyStrategies,
  VigorParsePolicyStrategiesBase,
  VigorParseSniffStrategy,
  VigorRetry,
  VigorRetryBase,
  VigorRetryError,
  VigorRetryErrorMessageFuncs,
  VigorRetryPolicyAlgorithms,
  VigorRetryPolicyAlgorithmsBackoff,
  VigorRetryPolicyAlgorithmsBackoffBase,
  VigorRetryPolicyAlgorithmsBase,
  VigorRetryPolicyAlgorithmsConstant,
  VigorRetryPolicyAlgorithmsConstantBase,
  VigorRetryPolicyAlgorithmsCustom,
  VigorRetryPolicyAlgorithmsCustomBase,
  VigorRetryPolicyAlgorithmsLinear,
  VigorRetryPolicyAlgorithmsLinearBase,
  VigorRetryPolicyBase,
  VigorRetryPolicyMiddlewares,
  VigorRetryPolicyMiddlewaresBase,
  VigorRetryPolicySettings,
  VigorRetryPolicySettingsBase,
  VigorStatus,
  index_default as default,
  vigor
};
