/**
 * One recorded timeline entry: which `action` happened, its `content`, `now`,
 * the `Date.now()` timestamp it happened at (a number rather than a `Date`,
 * to keep entries light), and `ctx`, a snapshot of the context at that moment.
 * `E` maps each action name to its content; `C` is the snapshot's shape.
 */
export type VigorTimelineItem<E, C> = {
    [K in keyof E]: {
        action: K
        content: E[K]
        now: number
        ctx: C
    }
}[keyof E]

/**
 * How a request ended: `"result"` — the pipeline produced it; `"overridden"`
 * — `onError` set it with `setResult`; `"default"` — `settings.default`
 * produced it; `"failed"` — it failed.
 */
export type VigorTimelineOutcome = "result" | "overridden" | "default" | "failed"

/** The `REQUEST_END` event every module records last. */
export type VigorTimelineEndEvents = {
    /**
     * The request ended (after any restarts). `took` spans the whole call,
     * `restarts` counts the restarts it went through, and `error` is what it
     * failed with (`null` when it succeeded).
     */
    REQUEST_END: {
        success: boolean
        outcome: VigorTimelineOutcome
        took: number
        restarts: number
        error: unknown
    }
}

/** The ordered list of everything a single `requestVerbose()` call went through. */
export type VigorTimeline<E, C> = VigorTimelineItem<E, C>[]

/**
 * A context as stored on a timeline entry: everything but `timeline` itself,
 * which would otherwise nest every earlier entry inside each new one.
 */
export type VigorTimelineSnapshot<Ctx> = Omit<Ctx, "timeline">

/**
 * The `PROCESS_HANDLING` event shared by every module, for the run's own
 * lifecycle steps. `H` maps each step `type` to its `data`.
 */
export type VigorTimelineProcessEvents<H> = {
    PROCESS_HANDLING: {
        [K in keyof H]: {
            type: K
            data: H[K]
        }
    }[keyof H]
}

/**
 * Middleware-stage events shared by every module. `Stages` maps each stage
 * name to its middleware list, and `Apis` maps each stage to the intercept
 * API object its middlewares receive (`{}` for a stage without one).
 */
export type VigorTimelineMiddlewareEvents<
    Stages extends Record<string, readonly unknown[]>,
    Apis extends { [S in keyof Stages]: object }
> = {
    MIDDLEWARE_LOOP_STARTED: {
        [S in keyof Stages]: {
            stage: S
            middlewares: Stages[S]
        }
    }[keyof Stages]
    MIDDLEWARE_LOOP_ENDED: {
        [S in keyof Stages]: {
            stage: S
            middlewares: Stages[S]
            took: number
        }
    }[keyof Stages]
    /**
     * One middleware of a stage ran. `index` is its position in the stage,
     * `internal` is `true` for one Vigor added itself (e.g. fetch's own
     * middlewares on its retry engine), and `error` is what it threw, when
     * `threw` is `true`.
     */
    MIDDLEWARE_RAN: {
        [S in keyof Stages]: {
            stage: S
            index: number
            middleware: Stages[S][number]
            internal: boolean
            took: number
            threw: boolean
            error: unknown
        }
    }[keyof Stages]
    MIDDLEWARE_API_CALLED: {
        [S in keyof Stages]: {
            [A in keyof Apis[S]]: {
                stage: S
                index: number
                middleware: Stages[S][number]
                internal: boolean
                method: A
                args: Apis[S][A] extends (...args: infer P) => any ? P : never
            }
        }[keyof Apis[S]]
    }[keyof Stages]
}

/** Middleware functions Vigor adds itself, so timelines can tell them from the user's. */
const internalMiddlewares = new WeakSet<Function>()

/**
 * Marks a middleware function as one Vigor added itself (it's recorded with
 * `internal: true`). Returns the function unchanged.
 */
export function markVigorInternal<F extends Function>(func: F): F {
    internalMiddlewares.add(func)
    return func
}

/** Whether a middleware (an `{ _mode, func }` entry or a bare function) was marked with {@link markVigorInternal}. */
export function isVigorInternalMiddleware(middleware: unknown): boolean {
    const func = typeof middleware === "function"
        ? middleware
        : (middleware as { func?: unknown } | null)?.func
    return typeof func === "function" && internalMiddlewares.has(func)
}

/**
 * Creates the recorder a `requestRuntime()` writes into. Entries are pushed
 * straight onto `timeline`, so the same array keeps growing across restarts.
 * `snapshot` is called on every entry, so it must read the current context.
 * With `enabled` off (the default, until `settings.debug` is on) nothing is
 * recorded or snapshotted — middlewares still run.
 */
export function createVigorTimelineRecorder<E, C>(timeline: VigorTimeline<E, C>, snapshot: () => C, enabled: boolean) {
    const add = <K extends keyof E>(action: K, content: E[K]) => {
        if (!enabled) return
        timeline.push({ action, content, now: Date.now(), ctx: snapshot() } as VigorTimelineItem<E, C>)
    }
    const record = add as unknown as (action: string, content: unknown) => void

    /**
     * Runs `run` once per middleware of `stage`, recording the loop and every
     * call made through an API passed to `trace`. Empty stages record nothing.
     */
    const stage = async <M>(
        stage: string,
        middlewares: readonly M[],
        run: (middleware: M, trace: <A extends object>(api: A) => A) => unknown
    ) => {
        if (middlewares.length === 0) return
        if (!enabled) {
            for (const middleware of middlewares) await run(middleware, (api) => api)
            return
        }
        record("MIDDLEWARE_LOOP_STARTED", { stage, middlewares })
        const started = performance.now()
        try {
            for (const [index, middleware] of middlewares.entries()) {
                const internal = isVigorInternalMiddleware(middleware)
                const ranAt = performance.now()
                try {
                    await run(middleware, (api) => {
                        const traced: Record<string, unknown> = {}
                        for (const [method, func] of Object.entries(api)) {
                            traced[method] = (...args: unknown[]) => {
                                record("MIDDLEWARE_API_CALLED", { stage, index, middleware, internal, method, args })
                                return (func as (...args: unknown[]) => unknown)(...args)
                            }
                        }
                        return traced as typeof api
                    })
                } catch (error) {
                    record("MIDDLEWARE_RAN", { stage, index, middleware, internal, took: performance.now() - ranAt, threw: true, error })
                    throw error
                }
                record("MIDDLEWARE_RAN", { stage, index, middleware, internal, took: performance.now() - ranAt, threw: false, error: null })
            }
        } finally {
            record("MIDDLEWARE_LOOP_ENDED", { stage, middlewares, took: performance.now() - started })
        }
    }

    return { add, stage }
}
