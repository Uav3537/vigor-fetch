import { createBrand, isVigorDefault, isVigorEmpty, VigorBrand, VigorDefault, VigorDefaultType } from "@core/symbol"
import { VigorFetchContextBase, VigorFetchContextSchema, VigorFetchOptions } from "./context"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorFetchTypeLambda } from "./TL"
import { VigorFetchPolicySettings, VigorFetchPolicySettingsSchema } from "./settings"
import { VigorDeepPartial } from "@core/types"
import { VigorFetchPolicyMiddlewares, VigorFetchPolicyMiddlewaresApi, VigorFetchPolicyMiddlewaresSchema } from "./middlewares"
import { VigorFetchError } from "./error"
import { VigorRetry, VigorRetrySchema } from "@retry/main"
import { VigorParse, VigorParseSchema } from "@parse/main"
import { VigorFetchPolicyBase, VigorFetchPolicySchema, VigorStringable } from "./policy"

export * from "./policy"

export type VigorFetchSchema<
    T extends VigorFetchSchema<T>
> = {
    __brand: VigorBrand<"Fetch", "Schema">

    policy: VigorFetchPolicySchema<T>
    context: VigorFetchContextSchema<T>
}

export const VigorFetchBase = {
    __brand: createBrand("Fetch", "Schema"),

    policy: VigorFetchPolicyBase,
    context: VigorFetchContextBase
} as const satisfies VigorFetchSchema<any>

/**
 * Immutable builder that performs an HTTP request, composing an internal
 * {@link VigorRetry} engine (for retry/timeout/backoff) and a
 * {@link VigorParse} engine (for response parsing), with a configurable
 * middleware pipeline around request building and response handling.
 */
export class VigorFetch<
    T extends VigorFetchSchema<T> = typeof VigorFetchBase
