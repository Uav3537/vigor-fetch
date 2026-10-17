import { createBrand, isVigorDefault, isVigorEmpty, VigorBrand, VigorCastPlaceholder, VigorDefault, VigorDefaultType, VigorExcludeDefault, VigorEmpty, VigorEmptyType } from "@core/symbol"
import { VigorFetchContextBase, VigorFetchContextSchema, VigorFetchOptions } from "./context"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorFetchTypeLambda } from "./TL"
import { VigorFetchPolicySettings, VigorFetchPolicySettingsSchema } from "./settings"
import { VigorBuiltin, VigorDeepMerge, VigorDeepPartial, VigorNoExtraKeys, VigorReturnType, VigorSimplify } from "@core/types"
import { VigorFetchErrorPipeResult, VigorFetchNaturalFor, VigorFetchPipeResult, VigorFetchPolicyMiddlewares, VigorFetchPolicyMiddlewaresApi, VigorFetchPolicyMiddlewaresSchema } from "./middlewares"
import { adoptVigorFetchError, VigorFetchError, VigorFetchRequestError } from "./error"
import { VigorRetry, VigorRetryBase, VigorRetrySchema } from "@retry/main"
import { VigorParse, VigorParseBase, VigorParseSchema } from "@parse/main"
import { readVigorParseBody } from "@parse/strategies"
import { VigorFetchPolicyBase, VigorFetchPolicySchema, VigorStringable } from "./policy"
import { VigorFetchParseSource, VigorFetchTimeline, VigorFetchTimelineSnapshot } from "./timeline"
import { createVigorTimelineRecorder, markVigorInternal, VigorTimelineOutcome } from "@core/timeline"
import { VigorApiKeys, VigorApiMap, VigorApiMapSlot, VigorApiRequestIssues, VigorApiRouteOf, VigorApiSuccess, VigorPathList, VigorResolvedMethod, VigorRouteMethod, VigorRoutePath, VigorRoutePathList, VigorRouteParams, VigorRouteWithoutParams, VigorRouteWithParams } from "./api"

export * from "./policy"
export * from "./timeline"
export * from "./api"

export type VigorFetchSchema<
    T extends VigorFetchSchema<T>
> = {
    __brand: VigorBrand<"Fetch", "Schema">

    policy: VigorFetchPolicySchema<T>
    /** Type-level override for the resolved result type, set via `.cast<T>()`. */
    cast: unknown
    /** Type-level API map, set via `.apiMap<M>()`; routes' success `responses` become the result type. */
    apiMap: unknown
}

/** What `request()` resolves to: the pipeline's result, or what `settings.default` returns. */
export type VigorFetchResult<T extends VigorFetchSchema<T>> =
    | VigorExcludeDefault<VigorFetchContextSchema<T>["result"]>
    | VigorExcludeDefault<VigorFetchErrorPipeResult<T>>
    | VigorReturnType<T["policy"]["settings"]["default"]>

/** The builder `T` becomes after merging `P` in (with strategy tree `S`). */
type VigorFetchNext<T, P, S = undefined> = VigorApply<VigorFetchTypeLambda, VigorDeepMerge<T, P, S>>

/** `requestVerbose()`'s default type argument: "infer the result per status". Type-only. */
export type VigorFetchInferResult = { readonly __brand: "@vigor-fetch:::Fetch <- InferResult" }

/** Whether `R` is the {@link VigorFetchInferResult} default rather than a type the caller passed. */
type VigorFetchIsInferred<R> =
    0 extends (1 & R)
        ? false
        : [R] extends [VigorFetchInferResult] ? [VigorFetchInferResult] extends [R] ? true : false : false

/** The success outcomes, `{ status, data }`, the API map gives request `T`. */
type VigorFetchSuccessOf<T extends VigorFetchSchema<T>> =
    VigorApiSuccess<T["apiMap"], VigorResolvedMethod<T["policy"]["method"], T["policy"]["body"]>, T["policy"]["path"]>

/**
 * A successful `requestVerbose()` whose result was parsed from a response:
 * `status`/`response` are that response's. Inferred, it's one member per
 * status the API map declares, each with that status's data through the
 * middleware pipeline — so narrowing `status` narrows `data`.
 */
type VigorFetchVerboseParsed<T extends VigorFetchSchema<T>, R> =
    VigorFetchIsInferred<R> extends true
        ? VigorFetchSuccessOf<T> extends infer V
            ? V extends { status: infer S, data: infer D }
                ? { success: true, data: VigorExcludeDefault<VigorFetchPipeResult<T, VigorFetchNaturalFor<T, D>>>, error: null, status: S, response: Response, timeline: VigorFetchTimeline }
                : never
            : never
        : { success: true, data: R, error: null, status: VigorFetchSuccessOf<T>["status"], response: Response, timeline: VigorFetchTimeline }

