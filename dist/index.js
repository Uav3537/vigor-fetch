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
    this._config = this._merge(base, config, void 0, "replace");
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
   * `"replace"` is specified, or `arrayMode` is `"replace"`), and any other
   * value — including `null` — is overwritten. Only `undefined` keeps the
   * source value.
   */
  _merge(source, target, strategy, arrayMode = "concat") {
    const isObj = (v) => v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
    const deepClone = (v) => {
      if (Array.isArray(v)) return v.map(deepClone);
      if (isObj(v)) {
        const r = {};
        for (const k of Object.keys(v)) r[k] = deepClone(v[k]);
        return r;
      }
      return v;
    };
    const merge = (a, b, s) => {
      if (b === void 0) return deepClone(a);
      if (s === "replace") return b;
      if (Array.isArray(a) && Array.isArray(b)) {
        return arrayMode === "replace" ? deepClone(b) : [...a, ...b];
      }
      if (isObj(a) && isObj(b)) {
        const r = {};
        const sObj = isObj(s) ? s : void 0;
        const keys = /* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)]);
        for (const k of keys) {
          r[k] = merge(a[k], b[k], sObj?.[k]);
        }
        return r;
      }
      return b;
    };
    return merge(source, target, strategy);
  }
  /**
   * Snapshots a runtime context for a timeline entry: a `_merge` deep clone
   * of everything but `timeline`, so later changes to `ctx` don't reach it.
   */
  _snapshot(ctx) {
    const { timeline: _, ...rest } = ctx;
    return this._merge(rest, {});
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
  onlySuccess: false,
  timeout: VigorEmpty,
  failFast: false
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
  /** Sets the per-task timeout, in milliseconds. A task exceeding it fails with `TIMED_OUT`. */
  timeout(num) {
    return this._next({ policy: { settings: { timeout: num } } });
  }
  /** When enabled, the first unrecovered task failure aborts the remaining tasks and fails the batch with that error. */
  failFast(bool) {
    return this._next({ policy: { settings: { failFast: bool } } });
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
  abortSignals: [],
  settings: VigorAllPolicySettingsBase,
  middlewares: VigorAllPolicyMiddlewaresBase
};

// src/all/context.ts
var VigorAllContextBase = {
  __brand: createBrand("All", "Context<Schema"),
  result: VigorDefault,
  policy: VigorAllPolicyBase,
  record: {},
  timeline: []
};
var VigorAllEachContextBase = {
  __brand: createBrand("All", "EachContext<Schema"),
  index: 0,
  result: VigorDefault,
  error: VigorDefault,
  flags: { overridden: false },
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
  EMPTY_TARGET: (_) => `Empty target list`,
  TIMED_OUT: ({ limit, index }) => `Task #${index} timeout: exceeded ${limit}ms`
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
var isVigorAllError = (error) => error instanceof VigorAllError;

// src/core/timeline.ts
function createVigorTimelineRecorder(timeline, snapshot) {
  const add = (action, content) => {
    timeline.push({ action, content, now: Date.now(), ctx: snapshot() });
  };
  const record = add;
  const stage = async (stage2, middlewares, run) => {
    if (middlewares.length === 0) return;
    record("MIDDLEWARE_LOOP_STARTED", { stage: stage2, middlewares });
    const started = performance.now();
    try {
      for (const middleware of middlewares) {
        await run(middleware, (api) => {
          const traced = {};
          for (const [method, func] of Object.entries(api)) {
            traced[method] = (...args) => {
              record("MIDDLEWARE_API_CALLED", { stage: stage2, middleware, method, args });
              return func(...args);
            };
          }
          return traced;
        });
      }
    } finally {
      record("MIDDLEWARE_LOOP_ENDED", { stage: stage2, middlewares, took: performance.now() - started });
    }
  };
  return { add, stage };
}

// src/all/main.ts
var MAX_TIMEOUT = 2 ** 31 - 1;
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
  /** Sets external abort signals that, when aborted, cancel the remaining tasks and fail the batch. */
  abortSignals(...sig) {
    return this._next({ policy: { abortSignals: sig } });
  }
  settings(input) {
    if (typeof input === "function" || input instanceof VigorAllPolicySettings) {
      const result = typeof input === "function" ? input(new VigorAllPolicySettings(this.config)) : input;
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
  async _runTask(task, index, policy, batchSignal, timeline) {
    let ctx = this._merge(VigorAllEachContextBase, { index });
    const { add, stage } = createVigorTimelineRecorder(timeline, () => this._merge(ctx, {}));
    const timeoutController = new AbortController();
    const signal = AbortSignal.any([batchSignal, timeoutController.signal]);
    let timeoutId;
    let onAbort;
    add("TASK_STARTED", { index });
    const started = performance.now();
    const settle = (res) => {
      add("TASK_ENDED", { index, success: res.success, took: performance.now() - started });
      return res;
    };
    try {
      await stage("beforeEach", policy.middlewares.beforeEach, (beforeEach) => beforeEach(ctx));
      signal.throwIfAborted();
      const limit = policy.settings.timeout;
      if (!isVigorEmpty(limit) && Number.isFinite(limit) && limit > 0) {
        timeoutId = setTimeout(() => timeoutController.abort(new VigorAllError("TIMED_OUT", {
          method: "request",
          data: { limit, index }
        })), Math.min(limit, MAX_TIMEOUT));
      }
      ctx.result = await Promise.race([
        task(signal),
        new Promise((_, rej) => {
          onAbort = () => rej(signal.reason);
          signal.addEventListener("abort", onAbort);
        })
      ]);
      await stage("afterEach", policy.middlewares.afterEach, (afterEach) => afterEach(ctx));
      return settle({ success: true, value: ctx.result });
    } catch (error) {
      ctx.error = error;
      add("TASK_ERROR", { index, error });
      const setResult = (r) => {
        ctx.flags.overridden = true;
        ctx.result = r;
      };
      await stage("onErrorEach", policy.middlewares.onErrorEach, (onErrorEach, trace) => onErrorEach(ctx, trace({ setResult })));
      if (ctx.flags.overridden) return settle({ success: true, value: ctx.result });
      return settle({ success: false, value: error });
    } finally {
      clearTimeout(timeoutId);
      if (onAbort) signal.removeEventListener("abort", onAbort);
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
  /**
   * Runs all tasks and returns a result/error envelope instead of throwing,
   * along with the `timeline` of everything the batch went through.
   */
  async requestVerbose() {
    return await this.requestRuntime();
  }
  /** Internal execution loop implementing the bounded-concurrency worker pool and the batch-level before/after/onResult pipeline. */
  async requestRuntime(timeline = []) {
    const config = this._merge(this.config, {});
    const policy = config.policy;
    let ctx = this._merge(VigorAllContextBase, {
      policy
    }, void 0, "replace");
    ctx.timeline = timeline;
    const { add, stage } = createVigorTimelineRecorder(timeline, () => this._snapshot(ctx));
    const setResult = (r) => {
      ctx.result = r;
    };
    const throwError = (err) => {
      throw err;
    };
    const concurrency = Number.isNaN(policy.settings.concurrency) ? 1 : Math.max(1, Math.floor(policy.settings.concurrency));
    add("PROCESS_HANDLING", { type: "REQUEST_START", data: { tasks: policy.target.length, concurrency } });
    try {
      if (policy.target.length === 0) throw new VigorAllError("EMPTY_TARGET", {
        method: "request",
        data: {},
        context: ctx
      });
      await stage("before", policy.middlewares.before, async (mw, trace) => {
        if (mw._mode === "fluent") {
          await mw.func(ctx);
        } else {
          ctx = await mw.func(ctx, trace({ throwError })) ?? ctx;
        }
      });
      const results = new Array(policy.target.length);
      const batchController = new AbortController();
      const batchSignal = AbortSignal.any([...policy.abortSignals, batchController.signal]);
      let cursor = 0;
      const worker = async () => {
        while (!batchSignal.aborted) {
          const i = cursor++;
          if (i >= policy.target.length) return;
          try {
            results[i] = await this._runTask(policy.target[i], i, policy, batchSignal, timeline);
          } catch (error) {
            batchController.abort(error);
            return;
          }
          if (!results[i].success && policy.settings.failFast) {
            batchController.abort(results[i].value);
          }
        }
      };
      await Promise.all(
        Array.from({ length: Math.min(concurrency, policy.target.length) }, () => worker())
      );
      batchSignal.throwIfAborted();
      ctx.result = policy.settings.onlySuccess ? results.filter((r) => r.success).map((r) => r.value) : results.map((r) => r.value);
      await stage("after", policy.middlewares.after, async (mw, trace) => {
        if (mw._mode === "fluent") {
          await mw.func(ctx);
        } else {
          ctx = await mw.func(ctx, trace({ setResult, throwError })) ?? ctx;
        }
      });
      await stage("onResult", policy.middlewares.onResult, async (mw, trace) => {
        if (mw._mode === "fluent") {
          ctx.result = await mw.func(ctx.result);
        } else {
          ctx = await mw.func(ctx, trace({ setResult, throwError })) ?? ctx;
        }
      });
      return {
        success: true,
        data: ctx.result,
        error: null,
        timeline
      };
    } catch (error) {
      add("PROCESS_HANDLING", { type: "REQUEST_ERROR", data: { error } });
      return {
        success: false,
        data: null,
        error,
        timeline
      };
    }
  }
};

// src/fetch/settings.ts
var VigorFetchPolicySettingsBase = {
  __brand: createBrand("Fetch", "Policy<Settings<Schema"),
  retryHeaders: ["retry-after", "ratelimit-reset", "x-ratelimit-reset", "x-retry-after", "x-amz-retry-after"],
  unretryStatus: [400, 401, 403, 404, 405, 413, 422],
  maxRetryAfter: 5 * 60 * 1e3,
  redirect: false,
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
  /** Sets (replaces) the response headers consulted to compute a server-suggested retry delay. */
  retryHeaders(...strs) {
    return this._next({ policy: { settings: { retryHeaders: strs } } }, { policy: { settings: { retryHeaders: "replace" } } });
  }
  /** Sets (replaces) the HTTP status codes that should never be retried. */
  unretryStatus(...nums) {
    return this._next({ policy: { settings: { unretryStatus: nums } } }, { policy: { settings: { unretryStatus: "replace" } } });
  }
  /** Sets the upper bound, in milliseconds, on a server-suggested retry delay. */
  maxRetryAfter(num) {
    return this._next({ policy: { settings: { maxRetryAfter: num } } });
  }
  /**
   * When enabled, a redirected response (or a readable `3xx` with a
   * `Location` header) navigates the page to its target
   * (`window.location.href`). Without `window.location` — e.g. in Node —
   * this behaves like `false`.
   */
  redirect(bool) {
    return this._next({ policy: { settings: { redirect: bool } } });
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
var isVigorRetryError = (error) => error instanceof VigorRetryError;

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
  timeline: [],
  policy: VigorRetryPolicyBase
};

// src/retry/main.ts
var MAX_TIMEOUT2 = 2 ** 31 - 1;
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
      const result = typeof input === "function" ? input(new VigorRetryPolicySettings(this.config)) : input;
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
  /**
   * Runs the target and returns a result/error envelope instead of throwing,
   * along with the `timeline` of everything the run went through.
   */
  async requestVerbose() {
    return await this.requestRuntime();
  }
  /**
   * Internal execution loop implementing the attempt/retry/restart lifecycle.
   * Never throws: every failure, including one from `onError` or `default`,
   * comes back as an envelope carrying the timeline. A restart passes the
   * same `timeline` on, so it keeps growing across runs.
   */
  async requestRuntime(restartAttempt = 1, timeline = []) {
    const config = this._merge(this.config, {});
    let ctx = this._merge(VigorRetryContextBase, {
      policy: config.policy
    }, void 0, "replace");
    ctx.timeline = timeline;
    const { add, stage } = createVigorTimelineRecorder(timeline, () => this._snapshot(ctx));
    add("PROCESS_HANDLING", { type: "REQUEST_START", data: { restartAttempt } });
    const fail = (error) => ({ success: false, data: null, error, timeline });
    if (isVigorEmpty(ctx.policy.target)) return fail(new VigorRetryError("VALUE_REQUIRED", {
      method: "request",
      data: {
        key: "target"
      },
      context: ctx
    }));
    const target = ctx.policy.target;
    const throwError = (err) => {
      throw err;
    };
    const outerSignals = AbortSignal.any(ctx.policy.abortSignals);
    try {
      while (ctx.system.attempt < ctx.policy.settings.maxAttempts) {
        ctx.system.attempt++;
        add("ATTEMPT_INCREASED", { attempt: ctx.system.attempt });
        add("PROCESS_HANDLING", { type: "RETRY_START", data: { attempt: ctx.system.attempt } });
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
          const mergedSignals = AbortSignal.any([
            innerSignals,
            outerSignals
          ]);
          let onAbort;
          let timeoutId;
          try {
            await stage("before", ctx.policy.middlewares.before, async (middleware, trace) => {
              if (middleware._mode === "fluent") {
                await middleware.func(ctx);
              } else {
                ctx = await middleware.func(ctx, trace({
                  abort: (reason) => userController.abort(reason),
                  throwError,
                  breakRetry
                })) ?? ctx;
              }
            });
            mergedSignals.throwIfAborted();
            const limit = ctx.policy.settings.timeout;
            if (Number.isFinite(limit) && limit > 0) {
              timeoutId = setTimeout(() => timeoutController.abort(new VigorRetryError("TIMED_OUT", {
                method: "request",
                data: {
                  limit
                },
                context: ctx
              })), Math.min(limit, MAX_TIMEOUT2));
            }
            const attempt = ctx.system.attempt;
            add("TARGET_REQUEST_STARTED", { attempt });
            const started = performance.now();
            ctx.result = await Promise.race([
              target(mergedSignals),
              new Promise((_, rej) => {
                onAbort = () => rej(mergedSignals.reason);
                mergedSignals.addEventListener("abort", onAbort);
              })
            ]);
            add("TARGET_REQUEST_ENDED", { attempt, took: performance.now() - started });
            await stage("after", ctx.policy.middlewares.after, async (middleware, trace) => {
              if (middleware._mode === "fluent") {
                await middleware.func(ctx);
              } else {
                ctx = await middleware.func(ctx, trace({
                  throwError
                })) ?? ctx;
              }
            });
            const setResult = (res) => {
              ctx.result = res;
            };
            await stage("onResult", ctx.policy.middlewares.onResult, async (middleware, trace) => {
              if (middleware._mode === "fluent") {
                ctx.result = await middleware.func(ctx.result);
              } else {
                ctx = await middleware.func(ctx, trace({
                  setResult,
                  throwError
                })) ?? ctx;
              }
            });
            return {
              success: true,
              data: ctx.result,
              error: null,
              timeline
            };
          } finally {
            clearTimeout(timeoutId);
            if (onAbort) mergedSignals.removeEventListener("abort", onAbort);
          }
        } catch (error) {
          ctx.error = error;
          add("PROCESS_HANDLING", { type: "RETRY_ERROR", data: { attempt: ctx.system.attempt, error } });
          if (outerSignals.aborted) ctx.flags.brokeRetry = true;
          if (ctx.flags.brokeRetry) throw ctx.error;
          ctx.flags.doRetry = true;
          const proceedRetry = () => ctx.flags.doRetry = true;
          const cancelRetry = () => ctx.flags.doRetry = false;
          await stage("retryIf", ctx.policy.middlewares.retryIf, async (middleware, trace) => {
            if (middleware._mode === "fluent") {
              ctx.flags.doRetry = await middleware.func(ctx.error);
            } else {
              ctx = await middleware.func(ctx, trace({
                proceedRetry,
                cancelRetry
              })) ?? ctx;
            }
          });
          if (!ctx.flags.doRetry) throw ctx.error;
          if (ctx.system.attempt >= ctx.policy.settings.maxAttempts) break;
          ctx.system.delay = ctx.policy.algorithms._calculateDelay(ctx.system.attempt, ctx.policy.algorithms);
          const setDelay = (num) => {
            ctx.system.delay = num;
          };
          await stage("onRetry", ctx.policy.middlewares.onRetry, async (middleware, trace) => {
            if (middleware._mode === "fluent") {
              await middleware.func(ctx.error);
            } else {
              ctx = await middleware.func(ctx, trace({
                throwError,
                setDelay
              })) ?? ctx;
            }
          });
          const delay = Math.min(Math.max(0, Number(ctx.system.delay) || 0), MAX_TIMEOUT2);
          add("RETRY_DELAY", { attempt: ctx.system.attempt, delay });
          await new Promise((res, rej) => {
            if (outerSignals.aborted) {
              ctx.flags.brokeRetry = true;
              return rej(outerSignals.reason);
            }
            const onAbort = () => {
              clearTimeout(id);
              ctx.flags.brokeRetry = true;
              rej(outerSignals.reason);
            };
            const id = setTimeout(() => {
              outerSignals.removeEventListener("abort", onAbort);
              res();
            }, delay);
            outerSignals.addEventListener("abort", onAbort, { once: true });
          });
        }
      }
      throw new VigorRetryError("RETRY_EXHAUSTED", {
        method: "request",
        cause: ctx.error,
        data: {
          maxAttempts: ctx.policy.settings.maxAttempts,
          error: ctx.error
        },
        context: ctx
      });
    } catch (error) {
      ctx.error = error;
      add("PROCESS_HANDLING", { type: "REQUEST_ERROR", data: { error } });
      ctx.flags.doRestart = false;
      ctx.flags.overridden = false;
      const setResult = (res) => {
        ctx.flags.overridden = true;
        ctx.result = res;
      };
      const proceedRestart = () => ctx.flags.doRestart = true;
      const cancelRestart = () => ctx.flags.doRestart = false;
      try {
        await stage("onError", ctx.policy.middlewares.onError, async (middleware, trace) => {
          if (middleware._mode === "fluent") {
            await middleware.func(ctx.error);
          } else {
            ctx = await middleware.func(ctx, trace({
              setResult,
              throwError,
              proceedRestart,
              cancelRestart
            })) ?? ctx;
          }
        });
      } catch (err) {
        return fail(err);
      }
      if (ctx.flags.doRestart) {
        if (restartAttempt > ctx.policy.settings.maxRestarts) return fail(new VigorRetryError("RESTART_EXHAUSTED", {
          method: "request",
          cause: ctx.error,
          data: {
            maxAttempts: ctx.policy.settings.maxRestarts,
            error: ctx.error
          },
          context: ctx
        }));
        add("PROCESS_HANDLING", { type: "REQUEST_RESTART", data: { restartAttempt: restartAttempt + 1 } });
        return await this.requestRuntime(restartAttempt + 1, timeline);
      }
      if (ctx.flags.overridden) return {
        success: true,
        data: ctx.result,
        error: null,
        timeline
      };
      if (!isVigorEmpty(ctx.policy.settings.default)) {
        try {
          const data = await ctx.policy.settings.default(ctx);
          return {
            success: true,
            data,
            error: null,
            timeline
          };
        } catch (err) {
          return fail(err);
        }
      }
      return fail(ctx.error);
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
var isVigorParseError = (error) => error instanceof VigorParseError;

// src/parse/strategies.ts
var VigorParsePolicyStrategiesBase = {
  __brand: createBrand("Parse", "Policy<Strategies<Schema"),
  funcs: []
};
var bodyCache = /* @__PURE__ */ new WeakMap();
async function readVigorParseBody(source) {
  let bytes = bodyCache.get(source);
  if (!bytes) {
    bytes = source.body === null ? Promise.resolve(new Uint8Array(0)) : source.arrayBuffer().then((buf) => new Uint8Array(buf));
    bodyCache.set(source, bytes);
  }
  return {
    bytes: await bytes,
    contentType: source.headers.get("content-type"),
    status: source instanceof Response ? source.status : null,
    headers: source.headers,
    source
  };
}
var utf8 = new TextDecoder("utf-8");
var getCharset = (contentType) => /;\s*charset\s*=\s*"?([^";\s]+)"?/i.exec(contentType ?? "")?.[1] ?? "utf-8";
var getMimeType = (contentType) => (contentType ?? "").split(";")[0].trim().toLowerCase();
var decodeText = (body, fatal = false) => {
  let decoder;
  try {
    decoder = new TextDecoder(getCharset(body.contentType), { fatal });
  } catch {
    decoder = new TextDecoder("utf-8", { fatal });
  }
  return decoder.decode(body.bytes);
};
var parseJson = (body) => JSON.parse(utf8.decode(body.bytes));
var parseJsonOrNull = (body) => {
  const text = utf8.decode(body.bytes);
  return text.trim() === "" ? null : JSON.parse(text);
};
var hexValue = (b) => {
  if (b >= 48 && b <= 57) return b - 48;
  if (b >= 65 && b <= 70) return b - 65 + 10;
  if (b >= 97 && b <= 102) return b - 97 + 10;
  return -1;
};
var decodeFormComponent = (input) => {
  const out = new Uint8Array(input.length);
  let n = 0;
  for (let i = 0; i < input.length; i++) {
    const b = input[i];
    if (b === 43) {
      out[n++] = 32;
      continue;
    }
    if (b === 37 && i + 2 < input.length) {
      const hi = hexValue(input[i + 1]);
      const lo = hexValue(input[i + 2]);
      if (hi >= 0 && lo >= 0) {
        out[n++] = hi * 16 + lo;
        i += 2;
        continue;
      }
    }
    out[n++] = b;
  }
  return utf8.decode(out.subarray(0, n));
};
var parseUrlEncoded = (body) => {
  const form = new FormData();
  const { bytes } = body;
  let start = 0;
  for (let i = 0; i <= bytes.length; i++) {
    if (i < bytes.length && bytes[i] !== 38) continue;
    const pair = bytes.subarray(start, i);
    start = i + 1;
    if (pair.length === 0) continue;
    const eq = pair.indexOf(61);
    const name = eq === -1 ? pair : pair.subarray(0, eq);
    const value = eq === -1 ? new Uint8Array(0) : pair.subarray(eq + 1);
    form.append(decodeFormComponent(name), decodeFormComponent(value));
  }
  return form;
};
var parseMultipart = (body) => new Response(body.bytes, { headers: { "content-type": body.contentType ?? "" } }).formData();
var parseFormData = (body) => {
  const mime = getMimeType(body.contentType);
  if (mime === "application/x-www-form-urlencoded") return parseUrlEncoded(body);
  if (mime === "multipart/form-data") return parseMultipart(body);
  throw new VigorParseError("INVALID_CONTENT_TYPE", {
    method: "parseFormData",
    data: { received: body.contentType }
  });
};
var toArrayBuffer = (body) => body.bytes.slice().buffer;
var toBlob = (body) => new Blob([body.bytes], { type: body.contentType ?? "" });
var NoBodyStatus = [204, 205, 304];
var ContentTypeParsers = [
  { header: "application/json", regExp: /application\/(.+\+)?json(.+\+)?/i, method: parseJsonOrNull },
  { header: "application/xml", regExp: /application\/(.+\+)?xml(.+\+)?/i, method: (body) => decodeText(body) },
  { header: "application/x-www-form-urlencoded", regExp: /application\/(.+\+)?x-www-form-urlencoded(.+\+)?/i, method: parseUrlEncoded },
  { header: "application/octet-stream", regExp: /application\/(.+\+)?octet-stream(.+\+)?/i, method: toArrayBuffer },
  { header: "image/*", regExp: /^image\/.+/i, method: toBlob },
  { header: "audio/*", regExp: /^audio\/.+/i, method: toBlob },
  { header: "video/*", regExp: /^video\/.+/i, method: toBlob },
  { header: "multipart/form-data", regExp: /multipart\/(.+\+)?form-data(.+\+)?/i, method: parseMultipart },
  { header: "text/*", regExp: /^text\/.+/i, method: (body) => decodeText(body) }
];
var SniffMethods = [
  { title: "json", method: parseJson },
  { title: "formData", method: parseFormData },
  { title: "text", method: (body) => decodeText(body, true) },
  { title: "blob", method: toBlob }
];
var VigorParseContentTypeStrategy = async (body) => {
  if (body.bytes.length === 0 || body.status !== null && NoBodyStatus.includes(body.status)) return null;
  if (!body.contentType) return decodeText(body);
  const toDo = ContentTypeParsers.find((parser) => parser.regExp.test(body.contentType));
  if (!toDo) throw new VigorParseError("PARSER_NOT_FOUND", {
    method: "VigorParseContentTypeStrategy",
    data: {
      expected: ContentTypeParsers.map((p) => p.header),
      received: body.contentType
    }
  });
  return await toDo.method(body);
};
var VigorParseSniffStrategy = async (body) => {
  for (const parser of SniffMethods) {
    try {
      return await parser.method(body);
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
  /** Adds the sniffing (try-each-format) parsing strategy. */
  sniff(replace) {
    return this._set([VigorParseSniffStrategy], replace);
  }
  /** Adds a strategy that always parses the body as JSON. */
  json(replace) {
    return this._set([parseJson], replace);
  }
  /** Adds a strategy that always parses the body as text, in its declared `charset`. */
  text(replace) {
    return this._set([(body) => decodeText(body)], replace);
  }
  /** Adds a strategy that always parses the body as an `ArrayBuffer`. */
  arrayBuffer(replace) {
    return this._set([toArrayBuffer], replace);
  }
  /** Adds a strategy that always parses the body as a `Blob`. */
  blob(replace) {
    return this._set([toBlob], replace);
  }
  /** Adds a strategy that always parses the body as a `Uint8Array`. */
  bytes(replace) {
    return this._set([(body) => body.bytes.slice()], replace);
  }
  /** Adds a strategy that always parses the body as `FormData` (`x-www-form-urlencoded` or `multipart/form-data`). */
  formData(replace) {
    return this._set([parseFormData], replace);
  }
  /** Adds a user-supplied custom parsing strategy. It receives the body already read into bytes. */
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
    overridden: false,
    restarted: false
  },
  record: {},
  timeline: [],
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
      const result = typeof input === "function" ? input(new VigorParsePolicySettings(this.config)) : input;
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
  /**
   * Runs parsing and returns a result/error envelope instead of throwing,
   * along with the `timeline` of everything the run went through.
   */
  async requestVerbose() {
    return await this.requestRuntime();
  }
  /**
   * Internal execution loop implementing the strategy fallback and restart
   * handling. Never throws: every failure, including one from `onError` or
   * `default`, comes back as an envelope carrying the timeline. A restart
   * passes the same `timeline` on, so it keeps growing across runs.
   */
  async requestRuntime(restartAttempt = 1, timeline = []) {
    const config = this._merge(this.config, {});
    let ctx = this._merge(VigorParseContextBase, {
      policy: config.policy
    }, void 0, "replace");
    ctx.timeline = timeline;
    const { add, stage } = createVigorTimelineRecorder(timeline, () => this._snapshot(ctx));
    add("PROCESS_HANDLING", { type: "REQUEST_START", data: { restartAttempt } });
    const fail = (error) => ({ success: false, data: null, error, timeline });
    if (isVigorDefault(ctx.policy.target)) return fail(new VigorParseError("VALUE_REQUIRED", {
      method: "request",
      data: { key: "target" },
      context: ctx
    }));
    ctx.response = ctx.policy.target;
    const throwError = (err) => {
      throw err;
    };
    try {
      await stage("before", ctx.policy.middlewares.before, async (middleware, trace) => {
        if (middleware._mode === "fluent") {
          await middleware.func(ctx);
        } else {
          ctx = await middleware.func(ctx, trace({ throwError })) ?? ctx;
        }
      });
      if (ctx.policy.settings.raw) {
        ctx.result = ctx.response;
      } else {
        const readStarted = performance.now();
        const body = await readVigorParseBody(ctx.response);
        add("BODY_READ", { size: body.bytes.byteLength, took: performance.now() - readStarted });
        const funcs = ctx.policy.strategies.funcs.length > 0 ? ctx.policy.strategies.funcs : [VigorParseContentTypeStrategy];
        let parsed = false;
        for (const [index, func] of funcs.entries()) {
          add("STRATEGY_STARTED", { index });
          const started = performance.now();
          try {
            ctx.result = await func(body);
            add("STRATEGY_SUCCEEDED", { index, took: performance.now() - started });
            parsed = true;
            break;
          } catch (error) {
            add("STRATEGY_FAILED", { index, error, took: performance.now() - started });
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
      await stage("after", ctx.policy.middlewares.after, async (middleware, trace) => {
        if (middleware._mode === "fluent") {
          await middleware.func(ctx);
        } else {
          ctx = await middleware.func(ctx, trace({ setResult, throwError })) ?? ctx;
        }
      });
      await stage("onResult", ctx.policy.middlewares.onResult, async (middleware, trace) => {
        if (middleware._mode === "fluent") {
          ctx.result = await middleware.func(ctx.result);
        } else {
          ctx = await middleware.func(ctx, trace({ setResult, throwError })) ?? ctx;
        }
      });
      return {
        success: true,
        data: ctx.result,
        error: null,
        timeline
      };
    } catch (error) {
      ctx.error = error;
      add("PROCESS_HANDLING", { type: "REQUEST_ERROR", data: { error } });
      ctx.flags.overridden = false;
      ctx.flags.restarted = false;
      const setResult = (res) => {
        ctx.flags.overridden = true;
        ctx.result = res;
      };
      const proceedRestart = () => ctx.flags.restarted = true;
      const cancelRestart = () => ctx.flags.restarted = false;
      try {
        await stage("onError", ctx.policy.middlewares.onError, async (middleware, trace) => {
          if (middleware._mode === "fluent") {
            await middleware.func(ctx.error);
          } else {
            ctx = await middleware.func(ctx, trace({ setResult, throwError, proceedRestart, cancelRestart })) ?? ctx;
          }
        });
      } catch (err) {
        return fail(err);
      }
      if (ctx.flags.restarted) {
        if (restartAttempt > ctx.policy.settings.maxRestarts) return fail(new VigorParseError("RESTART_EXHAUSTED", {
          method: "request",
          cause: ctx.error,
          data: {
            maxAttempts: ctx.policy.settings.maxRestarts,
            error: ctx.error
          },
          context: ctx
        }));
        add("PROCESS_HANDLING", { type: "REQUEST_RESTART", data: { restartAttempt: restartAttempt + 1 } });
        return await this.requestRuntime(restartAttempt + 1, timeline);
      }
      if (ctx.flags.overridden) return {
        success: true,
        data: ctx.result,
        error: null,
        timeline
      };
      if (!isVigorEmpty(ctx.policy.settings.default)) {
        try {
          const data = await ctx.policy.settings.default(ctx);
          return {
            success: true,
            data,
            error: null,
            timeline
          };
        } catch (err) {
          return fail(err);
        }
      }
      return fail(ctx.error);
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
    overridden: false,
    restarted: false
  },
  record: {},
  timeline: [],
  policy: VigorFetchPolicyBase
};

// src/fetch/error.ts
var VigorFetchErrorMessageFuncs = {
  VALUE_REQUIRED: ({ key }) => `Value Required (missing ${key})`,
  INVALID_BODY: ({ received }) => `Invalid Body type: ${typeof received}`,
  BODY_NOT_ALLOWED: ({ method }) => `A ${method} request cannot have a body`,
  INVALID_PROTOCOL: ({ origin, base }) => base ? `Invalid URL: could not resolve "${origin}" against base "${base}"` : `Invalid URL: "${origin}" is not an absolute URL, and no base (window.location) is available to resolve it against \u2014 pass an absolute origin (e.g. "https://api.example.com") when running outside a browser`,
  FETCH_FAILED: ({ status, statusText }) => `Fetch Failed: ${status} ${statusText}`,
  RESTART_EXHAUSTED: ({ maxAttempts }) => `Restart exhausted, (max ${maxAttempts})`,
  REDIRECTED: ({ url, status }) => `Redirected (${status}) to "${url}" \u2014 navigating away`
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
var isVigorFetchError = (error) => error instanceof VigorFetchError;

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
    const prev = this.config.policy.body;
    const body = mode === "merge" && this._isPlainObject(prev) && this._isPlainObject(obj) ? { ...prev, ...obj } : obj;
    return this._next({ policy: { body } }, { policy: { body: "replace" } });
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
    const extra = mode === "merge" ? { ...this.config.policy.extra, ...obj } : obj;
    return this._next({ policy: { extra } }, { policy: { extra: "replace" } });
  }
  settings(input) {
    const strategy = { policy: { settings: { retryHeaders: "replace", unretryStatus: "replace" } } };
    if (typeof input === "function" || input instanceof VigorFetchPolicySettings) {
      const result = typeof input === "function" ? input(new VigorFetchPolicySettings(this.config)) : input;
      return this._next(
        { policy: { settings: result.config.policy.settings } },
        strategy
      );
    }
    return this._next({ policy: { settings: input } }, strategy);
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
  /** Whether `v` is a plain object literal (not an array, `FormData`, `Blob`, ...). */
  _isPlainObject(v) {
    return v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype;
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
    for (const p of path) {
      for (const part of p.split("/")) pathParts.push(encodeURIComponent(part));
    }
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
    if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return { headers: { "Content-Type": "application/octet-stream" }, body };
    if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) return { headers: { "Content-Type": "application/octet-stream" }, body };
    if (body instanceof URLSearchParams) return { headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body };
    if (body instanceof FormData) return { headers: {}, body };
    if (typeof body === "object") return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
    throw new VigorFetchError("INVALID_BODY", {
      method: "_normalizeBody",
      data: { received: body }
    });
  }
  /**
   * Returns the absolute URL a redirect points at, or `null` when the
   * response isn't a redirect. A response `fetch` already followed
   * (`redirect: "follow"`, the default) yields its final URL; a readable
   * `3xx` (`redirect: "manual"` outside browsers) yields its `Location`,
   * resolved against the responding URL.
   */
  _resolveRedirect(response, href) {
    if (response.redirected && response.url) return response.url;
    if (response.status < 300 || response.status >= 400) return null;
    const location = response.headers.get("location");
    if (!location) return null;
    try {
      return new URL(location, response.url || href).href;
    } catch {
      return null;
    }
  }
  /** The browser's `location`, or `null` in environments without one (e.g. Node). */
  _browserLocation() {
    const win = globalThis.window;
    return win?.location?.href !== void 0 ? win.location : null;
  }
  /** Assigns `source` headers onto `target`, replacing any existing key that differs only in case. */
  _assignHeaders(target, source) {
    for (const [key, value] of Object.entries(source)) {
      const lower = key.toLowerCase();
      for (const existing of Object.keys(target)) {
        if (existing.toLowerCase() === lower) delete target[existing];
      }
      target[key] = value;
    }
  }
  /**
   * Converts a rate-limit header value into a delay in milliseconds, or
   * `null` if it can't be used. Accepts delta seconds (`Retry-After: 120`),
   * Unix epoch seconds or milliseconds (`X-RateLimit-Reset: 1735689600`),
   * and HTTP dates.
   */
  _parseRetryHeader(value) {
    if (!value) return null;
    const num = Number(value);
    let delay;
    if (value.trim() !== "" && !isNaN(num)) {
      if (num >= 1e12) delay = num - Date.now();
      else if (num >= 1e9) delay = num * 1e3 - Date.now();
      else delay = num * 1e3;
    } else {
      const date = new Date(value).getTime();
      if (isNaN(date)) return null;
      delay = date - Date.now();
    }
    return delay > 0 ? delay : null;
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
  /**
   * Runs the request and returns a result/error envelope instead of throwing,
   * along with the `timeline` of everything the run went through. The
   * nested retry/parse engines' full timelines are kept inside it, on their
   * `RETRY_ENDED`/`PARSE_ENDED` entries.
   */
  async requestVerbose() {
    return await this.requestRuntime();
  }
  /**
   * Internal execution loop implementing URL building, retry, parsing, and
   * restart handling. Never throws: every failure, including one from
   * `onError` or `default`, comes back as an envelope carrying the timeline.
   * A restart passes the same `timeline` on, so it keeps growing across runs.
   */
  async requestRuntime(restartAttempt = 1, timeline = []) {
    const config = this._merge(this.config, {});
    let ctx = this._merge(VigorFetchContextBase, {
      policy: config.policy
    }, void 0, "replace");
    ctx.timeline = timeline;
    const { add, stage } = createVigorTimelineRecorder(timeline, () => this._snapshot(ctx));
    add("PROCESS_HANDLING", { type: "REQUEST_START", data: { restartAttempt } });
    const fail = (error) => ({ success: false, data: null, error, timeline });
    const runRetry = async (engine) => {
      add("RETRY_STARTED", { engine });
      const started = performance.now();
      const res = await engine.requestVerbose();
      add("RETRY_ENDED", {
        engine,
        timeline: res.timeline,
        took: performance.now() - started,
        response: res.success ? res.data : VigorDefault
      });
      return res;
    };
    const runParse = async (source, engine) => {
      add("PARSE_STARTED", { engine, source });
      const started = performance.now();
      const res = await engine.requestVerbose();
      add("PARSE_ENDED", {
        engine,
        source,
        timeline: res.timeline,
        took: performance.now() - started,
        result: res.success ? res.data : VigorDefault
      });
      return res;
    };
    const throwError = (err) => {
      throw err;
    };
    try {
      if (isVigorEmpty(ctx.policy.origin)) throw new VigorFetchError("VALUE_REQUIRED", {
        method: "request",
        data: { key: "origin" },
        context: ctx
      });
      ctx.href = this._buildUrl(ctx.policy.origin, ctx.policy.path, ctx.policy.query, ctx.policy.hash);
      add("BUILT_URL", { url: ctx.href });
      const hasBody = !isVigorEmpty(ctx.policy.body) && ctx.policy.body != null;
      const method = isVigorEmpty(ctx.policy.method) ? hasBody ? "POST" : "GET" : ctx.policy.method;
      const options = {
        ...ctx.policy.extra,
        method,
        headers: {}
      };
      if (hasBody) {
        const normalized = this._normalizeBody(ctx.policy.body);
        if (normalized.body !== void 0) options.body = normalized.body;
        Object.assign(options.headers, normalized.headers);
      }
      this._assignHeaders(options.headers, ctx.policy.headers);
      ctx.options = options;
      await stage("before", ctx.policy.middlewares.before, async (middleware, trace) => {
        if (middleware._mode === "fluent") {
          await middleware.func(ctx);
        } else {
          ctx = await middleware.func(ctx, trace({
            throwError,
            setOptions: (o) => {
              ctx.options = o;
            },
            setHeaders: (h) => {
              ctx.options.headers = h;
            },
            setBody: (b) => {
              ctx.options.body = b;
            }
          })) ?? ctx;
        }
      });
      const finalOptions = isVigorDefault(ctx.options) ? options : ctx.options;
      ctx.options = finalOptions;
      add("SET_OPTIONS", { options: finalOptions });
      const finalMethod = (finalOptions.method ?? "GET").toUpperCase();
      if (finalOptions.body != null && (finalMethod === "GET" || finalMethod === "HEAD")) throw new VigorFetchError("BODY_NOT_ALLOWED", {
        method: "request",
        data: { method: finalMethod },
        context: ctx
      });
      const isStreamBody = typeof ReadableStream !== "undefined" && finalOptions.body instanceof ReadableStream;
      if (isStreamBody) {
        finalOptions.duplex ??= "half";
      }
      const parseEngine = new VigorParse(ctx.policy.parse);
      const retryEngine = new VigorRetry(ctx.policy.retry).target(async (signal) => {
        return await fetch(ctx.href, { ...finalOptions, signal });
      }).middlewares(
        (m) => m.after("intercept", async (rctx, api) => {
          const response = rctx.result;
          if (ctx.policy.settings.redirect) {
            const target = this._resolveRedirect(response, ctx.href);
            const location = this._browserLocation();
            if (target && location) {
              location.href = target;
              api.throwError(new VigorFetchError("REDIRECTED", {
                method: "request",
                data: { url: target, status: response.status, response },
                context: ctx
              }));
            }
          }
          if (!response.ok && response.status !== 304) {
            const parseRes2 = await runParse("failedResponse", parseEngine.target(response.clone()));
            const parsed = parseRes2.success ? parseRes2.data : void 0;
            api.throwError(new VigorFetchError("FETCH_FAILED", {
              method: "request",
              data: {
                status: response.status,
                statusText: response.statusText,
                response,
                url: response.url,
                parsed
              },
              context: ctx
            }));
          }
          if (!ctx.policy.parse.policy.settings.raw) await readVigorParseBody(response);
          return rctx;
        }).retryIf("intercept", async (rctx, api) => {
          const response = rctx.error instanceof VigorFetchError ? rctx.error.data?.response : void 0;
          if (rctx.error instanceof VigorFetchError && rctx.error.code === "REDIRECTED") api.cancelRetry();
          else if (isStreamBody) api.cancelRetry();
          else if (response && (response.type === "opaqueredirect" || response.status >= 300 && response.status < 400)) api.cancelRetry();
          else if (response && ctx.policy.settings.unretryStatus.includes(response.status)) api.cancelRetry();
          return rctx;
        }).onRetry("intercept", async (rctx, api) => {
          const response = rctx.error instanceof VigorFetchError ? rctx.error.data?.response : void 0;
          if (response?.status === 429 || response?.status === 503) {
            for (const header of ctx.policy.settings.retryHeaders) {
              const delay = this._parseRetryHeader(response.headers.get(header));
              if (delay !== null) {
                api.setDelay(Math.min(delay, ctx.policy.settings.maxRetryAfter));
                break;
              }
            }
          }
          return rctx;
        })
      );
      add("ENGINE_CREATED", { retryEngine, parseEngine });
      const retryRes = await runRetry(retryEngine);
      if (!retryRes.success) throw retryRes.error;
      ctx.response = retryRes.data;
      const parseRes = await runParse("response", parseEngine.target(ctx.response));
      if (!parseRes.success) throw parseRes.error;
      ctx.result = parseRes.data;
      await stage("after", ctx.policy.middlewares.after, async (middleware, trace) => {
        if (middleware._mode === "fluent") {
          await middleware.func(ctx);
        } else {
          ctx = await middleware.func(ctx, trace({ throwError, setResult: (r) => {
            ctx.result = r;
          } })) ?? ctx;
        }
      });
      const setResult = (r) => {
        ctx.result = r;
      };
      await stage("onResult", ctx.policy.middlewares.onResult, async (middleware, trace) => {
        if (middleware._mode === "fluent") {
          ctx.result = await middleware.func(ctx.result);
        } else {
          ctx = await middleware.func(ctx, trace({ setResult, throwError })) ?? ctx;
        }
      });
      return {
        success: true,
        data: ctx.result,
        error: null,
        timeline
      };
    } catch (error) {
      ctx.error = error;
      add("PROCESS_HANDLING", { type: "REQUEST_ERROR", data: { error } });
      ctx.flags.overridden = false;
      ctx.flags.restarted = false;
      const setResult = (r) => {
        ctx.flags.overridden = true;
        ctx.result = r;
      };
      const proceedRestart = () => ctx.flags.restarted = true;
      const cancelRestart = () => ctx.flags.restarted = false;
      try {
        await stage("onError", ctx.policy.middlewares.onError, async (middleware, trace) => {
          if (middleware._mode === "fluent") {
            await middleware.func(ctx.error);
          } else {
            ctx = await middleware.func(ctx, trace({ setResult, throwError, proceedRestart, cancelRestart })) ?? ctx;
          }
        });
      } catch (err) {
        return fail(err);
      }
      if (ctx.flags.restarted) {
        if (restartAttempt > ctx.policy.settings.maxRestarts) return fail(new VigorFetchError("RESTART_EXHAUSTED", {
          method: "request",
          cause: ctx.error,
          data: {
            maxAttempts: ctx.policy.settings.maxRestarts,
            error: ctx.error
          },
          context: ctx
        }));
        add("PROCESS_HANDLING", { type: "REQUEST_RESTART", data: { restartAttempt: restartAttempt + 1 } });
        return await this.requestRuntime(restartAttempt + 1, timeline);
      }
      if (ctx.flags.overridden) return {
        success: true,
        data: ctx.result,
        error: null,
        timeline
      };
      if (!isVigorEmpty(ctx.policy.settings.default)) {
        try {
          const data = await ctx.policy.settings.default(ctx);
          return {
            success: true,
            data,
            error: null,
            timeline
          };
        } catch (err) {
          return fail(err);
        }
      }
      return fail(error);
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
  },
  guards: {
    retry: isVigorRetryError,
    parse: isVigorParseError,
    fetch: isVigorFetchError,
    all: isVigorAllError
  }
};
var cloneVigor = (v) => ({
  ...v,
  builders: {
    fetch: { ...v.builders.fetch },
    retry: { ...v.builders.retry, algorithm: { ...v.builders.retry.algorithm } },
    parse: { ...v.builders.parse },
    all: { ...v.builders.all }
  },
  guards: { ...v.guards }
});
var createVigor = (fields) => {
  const instance = {
    ...fields,
    use: (plugin, options) => {
      const ext = plugin.func(instance, options);
      const { use: _, ...rest } = { ...cloneVigor(instance), ...ext };
      return createVigor(rest);
    }
  };
  return instance;
};
var vigor = createVigor(vigorBase);

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
  createVigorTimelineRecorder,
  index_default as default,
  isVigorAllError,
  isVigorFetchError,
  isVigorParseError,
  isVigorRetryError,
  readVigorParseBody,
  vigor
};