> extends VigorStatus<VigorFetchSchema<T>, T, VigorFetchTypeLambda> {

    constructor(config: T = VigorFetchBase as unknown as T) {
        super(VigorFetchBase as VigorFetchSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorFetchTypeLambda, C> {
        return new VigorFetch(config as unknown as VigorFetchSchema<any>) as unknown as VigorApply<VigorFetchTypeLambda, C>
    }

    /** Sets the HTTP method. Defaults to `POST` when a body is set, otherwise `GET`. */
    public method<const N extends VigorFetchOptions["method"]>(str: N) { return this._next({ policy: { method: str } } as const) }
    /** Sets the request origin, either an absolute URL or a path relative to the current page. */
    public origin<const N extends string>(str: N) { return this._next({ policy: { origin: str } } as const) }
    /** Appends path segments to the request URL. */
    public path<const N extends VigorStringable[]>(...strs: N) {
        return this._next({ policy: { path: this._stringifyList(strs) } } as const)
    }
    /** Adds query-string parameter objects to the request URL. */
    public query<const N extends VigorFetchPolicySchema<any>["query"][number]>(...objs: N[]) {
        return this._next({ policy: { query: objs } } as const)
    }
    /** Sets the URL fragment ("hash"), replacing any previous value. */
    public hash<const N extends string>(str: N) { return this._next({ policy: { hash: str } } as const, { policy: { hash: "replace" } }) }

    /**
     * Sets request headers.
     *
     * @param mode - `"overwrite"` discards all previously configured headers
     *  and keeps only the ones passed here. `"merge"` behaves like
     *  `Object.assign`, overwriting only the keys that overlap and keeping
     *  the rest.
     */
    public headers<const N extends Record<string, string>>(mode: "overwrite" | "merge", obj: N) {
        if (mode === "overwrite") return this._next({ policy: { headers: obj } } as const, { policy: { headers: "replace" } })
        return this._next({ policy: { headers: obj } } as const)
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
    public body<const N extends BodyInit | object | null>(mode: "overwrite" | "merge", obj: N) {
        if (mode === "overwrite") return this._next({ policy: { body: obj } } as const, { policy: { body: "replace" } })
        return this._next({ policy: { body: obj } } as const)
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
    public options<const N extends VigorFetchPolicySchema<any>["extra"]>(mode: "overwrite" | "merge", obj: N) {
        if (mode === "overwrite") return this._next({ policy: { extra: obj } } as const, { policy: { extra: "replace" } })
        return this._next({ policy: { extra: obj } } as const)
    }

    /** Configures the fetch policy's general settings. */
    public settings<
        const N extends VigorDeepPartial<VigorFetchPolicySettingsSchema<T>>,
        R extends VigorFetchSchema<any>
    >(
        input:
            | N
            | ((s: VigorFetchPolicySettings<T>) => VigorFetchPolicySettings<R>)
            | VigorFetchPolicySettings<R>
    ) {
        if (typeof input === 'function' || input instanceof VigorFetchPolicySettings) {
            const result = typeof input === 'function'
                ? input(new VigorFetchPolicySettings<T>())
                : input
            return this._next(
                { policy: { settings: result.config.policy.settings } } as const
            )
        }
        return this._next({ policy: { settings: input } } as const)
    }
    /** Configures the fetch policy's middleware pipeline. */
    public middlewares<
        const N extends VigorDeepPartial<VigorFetchPolicyMiddlewaresSchema<T>>,
        R extends VigorFetchSchema<any>
    >(
        input:
            | N
            | ((s: VigorFetchPolicyMiddlewares<T>) => VigorFetchPolicyMiddlewares<R>)
            | VigorFetchPolicyMiddlewares<R>
    ) {
        if (typeof input === 'function' || input instanceof VigorFetchPolicyMiddlewares) {
            const result = typeof input === 'function'
                ? input(new VigorFetchPolicyMiddlewares<T>())
                : input
            return this._next(
                { policy: { middlewares: result.config.policy.middlewares } } as const
            )
        }
        return this._next({ policy: { middlewares: input } } as const)
    }
    /** Configures the retry engine used to send the underlying request. */
    public retry<
        const N extends VigorDeepPartial<VigorRetrySchema<any>>,
        R extends VigorRetrySchema<any>
    >(
        input:
            | N
            | ((r: VigorRetry) => VigorRetry<R>)
            | VigorRetry<R>
    ) {
        if (typeof input === 'function' || input instanceof VigorRetry) {
            const result = typeof input === 'function'
                ? input(new VigorRetry())
                : input
            return this._next({ policy: { retry: result.config } } as const, { policy: { retry: "replace" } })
        }
        return this._next({ policy: { retry: input } } as const, { policy: { retry: "replace" } })
    }
    /** Configures the parse engine used to interpret the response. */
    public parse<
        const N extends VigorDeepPartial<VigorParseSchema<any>>,
        R extends VigorParseSchema<any>
    >(
        input:
            | N
            | ((p: VigorParse) => VigorParse<R>)
            | VigorParse<R>
    ) {
        if (typeof input === 'function' || input instanceof VigorParse) {
            const result = typeof input === 'function'
                ? input(new VigorParse())
                : input
            return this._next({ policy: { parse: result.config } } as const, { policy: { parse: "replace" } })
        }
        return this._next({ policy: { parse: input } } as const, { policy: { parse: "replace" } })
    }

    /** Converts a list of stringable values into strings, dropping `null`/`undefined` entries. */
    protected _stringifyList(unkList: VigorStringable[]): string[] {
        return unkList
            .filter(unk => unk !== null && unk !== undefined)
            .map(unk => unk instanceof Date ? unk.toISOString() : String(unk))
    }

    /**
     * Resolves the base URL used to interpret a relative `origin`. In a
     * browser environment this is the current page location; in
     * environments without `location` (e.g. Node), no base is available and
     * `origin` must be an absolute URL.
     */
    protected _resolveBase(): string | undefined {
        if (typeof globalThis !== 'undefined' && (globalThis as any).location?.href) {
            return (globalThis as any).location.href as string
        }
        return undefined
    }

    /**
     * Builds the final request URL from the configured origin, path
     * segments, query parameters, and hash. An absolute `origin` ignores
     * the resolved base (per the `URL` spec); a relative `origin` is
     * resolved against it. Throws `INVALID_PROTOCOL` if neither is possible.
     */
    protected _buildUrl(
        origin: string,
        path: string[],
        query: VigorFetchPolicySchema<any>["query"],
        hash: string
    ): string {
        const base = this._resolveBase()

        let originObj: URL
        try {
            originObj = new URL(origin, base)
        } catch {
            throw new VigorFetchError("INVALID_PROTOCOL", {
                method: "_buildUrl",
                data: { origin, base }
            })
        }

        const baseStr = originObj.origin
        const pathParts = [originObj.pathname.replace(/^\/+|\/+$/g, '')]
        for (const p of path) pathParts.push(p.replace(/^\/+|\/+$/g, ''))
        const pathStr = pathParts.filter(Boolean).join('/')

        const mainObj = new URL(pathStr, baseStr)
        const parseVal = (val: VigorStringable): string => val instanceof Date ? val.toISOString() : String(val)

        const queryEntries = [...originObj.searchParams.entries(), ...query.flatMap(q => Object.entries(q))]
        for (const [key, val] of queryEntries) {
            if (val === undefined || val === null) continue
            if (Array.isArray(val)) {
                for (const e of val) mainObj.searchParams.append(key, parseVal(e as VigorStringable))
            } else {
                mainObj.searchParams.append(key, parseVal(val as VigorStringable))
            }
        }
        mainObj.hash = hash || originObj.hash
        return mainObj.href
    }

    /** Infers the `Content-Type` header and serializes `body` into a `BodyInit`. */
    protected _normalizeBody(body: unknown): { headers: Record<string, string>, body: BodyInit | null | undefined } {
        if (body == null) return { headers: {}, body: body as null | undefined }
        if (typeof body === "string") return { headers: { "Content-Type": "text/plain;charset=UTF-8" }, body }
        if (body instanceof Blob) return { headers: body.type ? { "Content-Type": body.type } : {}, body }
        if (body instanceof ArrayBuffer) return { headers: { "Content-Type": "application/octet-stream" }, body }
        if (body instanceof URLSearchParams) return { headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body }
        if (body instanceof FormData) return { headers: {}, body }
        if (typeof body === "object") return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }

        throw new VigorFetchError("INVALID_BODY", {
            method: "_normalizeBody",
            data: { received: body }
        })
    }

    /** Runs the request and returns its parsed result directly, throwing on final failure. */
    public async request<R = T["context"]["result"]>() {
        const res = await this.requestVerbose<R>()
        if(res.success) return res.data
        throw res.error
    }
    /** Runs the request and returns a result/error envelope instead of throwing. */
    public async requestVerbose<R = T["context"]["result"]>() {
        return await this.requestRuntime<R>()
    }
    /** Internal execution loop implementing URL building, retry, parsing, and restart handling. */
    private async requestRuntime<R = T["context"]["result"]>(
        restartAttempt: number = 1
    ): Promise<
        {success: true, data: R, error: null} |
        {success: false, data: null, error: unknown}
    > {
        const config = this._merge(this.config, {}) as VigorFetchSchema<T>
        let ctx = {
            ...config.context,
            policy: config.policy
        } as VigorFetchSchema<T>["context"]

        const throwError: VigorFetchPolicyMiddlewaresApi<T>["throwError"] = (err) => { throw err }

        try {
            if (isVigorEmpty(ctx.policy.origin)) throw new VigorFetchError("VALUE_REQUIRED", {
                method: "request",
                data: { key: "origin" }
            })

            ctx.href = this._buildUrl(ctx.policy.origin, ctx.policy.path, ctx.policy.query, ctx.policy.hash)

            const hasBody = !isVigorEmpty(ctx.policy.body) && ctx.policy.body !== undefined
            const method = isVigorEmpty(ctx.policy.method) ? (hasBody ? "POST" : "GET") : ctx.policy.method

            let options: VigorFetchOptions = {
                ...ctx.policy.extra,
                method: method as VigorFetchOptions["method"],
                headers: {}
            }
            if (hasBody) {
                const normalized = this._normalizeBody(ctx.policy.body)
                if (normalized.body !== undefined) options.body = normalized.body
                Object.assign(options.headers, normalized.headers)
            }
            Object.assign(options.headers, ctx.policy.headers)

            for (const middleware of ctx.policy.middlewares.before) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx)
                } else {
                    ctx = await middleware.func(ctx, {
                        throwError,
                        setOptions: (o) => { options = o },
                        setHeaders: (h) => { options.headers = h },
                        setBody: (b) => { options.body = b as any }
                    })
                }
            }
            ctx.options = options

            const retryEngine = new VigorRetry(ctx.policy.retry)
                .target(async (signal) => {
                    return await fetch(ctx.href, { ...options, signal } as RequestInit)
                })
                .middlewares(m => m
                    .after("intercept", async (rctx, api) => {
                        const response = rctx.result as Response
                        if (!response.ok) {
                            let parsed: unknown = undefined
                            try {
                                parsed = await new VigorParse(ctx.policy.parse).target(response.clone()).request()
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
                            }))
                        }
                        return rctx
                    })
                    .retryIf("intercept", async (rctx, api) => {
                        const response = rctx.error instanceof VigorFetchError
                            ? (rctx.error.data as any)?.response as Response | undefined
                            : undefined
                        if (response && ctx.policy.settings.unretryStatus.includes(response.status)) api.cancelRetry()
                        else api.proceedRetry()
                        return rctx
                    })
                    .onRetry("intercept", async (rctx, api) => {
                        const response = rctx.error instanceof VigorFetchError
                            ? (rctx.error.data as any)?.response as Response | undefined
                            : undefined
                        if (response?.status === 429) {
                            let retryHeader: string | null = null
                            for (const header of ctx.policy.settings.retryHeaders) {
                                retryHeader = response.headers.get(header)
                                if (retryHeader) break
                            }
                            if (retryHeader) {
                                const toNumber = Number(retryHeader)
                                const delay = !isNaN(toNumber)
                                    ? toNumber * 1000
                                    : (() => {
                                        const toDate = new Date(retryHeader as string).getTime()
                                        return !isNaN(toDate) ? toDate - Date.now() : null
                                    })()
                                if (delay !== null && delay > 0) api.setDelay(delay)
                            }
                        }
                        return rctx
                    })
                )

            ctx.response = await retryEngine.request<Response>()

            const parseEngine = new VigorParse(ctx.policy.parse).target(ctx.response)
            ctx.result = await parseEngine.request<R>()

            for (const middleware of ctx.policy.middlewares.after) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx)
                } else {
                    ctx = await middleware.func(ctx, { throwError, setResult: (r) => { ctx.result = r } })
                }
            }

            const setResult: VigorFetchPolicyMiddlewaresApi<T>["setResult"] = (r) => { ctx.result = r }
            for (const middleware of ctx.policy.middlewares.onResult) {
                if (middleware._mode === "fluent") {
                    ctx.result = await middleware.func(ctx.result)
                } else {
                    ctx = await middleware.func(ctx, { setResult, throwError })
                }
            }

            return {
                success: true,
                data: ctx.result as R,
                error: null
            }
        } catch (error) {
            ctx.error = error
            ctx.flags.overrided = false
            ctx.flags.restarted = false

            const setResult: VigorFetchPolicyMiddlewaresApi<T>["setResult"] = (r) => {
                ctx.flags.overrided = true
                ctx.result = r
            }
            const proceedRestart: VigorFetchPolicyMiddlewaresApi<T>["proceedRestart"] = () => ctx.flags.restarted = true
            const cancelRestart: VigorFetchPolicyMiddlewaresApi<T>["cancelRestart"] = () => ctx.flags.restarted = false

            for (const middleware of ctx.policy.middlewares.onError) {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx.error)
                } else {
                    ctx = await middleware.func(ctx, { setResult, throwError, proceedRestart, cancelRestart })
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
                })
                return await this.requestRuntime<R>(restartAttempt + 1)
            }
            if (ctx.flags.overrided) return {
                success: true,
                data: ctx.result as R,
                error: null
            }
            if (!isVigorEmpty(ctx.policy.settings.default)) {
                const data = await ctx.policy.settings.default(ctx) as R
                return {
                    success: true,
                    data,
                    error: null
                }
            }
            return {
                success: false,
                data: null,
                error
            }
        }
    }
}