/**
 * A successful `requestVerbose()` that recovered from a failure — with
 * `onError`'s `setResult` or `settings.default` — so there's no response:
 * `status`/`response` are `null`. Only possible when one of them is set.
 */
type VigorFetchVerboseRecovered<T extends VigorFetchSchema<T>, R> =
    | (T["policy"]["middlewares"]["onError"] extends readonly [] ? never : VigorExcludeDefault<VigorFetchErrorPipeResult<T>>)
    | (T["policy"]["settings"]["default"] extends VigorEmptyType ? never : VigorReturnType<T["policy"]["settings"]["default"]>) extends infer D
        ? [D] extends [never]
            ? never
            : { success: true, data: VigorFetchIsInferred<R> extends true ? D : R, error: null, status: null, response: null, timeline: VigorFetchTimeline }
        : never

/**
 * What `requestVerbose()` resolves to: a success (per status, or
 * recovered), or a failure. `status`/`response` belong to the response the
 * result was parsed from, and are `null` otherwise — a failure's response is
 * on its error (`FETCH_FAILED`'s `data`).
 */
export type VigorFetchVerboseResult<T extends VigorFetchSchema<T>, R = VigorFetchInferResult> =
    | VigorFetchVerboseParsed<T, R>
    | VigorFetchVerboseRecovered<T, R>
    | { success: false, data: null, error: VigorFetchRequestError<T>, status: null, response: null, timeline: VigorFetchTimeline }

/**
 * What `request()`/`requestVerbose()` require of their `this`: the request
 * itself, unless its `body`/`query` don't match its API map route — then a
 * {@link VigorApiRequestIssue} describing the mismatch, so the call doesn't
 * compile. Only computed where those methods are called.
 */
export type VigorFetchRequestThis<T extends VigorFetchSchema<T>> =
    0 extends (1 & T)
        ? VigorFetch<T>
        : T["apiMap"] extends VigorEmptyType
            ? VigorFetch<T>
            : VigorApiRequestIssues<
                T["apiMap"],
                VigorResolvedMethod<T["policy"]["method"], T["policy"]["body"]>,
                T["policy"]["path"],
                T["policy"]["body"],
                T["policy"]["query"]
            > extends infer I
                ? [I] extends [never] ? VigorFetch<T> : I
                : never

type VigorFetchMethod = NonNullable<VigorFetchOptions["method"]>

/** The API map's route keys `.route()` accepts for `T`: those whose method `T` allows. */
export type VigorFetchRouteKeys<T extends VigorFetchSchema<T>> =
    Extract<VigorApiKeys<T["apiMap"]>, `${VigorFetchMethodFor<T>} /${string}`>

/** Methods allowed for `T`: a `GET`/`HEAD` request can't carry the body already set. */
export type VigorFetchMethodFor<T extends VigorFetchSchema<T>> =
    T["policy"]["body"] extends VigorEmptyType | null
        ? VigorFetchMethod
        : Exclude<VigorFetchMethod, "GET" | "HEAD">

/** Bodies allowed for `T`: only `null` (no body) once the method is `GET`/`HEAD`. */
export type VigorFetchBodyFor<T extends VigorFetchSchema<T>> =
    T["policy"]["method"] extends "GET" | "HEAD"
        ? null
        : BodyInit | object | null

/** `{ ...A, ...B }` when both are plain objects, otherwise `B` — what `body("merge", ...)` does. */
type VigorFetchShallowMerge<A, B> =
    A extends VigorBuiltin | readonly any[]
        ? B
        : B extends VigorBuiltin | readonly any[]
            ? B
            : VigorSimplify<Omit<A, keyof B> & B>

export const VigorFetchBase = {
    __brand: createBrand("Fetch", "Schema"),

    policy: VigorFetchPolicyBase,
    cast: VigorEmpty,
    apiMap: VigorEmpty
} as const satisfies VigorFetchSchema<any>

/** `retryHeaders`/`unretryStatus` are whole lists: setting them replaces the previous list. */
type VigorFetchSettingsStrategy = { policy: { settings: { retryHeaders: "replace", unretryStatus: "replace" } } }

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
    public method<const N extends VigorFetchMethodFor<T>>(str: N): VigorFetchNext<T, { policy: { method: N } }> { return this._next({ policy: { method: str } } as const) }
    /** Sets the request origin, either an absolute URL or a path relative to the current page. */
    public origin<const N extends string>(str: N): VigorFetchNext<T, { policy: { origin: N } }> { return this._next({ policy: { origin: str } } as const) }
    /** Appends path segments to the request URL. */
    public path<const N extends VigorStringable[]>(...strs: N): VigorFetchNext<T, { policy: { path: VigorPathList<N> } }> {
        // Typed as the per-argument string list (`VigorPathList<N>`), which is what `_stringifyList` produces.
        return this._next({ policy: { path: this._stringifyList(strs) } } as const) as any
    }
    /** Adds query-string parameter objects to the request URL. */
    public query<const N extends VigorFetchPolicySchema<any>["query"][number]>(...objs: N[]): VigorFetchNext<T, { policy: { query: N[] } }> {
        return this._next({ policy: { query: objs } } as const)
    }
    /** Sets the URL fragment ("hash"), replacing any previous value. */
    public hash<const N extends string>(str: N): VigorFetchNext<T, { policy: { hash: N } }, { policy: { hash: "replace" } }> { return this._next({ policy: { hash: str } } as const, { policy: { hash: "replace" } }) }

    /**
     * Sets request headers.
     *
     * @param mode - `"overwrite"` discards all previously configured headers
     *  and keeps only the ones passed here. `"merge"` behaves like
     *  `Object.assign`, overwriting only the keys that overlap and keeping
     *  the rest.
     */
    public headers<const N extends Record<string, string>>(mode: "overwrite", obj: N): VigorFetchNext<T, { policy: { headers: N } }, { policy: { headers: "replace" } }>
    public headers<const N extends Record<string, string>>(mode: "merge", obj: N): VigorFetchNext<T, { policy: { headers: N } }>
    public headers(mode: "overwrite" | "merge", obj: Record<string, string>): any {
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
    public body<const N extends VigorFetchBodyFor<T>>(mode: "overwrite", obj: N): VigorFetchNext<T, { policy: { body: N } }, { policy: { body: "replace" } }>
    public body<const N extends VigorFetchBodyFor<T>>(mode: "merge", obj: N): VigorFetchNext<T, { policy: { body: VigorFetchShallowMerge<T["policy"]["body"], N> } }, { policy: { body: "replace" } }>
    public body(mode: "overwrite" | "merge", obj: BodyInit | object | null): any {
        const prev: unknown = this.config.policy.body
        const body = (mode === "merge" && this._isPlainObject(prev) && this._isPlainObject(obj)
            ? { ...prev, ...(obj as Record<string, unknown>) }
            : obj)
        return this._next({ policy: { body } } as const, { policy: { body: "replace" } })
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
    public options<const N extends VigorFetchPolicySchema<any>["extra"]>(mode: "overwrite", obj: N): VigorFetchNext<T, { policy: { extra: N } }, { policy: { extra: "replace" } }>
    public options<const N extends VigorFetchPolicySchema<any>["extra"]>(mode: "merge", obj: N): VigorFetchNext<T, { policy: { extra: VigorSimplify<Omit<T["policy"]["extra"], keyof N> & N> } }, { policy: { extra: "replace" } }>
    public options(mode: "overwrite" | "merge", obj: VigorFetchPolicySchema<any>["extra"]): any {
        const extra = mode === "merge" ? { ...this.config.policy.extra, ...obj } : obj
        return this._next({ policy: { extra } } as const, { policy: { extra: "replace" } })
    }

    /** Configures the fetch policy's general settings. */
    public settings<
        const N extends VigorDeepPartial<VigorFetchPolicySettingsSchema<T>>
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorFetchPolicySettingsSchema<T>>>): VigorFetchNext<T, { policy: { settings: N } }, VigorFetchSettingsStrategy>
    public settings<
        const B extends VigorFetchPolicySettings<any>
    >(input: (s: VigorFetchPolicySettings<T>) => B): VigorFetchNext<T, { policy: { settings: B["config"]["policy"]["settings"] } }, VigorFetchSettingsStrategy>
    public settings<
        const R extends VigorFetchSchema<any>
    >(input: VigorFetchPolicySettings<R>): VigorFetchNext<T, { policy: { settings: R["policy"]["settings"] } }, VigorFetchSettingsStrategy>
    public settings(input: any): any {
        // `retryHeaders`/`unretryStatus` are whole lists: setting them replaces the previous list.
        const strategy = { policy: { settings: { retryHeaders: "replace", unretryStatus: "replace" } } } as const
        if (typeof input === 'function' || input instanceof VigorFetchPolicySettings) {
            // The callback builder starts from the current settings, so lists it doesn't touch are kept.
            const result = typeof input === 'function'
                ? input(new VigorFetchPolicySettings<T>(this.config))
                : input
            return this._next(
                { policy: { settings: result.config.policy.settings } } as const,
                strategy
            )
        }
        return this._next({ policy: { settings: input } } as const, strategy)
    }
    /** Configures the fetch policy's middleware pipeline. */
    public middlewares<
        const N extends VigorDeepPartial<VigorFetchPolicyMiddlewaresSchema<T>>
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorFetchPolicyMiddlewaresSchema<T>>>): VigorFetchNext<T, { policy: { middlewares: N } }>
    /**
     * The callback's builder is typed as already holding this instance's
     * middlewares (so each new one sees the pipeline so far), while at
     * runtime it starts empty and its result is appended. Either way, its
     * type is the full list, so it replaces the current one.
     */
    public middlewares<
        const B extends VigorFetchPolicyMiddlewares<any>
    >(input: (s: VigorFetchPolicyMiddlewares<T>) => B): VigorFetchNext<T, { policy: { middlewares: B["config"]["policy"]["middlewares"] } }, { policy: { middlewares: "replace" } }>
    public middlewares<
        const R extends VigorFetchSchema<any>
    >(input: VigorFetchPolicyMiddlewares<R>): VigorFetchNext<T, { policy: { middlewares: R["policy"]["middlewares"] } }>
    public middlewares(input: any): any {
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
    /**
     * Configures the retry engine used to send the underlying request. This
     * replaces the previous engine config; a config object is applied on
     * top of the retry defaults.
     */
    public retry<
        const N extends VigorDeepPartial<VigorRetrySchema<any>>
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorRetrySchema<any>>>): VigorFetchNext<T, { policy: { retry: VigorDeepMerge<typeof VigorRetryBase, N> } }, { policy: { retry: "replace" } }>
    public retry<
        const B extends VigorRetry<any>
    >(input: (r: VigorRetry) => B): VigorFetchNext<T, { policy: { retry: B["config"] } }, { policy: { retry: "replace" } }>
    public retry<
        const R extends VigorRetrySchema<any>
    >(input: VigorRetry<R>): VigorFetchNext<T, { policy: { retry: R } }, { policy: { retry: "replace" } }>
    public retry(input: any): any {
        if (typeof input === 'function' || input instanceof VigorRetry) {
            const result = typeof input === 'function'
                ? input(new VigorRetry())
                : input
            return this._next({ policy: { retry: result.config } } as const, { policy: { retry: "replace" } })
        }
        // Filled in from the defaults, so the engine config is always complete.
        return this._next({ policy: { retry: this._merge(VigorRetryBase, input) } } as const, { policy: { retry: "replace" } })
    }
    /**
     * Configures the parse engine used to interpret the response. This
     * replaces the previous engine config; a config object is applied on
     * top of the parse defaults. Its result type (including `.cast<T>()`,
     * `raw`, and its middlewares) becomes this request's result type.
     */
    public parse<
        const N extends VigorDeepPartial<VigorParseSchema<any>>
    >(input: N & VigorNoExtraKeys<N, VigorDeepPartial<VigorParseSchema<any>>>): VigorFetchNext<T, { policy: { parse: VigorDeepMerge<typeof VigorParseBase, N> } }, { policy: { parse: "replace" } }>
    public parse<
        const B extends VigorParse<any>
    >(input: (p: VigorParse) => B): VigorFetchNext<T, { policy: { parse: B["config"] } }, { policy: { parse: "replace" } }>
    public parse<
        const R extends VigorParseSchema<any>
    >(input: VigorParse<R>): VigorFetchNext<T, { policy: { parse: R } }, { policy: { parse: "replace" } }>
    public parse(input: any): any {
        if (typeof input === 'function' || input instanceof VigorParse) {
            const result = typeof input === 'function'
                ? input(new VigorParse())
                : input
            return this._next({ policy: { parse: result.config } } as const, { policy: { parse: "replace" } })
        }
        // Filled in from the defaults, so the engine config is always complete.
        return this._next({ policy: { parse: this._merge(VigorParseBase, input) } } as const, { policy: { parse: "replace" } })
    }

    /** Whether `v` is a plain object literal (not an array, `FormData`, `Blob`, ...). */
    protected _isPlainObject(v: unknown): v is Record<string, unknown> {
        return v !== null && typeof v === "object" && Object.getPrototypeOf(v) === Object.prototype
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
     * resolved against it. Throws `INVALID_PROTOCOL` (with `context`) if
     * neither is possible, and with `settings.confinePath` on, `PATH_ESCAPED`
     * if the result leaves the origin's domain or path.
     */
    protected _buildUrl(
        origin: string,
        path: string[],
        query: VigorFetchPolicySchema<any>["query"],
        hash: string,
        context: VigorFetchContextSchema<any>
    ): string {
        const base = this._resolveBase()

        let originObj: URL
        try {
            originObj = new URL(origin, base)
        } catch {
            throw new VigorFetchError("INVALID_PROTOCOL", {
                method: "_buildUrl",
                data: { origin, base },
                context
            })
        }

        const baseStr = originObj.origin
        const pathParts = [originObj.pathname.replace(/^\/+|\/+$/g, '')]
        // `/` inside a segment still separates path levels, but every other
        // reserved character (`?`, `#`, `%`, spaces, ...) is percent-encoded so a
        // segment can never leak into the query or fragment.
        for (const p of path) {
            for (const part of p.split('/')) pathParts.push(encodeURIComponent(part))
        }
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

        if (context.policy.settings.confinePath) {
            // The origin's path is the boundary: `/api/v1` allows `/api/v1` and
            // `/api/v1/...`, but not `/api/v1x` or anything a `..` climbs to.
            const basePath = "/" + originObj.pathname.replace(/^\/+|\/+$/g, '')
            const inside = basePath === "/"
                || mainObj.pathname === basePath
                || mainObj.pathname.startsWith(basePath + "/")
            if (mainObj.origin !== originObj.origin || !inside) throw new VigorFetchError("PATH_ESCAPED", {
                method: "_buildUrl",
                data: { url: mainObj.href, base: originObj.origin + (basePath === "/" ? "" : basePath) },
                context
            })
        }
        return mainObj.href
    }

    /** Infers the `Content-Type` header and serializes `body` into a `BodyInit`. Throws `INVALID_BODY` (with `context`) for anything else. */
    protected _normalizeBody(body: unknown, context: VigorFetchContextSchema<any>): { headers: Record<string, string>, body: BodyInit | null | undefined } {
        if (body == null) return { headers: {}, body: body as null | undefined }
        if (typeof body === "string") return { headers: { "Content-Type": "text/plain;charset=UTF-8" }, body }
        if (body instanceof Blob) return { headers: body.type ? { "Content-Type": body.type } : {}, body }
        if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) return { headers: { "Content-Type": "application/octet-stream" }, body: body as BodyInit }
        if (typeof ReadableStream !== "undefined" && body instanceof ReadableStream) return { headers: { "Content-Type": "application/octet-stream" }, body }
        if (body instanceof URLSearchParams) return { headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" }, body }
        if (body instanceof FormData) return { headers: {}, body }
        if (typeof body === "object") return { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }

        throw new VigorFetchError("INVALID_BODY", {
            method: "_normalizeBody",
            data: { received: body },
            context
        })
    }

    /**
     * Returns the absolute URL a redirect points at, or `null` when the
     * response isn't a redirect. A response `fetch` already followed
     * (`redirect: "follow"`, the default) yields its final URL; a readable
     * `3xx` (`redirect: "manual"` outside browsers) yields its `Location`,
     * resolved against the responding URL.
     */
    protected _resolveRedirect(response: Response, href: string): string | null {
        if (response.redirected && response.url) return response.url
        if (response.status < 300 || response.status >= 400) return null
        const location = response.headers.get("location")
        if (!location) return null
        try {
            return new URL(location, response.url || href).href
        } catch {
            return null
        }
    }

    /** The browser's `location`, or `null` in environments without one (e.g. Node). */
    protected _browserLocation(): { href: string } | null {
        const win = (globalThis as any).window
        return win?.location?.href !== undefined ? win.location : null
    }

    /** Assigns `source` headers onto `target`, replacing any existing key that differs only in case. */
    protected _assignHeaders(target: Record<string, string>, source: Record<string, string>): void {
        for (const [key, value] of Object.entries(source)) {
            const lower = key.toLowerCase()
            for (const existing of Object.keys(target)) {
                if (existing.toLowerCase() === lower) delete target[existing]
            }
            target[key] = value
        }
    }

    /**
     * Converts a rate-limit header value into a delay in milliseconds, or
     * `null` if it can't be used. Accepts delta seconds (`Retry-After: 120`),
     * Unix epoch seconds or milliseconds (`X-RateLimit-Reset: 1735689600`),
     * and HTTP dates.
     */
    protected _parseRetryHeader(value: string | null): number | null {
        if (!value) return null
        const num = Number(value)
        let delay: number
        if (value.trim() !== "" && !isNaN(num)) {
            if (num >= 1e12) delay = num - Date.now()               // epoch milliseconds
            else if (num >= 1e9) delay = num * 1000 - Date.now()    // epoch seconds
            else delay = num * 1000                                  // delta seconds
        } else {
            const date = new Date(value).getTime()
            if (isNaN(date)) return null
            delay = date - Date.now()
        }
        return delay > 0 ? delay : null
    }

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
    public apiMap<const M extends VigorApiMap<M>>(): VigorFetchNext<T, { apiMap: VigorApiMapSlot<M, T["policy"]["path"]> }, { apiMap: "replace" }> {
        return this._next(
            { apiMap: VigorCastPlaceholder } as unknown as { apiMap: VigorApiMapSlot<M, T["policy"]["path"]> },
            { apiMap: "replace" }
        )
    }
    /**
     * Sets the method and path from a route of the API map (see `.apiMap()`),
     * filling its `:name` segments from `params`. The path is appended to the
     * one set so far, like `.path()`.
     *
     * @example
     * await api.route("GET /users/:id", { id: 1 }).request() // User
     */
    public route<
        const K extends VigorRouteWithoutParams<VigorFetchRouteKeys<T>>
    >(key: K): VigorFetchNext<T, { policy: { method: VigorRouteMethod<K>, path: VigorRoutePathList<VigorRoutePath<K>, {}> } }>
    public route<
        const K extends VigorRouteWithParams<VigorFetchRouteKeys<T>>,
        const P extends VigorRouteParams<K, VigorApiRouteOf<T["apiMap"], K>>
    >(key: K, params: P & VigorNoExtraKeys<P, VigorRouteParams<K, VigorApiRouteOf<T["apiMap"], K>>>): VigorFetchNext<T, { policy: { method: VigorRouteMethod<K>, path: VigorRoutePathList<VigorRoutePath<K>, P> } }>
    public route(key: string, ...params: [Record<string, VigorStringable>?]): any {
        const route: string = key
        const space = route.indexOf(" ")
        const method = route.slice(0, space)
        const values = (params[0] ?? {}) as Record<string, VigorStringable>
        const segments = route.slice(space + 1).split("/").filter(Boolean).map(segment => {
            if (!segment.startsWith(":")) return segment
            const name = segment.slice(1)
            const value = values[name]
            if (value === null || value === undefined) throw new VigorFetchError("VALUE_REQUIRED", {
                method: "route",
                data: { key: `params.${name}` }
            })
            return value
        })
        return (this.method as any)(method).path(...segments)
    }
    public cast<const C>(): VigorFetchNext<T, { cast: C }, { cast: "replace" }> {
        return this._next(
            { cast: VigorCastPlaceholder } as unknown as { cast: C },
            { cast: "replace" }
        )
    }
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
    public async request<R = VigorFetchResult<T>>(this: VigorFetchRequestThis<T>): Promise<R> {
        const res = await (this as unknown as VigorFetch<T>).requestRuntime<R>()
        if(res.success) return res.data
        throw res.error
    }
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
    public async requestVerbose<R = VigorFetchInferResult>(this: VigorFetchRequestThis<T>): Promise<VigorFetchVerboseResult<T, R>> {
        return await (this as unknown as VigorFetch<T>).requestRuntime() as VigorFetchVerboseResult<T, R>
    }
    /**
     * Internal execution loop implementing URL building, retry, parsing, and
     * restart handling. Never throws: every failure, including one from
     * `onError` or `default`, comes back as an envelope carrying the timeline.
     * A restart passes the same `timeline` on, so it keeps growing across runs.
     */
    private async requestRuntime<R = VigorFetchContextSchema<T>["result"]>(
        restartAttempt: number = 1,
        timeline: VigorFetchTimeline = [],
        startedAt: number = performance.now()
    ): Promise<
        {success: true, data: R, error: null, status: number | null, response: Response | null, timeline: VigorFetchTimeline} |
        {success: false, data: null, error: VigorFetchRequestError<T>, status: null, response: null, timeline: VigorFetchTimeline}
    > {
        const config = this._merge(this.config, {}) as VigorFetchSchema<T>
        let ctx: VigorFetchContextSchema<T> = this._merge(VigorFetchContextBase, {
            policy: config.policy
        }, undefined, "replace")
        // Assigned after `_merge`, which would otherwise clone it: `ctx.timeline` is the array entries are pushed to.
        ctx.timeline = timeline

        const { add, stage } = createVigorTimelineRecorder(timeline, (): VigorFetchTimelineSnapshot => this._snapshot(ctx), config.policy.settings.debug)
        add("PROCESS_HANDLING", { type: "REQUEST_START", data: { restartAttempt } })
        const end = (success: boolean, outcome: VigorTimelineOutcome, error: unknown) => add("REQUEST_END", {
            success, outcome, error, took: performance.now() - startedAt, restarts: restartAttempt - 1
        })
        // `response` is the one the result was parsed from; a recovered result has none.
        const succeed = (data: R, outcome: VigorTimelineOutcome, response: Response | null = null) => {
            end(true, outcome, null)
            return { success: true, data, error: null, status: response?.status ?? null, response, timeline } as const
        }
        const fail = (error: unknown) => {
            end(false, "failed", error)
            return { success: false, data: null, error: error as VigorFetchRequestError<T>, status: null, response: null, timeline } as const
        }
        // The attempt whose response the result is parsed from.
        let lastAttempt = 0

        const runRetry = async (engine: VigorRetry<any>) => {
            add("RETRY_STARTED", { engine })
            const started = performance.now()
            const res = await engine.requestVerbose<Response>()
            add("RETRY_ENDED", {
                engine,
                timeline: res.timeline,
                took: performance.now() - started,
                response: res.success ? res.data : VigorDefault
            })
            return res
        }
        const runParse = async <D>(source: VigorFetchParseSource, attempt: number, engine: VigorParse<any>) => {
            add("PARSE_STARTED", { engine, source, attempt })
            const started = performance.now()
            const res = await engine.requestVerbose<D>()
            add("PARSE_ENDED", {
                engine,
                source,
                attempt,
                timeline: res.timeline,
                took: performance.now() - started,
                result: res.success ? res.data : VigorDefault
            })
            return res
        }

        const throwError: VigorFetchPolicyMiddlewaresApi<T>["throwError"] = (err) => { throw err }

        try {
            if (isVigorEmpty(ctx.policy.origin)) throw new VigorFetchError("VALUE_REQUIRED", {
                method: "request",
                data: { key: "origin" },
                context: ctx
            })

            ctx.href = this._buildUrl(ctx.policy.origin, ctx.policy.path, ctx.policy.query, ctx.policy.hash, ctx)
            add("BUILT_URL", { url: ctx.href })

            const hasBody = !isVigorEmpty(ctx.policy.body) && ctx.policy.body != null
            const method = isVigorEmpty(ctx.policy.method) ? (hasBody ? "POST" : "GET") : ctx.policy.method

            const options: VigorFetchOptions = {
                ...ctx.policy.extra,
                method: method as VigorFetchOptions["method"],
                headers: {}
            }
            if (hasBody) {
                const normalized = this._normalizeBody(ctx.policy.body, ctx)
                if (normalized.body !== undefined) options.body = normalized.body
                Object.assign(options.headers, normalized.headers)
            }
            this._assignHeaders(options.headers, ctx.policy.headers)

            // Exposed before `before` runs, so fluent middlewares can edit
            // `ctx.options` directly; the intercept API writes to the same place.
            ctx.options = options
            await stage("before", ctx.policy.middlewares.before, async (middleware, trace) => {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx as any)
                } else {
                    ctx = (await middleware.func(ctx as any, trace({
                        throwError,
                        setOptions: (o) => { ctx.options = o },
                        setHeaders: (h) => { (ctx.options as VigorFetchOptions).headers = h },
                        setBody: (b) => { (ctx.options as VigorFetchOptions).body = b as any }
                    })) ?? ctx) as typeof ctx
                }
            })
            const finalOptions = (isVigorDefault(ctx.options) ? options : ctx.options) as VigorFetchOptions
            ctx.options = finalOptions
            add("SET_OPTIONS", { options: finalOptions })
            const finalMethod = (finalOptions.method ?? "GET").toUpperCase()
            // Native fetch rejects this with a `TypeError`, which would otherwise be retried in vain.
            if (finalOptions.body != null && (finalMethod === "GET" || finalMethod === "HEAD")) throw new VigorFetchError("BODY_NOT_ALLOWED", {
                method: "request",
                data: { method: finalMethod },
                context: ctx
            })
            const isStreamBody = typeof ReadableStream !== "undefined" && finalOptions.body instanceof ReadableStream
            if (isStreamBody) {
                // Node's fetch requires this for streaming request bodies.
                (finalOptions as any).duplex ??= "half"
            }

            // Untargeted: the failed-response parse and the result parse each set their own target.
            // With `settings.debug`, the nested engines record their timelines too.
            const nestedDebug = { policy: { settings: { debug: true } } } as const
            const parseEngine = new VigorParse(config.policy.settings.debug ? this._merge(ctx.policy.parse, nestedDebug) : ctx.policy.parse)
            const retryEngine = new VigorRetry(config.policy.settings.debug ? this._merge(ctx.policy.retry, nestedDebug) : ctx.policy.retry)
                .target(async (signal) => {
                    return await fetch(ctx.href, { ...finalOptions, signal } as RequestInit)
                })
                .middlewares(m => m
                    .after("intercept", async (rctx, api) => {
                        const response = rctx.result as Response
                        lastAttempt = rctx.system.attempt
                        add("RESPONSE_RECEIVED", {
                            attempt: rctx.system.attempt,
                            status: response.status,
                            statusText: response.statusText,
                            ok: response.ok,
                            redirected: response.redirected,
                            url: response.url
                        })
                        // Checked before `ok`, since a 3xx is not `ok` and would otherwise be treated as a failure.
                        if (ctx.policy.settings.redirect) {
                            const target = this._resolveRedirect(response, ctx.href)
                            const location = this._browserLocation()
                            if (target && location) {
                                location.href = target
                                api.throwError(new VigorFetchError("REDIRECTED", {
                                    method: "request",
                                    data: { url: target, status: response.status, response },
                                    context: ctx
                                }))
                            }
                        }
                        // `304 Not Modified` answers a conditional request the caller made on purpose — it's a result, not a failure.
                        if (!response.ok && response.status !== 304) {
                            const parseRes = await runParse("failedResponse", rctx.system.attempt, parseEngine.target(response.clone()))
                            const parsed: unknown = parseRes.success ? parseRes.data : undefined
                            // Untyped here: its per-status `data` type is the API map's view of this response.
                            api.throwError(new VigorFetchError<"FETCH_FAILED", any>("FETCH_FAILED", {
                                method: "request",
                                data: {
                                    status: response.status,
                                    statusText: response.statusText,
                                    response,
                                    url: response.url,
                                    parsed
                                },
                                context: ctx
                            }))
                        }
                        // Read the whole body inside the attempt, so the per-attempt timeout
                        // and abort signals cover it and a body cut off mid-transfer is
                        // retried. The bytes are cached on `response`, so the parse step
                        // reuses them. A raw result is left to the caller to stream.
                        if (!ctx.policy.parse.policy.settings.raw) await readVigorParseBody(response)
                        return rctx
                    })
                    .retryIf("intercept", async (rctx, api) => {
                        const response = rctx.error instanceof VigorFetchError
                            ? (rctx.error.data as any)?.response as Response | undefined
                            : undefined
                        // Only vetoes — never forces a retry, so a user `retryIf` on the retry engine keeps its decision.
                        if (rctx.error instanceof VigorFetchError && rctx.error.code === "REDIRECTED") api.cancelRetry()
                        // A stream body was consumed by the first attempt and can't be sent again.
                        else if (isStreamBody) api.cancelRetry()
                        // A redirect the caller chose to handle manually won't change on a retry.
                        else if (response && (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400))) api.cancelRetry()
                        else if (response && ctx.policy.settings.unretryStatus.includes(response.status)) api.cancelRetry()
                        return rctx
                    })
                    .onRetry("intercept", async (rctx, api) => {
                        const response = rctx.error instanceof VigorFetchError
                            ? (rctx.error.data as any)?.response as Response | undefined
                            : undefined
                        if (response?.status === 429 || response?.status === 503) {
                            for (const header of ctx.policy.settings.retryHeaders) {
                                const delay = this._parseRetryHeader(response.headers.get(header))
                                if (delay !== null) {
                                    api.setDelay(Math.min(delay, ctx.policy.settings.maxRetryAfter))
                                    break
                                }
                            }
                        }
                        return rctx
                    })
                )
            // Fetch's own middlewares are the last of these stages; mark them so the
            // timeline tells them from the ones configured with `.retry(...)`.
            for (const name of ["after", "retryIf", "onRetry"] as const) {
                const list = retryEngine.config.policy.middlewares[name]
                markVigorInternal(list[list.length - 1].func)
            }

            add("ENGINE_CREATED", { retryEngine, parseEngine })

            const retryRes = await runRetry(retryEngine)
            if (!retryRes.success) throw adoptVigorFetchError(retryRes.error, ctx)
            ctx.response = retryRes.data

            const parseRes = await runParse<R>("response", lastAttempt, parseEngine.target(ctx.response))
            if (!parseRes.success) throw adoptVigorFetchError(parseRes.error, ctx)
            ctx.result = parseRes.data as typeof ctx.result

            await stage("after", ctx.policy.middlewares.after, async (middleware, trace) => {
                if (middleware._mode === "fluent") {
                    await middleware.func(ctx as any)
                } else {
                    ctx = (await middleware.func(ctx as any, trace({ throwError, setResult: (r) => { ctx.result = r } })) ?? ctx) as typeof ctx
                }
            })

            const setResult: VigorFetchPolicyMiddlewaresApi<T>["setResult"] = (r) => { ctx.result = r }
            await stage("onResult", ctx.policy.middlewares.onResult, async (middleware, trace) => {
                if (middleware._mode === "fluent") {
                    ctx.result = await middleware.func(ctx.result as any)
                } else {
                    ctx = (await middleware.func(ctx as any, trace({ setResult, throwError })) ?? ctx) as typeof ctx
                }
            })

            return succeed(ctx.result as R, "result", ctx.response as Response)
        } catch (error) {
            ctx.error = error
            add("PROCESS_HANDLING", { type: "REQUEST_ERROR", data: { error } })
            ctx.flags.overridden = false
            ctx.flags.restarted = false

            const setResult: VigorFetchPolicyMiddlewaresApi<T>["setResult"] = (r) => {
                ctx.flags.overridden = true
                ctx.result = r
            }
            const proceedRestart: VigorFetchPolicyMiddlewaresApi<T>["proceedRestart"] = () => ctx.flags.restarted = true
            const cancelRestart: VigorFetchPolicyMiddlewaresApi<T>["cancelRestart"] = () => ctx.flags.restarted = false

            try {
                await stage("onError", ctx.policy.middlewares.onError, async (middleware, trace) => {
                    if (middleware._mode === "fluent") {
                        await middleware.func(ctx.error)
                    } else {
                        ctx = (await middleware.func(ctx as any, trace({ setResult, throwError, proceedRestart, cancelRestart })) ?? ctx) as typeof ctx
                    }
                })
            } catch (err) {
                return fail(err)
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
                }))
                add("PROCESS_HANDLING", { type: "REQUEST_RESTART", data: { restartAttempt: restartAttempt + 1 } })
                return await this.requestRuntime<R>(restartAttempt + 1, timeline, startedAt)
            }
            if (ctx.flags.overridden) return succeed(ctx.result as R, "overridden")
            if (!isVigorEmpty(ctx.policy.settings.default)) {
                try {
                    return succeed(await ctx.policy.settings.default(ctx) as R, "default")
                } catch (err) {
                    return fail(err)
                }
            }
            return fail(error)
        }
    }
}