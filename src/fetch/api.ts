import type { VigorEmptyType } from "@core/symbol"
import type { VigorBuiltin, VigorSimplify } from "@core/types"
import type { VigorFetchOptions } from "./context"
import type { VigorStringable } from "./policy"

/** The HTTP methods a route key can start with. */
export type VigorApiMethod = NonNullable<VigorFetchOptions["method"]>

/**
 * A route key: `"<METHOD> /<path>"`, where a `:name` segment is a path
 * parameter. The API map is flattened to these (see {@link VigorApiFlatten}),
 * and `.route()` takes them.
 */
export type VigorApiRouteKey = `${VigorApiMethod} /${string}`

/** A whole status class as a `responses` key: `"4xx"` stands for every `4xx` status not listed on its own. */
export type VigorApiStatusClass = "2xx" | "3xx" | "4xx" | "5xx"

type VigorDigit = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"

/** `"404"` → `404`, per member of a union. */
type VigorToNumber<S> = S extends `${infer N extends number}` ? N : never

/** Every status of a class: `VigorHttpStatusOf<"4">` is `400 | 401 | … | 499`. */
export type VigorHttpStatusOf<H extends "2" | "3" | "4" | "5"> = VigorToNumber<`${H}${VigorDigit}${VigorDigit}`>

/** The statuses a request succeeds with, as at runtime: every `2xx`, and `304 Not Modified`. */
export type VigorHttpSuccessStatus = VigorHttpStatusOf<"2"> | 304

/** The statuses a request fails with `FETCH_FAILED` for: every other `3xx`, `4xx` and `5xx`. */
export type VigorHttpFailureStatus = Exclude<VigorHttpStatusOf<"3">, 304> | VigorHttpStatusOf<"4"> | VigorHttpStatusOf<"5">

/** A path parameter's value, as `.route()` takes it. */
export type VigorApiParamValue = Exclude<VigorStringable, null | undefined>

/** A path key of the API map: `"/<path>"`, where a `:name` segment is a path parameter. */
export type VigorApiPathKey = `/${string}`

/** A `responses` map: the parsed body per exact status (`200`, `"404"`) or status class (`"4xx"`). */
export type VigorApiResponses = { [status: number]: unknown } & { [C in VigorApiStatusClass]?: unknown }

/**
 * What a request to an operation must carry. Both are checked when the
 * request is sent: `request()` / `requestVerbose()` don't compile on a
 * request that doesn't match.
 *
 * - `query` — the query `.query()` must add up to.
 * - `body` — the body the request must carry (optional when it allows `undefined`).
 */
export type VigorApiRequest = {
    query?: object
    body?: unknown
}

/**
 * One operation: what a method of a path takes and answers with. Every key
 * is optional:
 *
 * - `request` — the {@link VigorApiRequest} it must carry.
 * - `responses` — the parsed body per status: an exact status (`200`,
 *   `404`) or a whole class (`"4xx"`). Success statuses (`2xx`, `304`) are
 *   what the request resolves to; the others type `FETCH_FAILED`'s
 *   `data.parsed`, narrowed by `data.status`.
 * - `response` — shorthand for `responses: { "2xx": ... }`.
 */
export type VigorApiOperation = {
    request?: VigorApiRequest
    response?: unknown
    responses?: VigorApiResponses
}

/**
 * One path of the API map: `params` (shared by every method of the path)
 * and an operation per method. A method may also take a tuple of
 * operations — overloads picked by the request's `body`/`query`, the first
 * one it surely matches winning.
 */
export type VigorApiPath = {
    params?: { [name: string]: VigorApiParamValue }
} & {
    [M in VigorApiMethod]?: VigorApiOperation | readonly [VigorApiOperation, ...VigorApiOperation[]]
}

/**
 * One operation as the matcher sees it, flattened from its path and
 * operation: the path's `params`, the operation's `request` fields and its
 * responses side by side.
 */
export type VigorApiRoute = {
    response?: unknown
    responses?: VigorApiResponses
    params?: { [name: string]: VigorApiParamValue }
    query?: object
    body?: unknown
}

/** `responses` keys must be statuses (`404` or `"404"`) or status classes (`"4xx"`). */
type VigorApiResponsesCheck<S> =
    S extends object
        ? { [K in keyof S]: K extends number | `${number}` | VigorApiStatusClass ? unknown : never }
        : VigorApiResponses

/** A `request` may only hold `query` and `body`. */
type VigorApiRequestCheck<Q> =
    Q extends object
        ? { [K in keyof Q]: K extends "query" ? object | undefined : K extends "body" ? unknown : never }
        : VigorApiRequest

/** An operation may only hold `request`, `response` and `responses`. */
type VigorApiOperationCheck<O> =
    O extends readonly unknown[]
        ? VigorApiOperation
        : O extends object
            ? {
                [K in keyof O]: K extends "request"
                    ? VigorApiRequestCheck<O[K]>
                    : K extends "response"
                        ? unknown
                        : K extends "responses"
                            ? VigorApiResponsesCheck<O[K]>
                            : never
            }
            : VigorApiOperation

/** A method's value: one operation, or a non-empty tuple of them. */
type VigorApiMethodCheck<X> =
    X extends readonly unknown[]
        ? X extends readonly []
            ? readonly [VigorApiOperation, ...VigorApiOperation[]]
            : number extends X["length"]
                // A plain array has no order to pick overloads by.
                ? readonly [VigorApiOperation, ...VigorApiOperation[]]
                : { [I in keyof X]: VigorApiOperationCheck<X[I]> }
        : VigorApiOperationCheck<X>

/** A path may only hold `params` and upper-case methods. */
type VigorApiPathCheck<P> =
    P extends object
        ? {
            [K in keyof P]: K extends "params"
                ? { [name: string]: VigorApiParamValue }
                : K extends VigorApiMethod
                    ? VigorApiMethodCheck<P[K]>
                    : never
        }
        : VigorApiPath

/**
 * Validates an API map: every key must be a {@link VigorApiPathKey} and
 * every value a {@link VigorApiPath}. Used as `M extends VigorApiMap<M>`.
 *
 * @example
 * type Api = {
 *     "/users": {
 *         GET: { request: { query: { page?: number } }, response: User[] }
 *         POST: { request: { body: { name: string } }, responses: { 201: User, 422: { fields: Record<string, string> } } }
 *     }
 *     "/users/:id": {
 *         params: { id: number }
 *         GET: { responses: { 200: User, 404: { error: "not_found" }, "5xx": { message: string } } }
 *         DELETE: { response: null }
 *     }
 * }
 */
export type VigorApiMap<M> = {
    [K in keyof M]: K extends VigorApiPathKey ? VigorApiPathCheck<M[K]> : never
}

/** An operation of path `Item` as a {@link VigorApiRoute}. */
type VigorApiNormalize<Item, O> = VigorSimplify<
    (Item extends { params: infer P } ? { params: P } : {})
    & (O extends { request: infer Q } ? Q : {})
    & Pick<O, keyof O & ("response" | "responses")>
>

/** A method's value as its list of overloads: one route, or one per tuple entry. */
type VigorApiVariants<Item, X> =
    X extends readonly unknown[]
        ? { -readonly [I in keyof X]: VigorApiNormalize<Item, X[I]> }
        : [VigorApiNormalize<Item, X>]

/** Every `"<METHOD> /<path>"` key the nested map `M` has. */
type VigorApiFlatKey<M> = {
    [P in keyof M & VigorApiPathKey]: `${keyof M[P] & VigorApiMethod} ${P}`
}[keyof M & VigorApiPathKey]

/**
 * The nested map `M` flattened to one entry per method and path, keyed
 * `"<METHOD> /<path>"`, each the list of its overloads as routes.
 */
export type VigorApiFlatten<M> = {
    [K in VigorApiFlatKey<M>]: K extends `${infer Method} ${infer P}`
        ? P extends keyof M
            ? Method extends keyof M[P]
                ? VigorApiVariants<M[P], NonNullable<M[P][Method]>>
                : never
            : never
        : never
}

/**
 * What `.apiMap<M>()` stores on the schema: the map, flattened (see
 * {@link VigorApiFlatten}), and the path segments already set when it was
 * called, which every route is relative to.
 */
export type VigorApiMapSlot<M, Base extends readonly string[]> = {
    map: M
    base: Base
}

/** One `.path()` argument as the string segment it becomes at runtime. */
type VigorPathSegment<V> =
    V extends Date
        ? string
        : V extends string | number | bigint | boolean
            ? `${V}`
            : string

/**
 * The path segments `.path(mode, ...N)` values become with the default `path` serializer: each stringified, with
 * `null`/`undefined` dropped like at runtime. An argument that may or may
 * not be dropped makes the length unknown, so the list becomes `string[]`.
 */
export type VigorPathList<N extends readonly unknown[]> =
    N extends readonly [infer H, ...infer R]
        ? [H] extends [null | undefined]
            ? VigorPathList<R>
            : null extends H
                ? string[]
                : undefined extends H
                    ? string[]
                    : [VigorPathSegment<H>, ...VigorPathList<R>]
        : number extends N["length"]
            ? string[]
            : []

/** Splits a path string on `/`, dropping empty segments (`"/a//b/"` → `["a", "b"]`). */
type VigorSplitPath<P extends string> =
    P extends `${infer H}/${infer R}`
        ? [...(H extends "" ? [] : [H]), ...VigorSplitPath<R>]
        : P extends ""
            ? []
            : [P]

/**
 * The URL path segments a stored path list produces: a literal entry is split
 * on `/` like `_buildUrl` does, a non-literal one (`string`, `` `${number}` ``)
 * stays one unknown segment. A non-tuple list can't be matched, so it stays
 * `string[]`.
 */
export type VigorPathSegments<Path> =
    Path extends readonly [infer H extends string, ...infer R]
        ? [...(string extends H ? [string] : VigorSplitPath<H>), ...VigorPathSegments<R>]
        : Path extends readonly []
            ? []
            : string[]

/** `A` without its first `B["length"]` elements. */
type VigorDropPrefix<A extends readonly string[], B extends readonly string[]> =
    B extends readonly [any, ...infer BR extends string[]]
        ? A extends readonly [any, ...infer AR extends string[]]
            ? VigorDropPrefix<AR, BR>
            : string[]
        : A

/** Whether route segments `R` match actual segments `A`. */
type VigorMatchSegments<R extends readonly string[], A extends readonly string[]> =
    R extends readonly [infer RH, ...infer RT extends string[]]
        ? A extends readonly [infer AH, ...infer AT extends string[]]
            ? RH extends `:${string}`
                ? VigorMatchSegments<RT, AT>
                // A static segment needs that exact literal: an unknown
                // actual segment (`string`) only ever matches a parameter.
                : [AH] extends [RH]
                    ? VigorMatchSegments<RT, AT>
                    : false
            : false
        : A extends readonly []
            ? true
            : false

type VigorRouteCandidate = { key: string, segs: readonly string[] }

/** The routes of `M` for `Method` whose path matches `A`. */
type VigorRouteCandidates<M, Method, A extends readonly string[]> = {
    [K in keyof M & string]: K extends `${infer RM} /${infer RP}`
        ? [RM] extends [Method]
            ? VigorMatchSegments<VigorSplitPath<RP>, A> extends true
                ? { key: K, segs: VigorSplitPath<RP> }
                : never
            : never
        : never
}[keyof M & string]

type VigorStaticHead<C> = C extends { segs: readonly [infer H, ...any] }
    ? H extends `:${string}` ? never : C
    : never

type VigorDropHead<C> = C extends { key: infer K, segs: readonly [any, ...infer R extends string[]] }
    ? { key: K, segs: R }
    : never

/**
 * Picks the most specific of the matching routes, segment by segment from
 * the left: where some candidate has a static segment, the parameter ones
 * drop out (`/users/me` beats `/users/:id`), like a router does.
 */
type VigorMostSpecific<C extends VigorRouteCandidate> =
    // Not distributive: the candidates are compared with each other.
    [C] extends [{ segs: readonly [] }]
        ? C["key"]
        : VigorMostSpecific<
            VigorDropHead<[VigorStaticHead<C>] extends [never] ? C : VigorStaticHead<C>>
        >

/** Marks "no route matched", so the caller can fall back to another type. Type-only. */
export type VigorApiNoMatchType = { readonly __brand: "@vigor-fetch:::Fetch <- ApiNoMatch" }

/** A route the request matched: its key and its overloads (one route each). */
export type VigorApiMatch<K = string, V extends readonly unknown[] = readonly unknown[]> = { key: K, variants: V }

/** The route `A` matches, per possible `A`. */
type VigorApiMatchFor<M, Method, A> =
    A extends readonly string[]
        ? number extends A["length"]
            ? VigorApiNoMatchType
            : [VigorRouteCandidates<M, Method, A>] extends [never]
                ? VigorApiNoMatchType
                : VigorMostSpecific<VigorRouteCandidates<M, Method, A>> extends infer K
                    ? K extends keyof M
                        ? M[K] extends infer V extends readonly unknown[]
                            ? VigorApiMatch<K, V>
                            : VigorApiNoMatchType
                        : VigorApiNoMatchType
                    : never
        : VigorApiNoMatchType

/**
 * The route of the API map in `Slot` that a request with `Method` and stored
 * path list `Path` matches, or `VigorApiNoMatchType`. A union path (e.g.
 * `.path("append", kind)` with `kind: "a" | "b"`) gives a union of matches.
 */
export type VigorApiMatched<Slot, Method, Path> =
    Slot extends VigorApiMapSlot<infer M, infer Base>
        ? VigorApiMatchFor<M, Method, VigorDropPrefix<VigorPathSegments<Path>, VigorPathSegments<Base>>>
        : VigorApiNoMatchType

/** A route's `responses`, with `response` as the `"2xx"` entry it's shorthand for (unless `responses` has one). */
type VigorApiResponsesOf<R> =
    (R extends { responses: infer S } ? S : {}) extends infer S
        ? R extends { response: infer X }
            ? "2xx" extends keyof S ? S : S & { "2xx": X }
            : S
        : never

/** The exact statuses listed in `responses` (`200` and `"200"` alike). */
type VigorApiListedStatus<S> = VigorToNumber<`${keyof S & (number | `${number}`)}`>

/** The entry for exact status `N`, whether it was written `404` or `"404"`. */
type VigorApiResponseAt<S, N extends number> =
    N extends keyof S ? S[N] : `${N}` extends keyof S ? S[`${N}` & keyof S] : never

/** The statuses status class `C` stands for in `S`: the class, minus the ones listed on their own. */
type VigorApiClassStatus<S, C extends VigorApiStatusClass> =
    C extends `${infer H extends "2" | "3" | "4" | "5"}xx`
        ? Exclude<VigorHttpStatusOf<H>, VigorApiListedStatus<S>>
        : never

/**
 * The success outcomes of a route, as `{ status, data }` per status: the
 * listed `2xx`/`304` entries, `"2xx"` for the other `2xx`, and `"3xx"` for
 * an unlisted `304`. Undeclared success statuses aren't modeled — a route
 * that declares none gives `{ status: number, data: VigorApiNoMatchType }`,
 * so the parse engine's type is used.
 */
type VigorApiSuccessOf<S> =
    | {
        [N in VigorApiListedStatus<S> & VigorHttpSuccessStatus]: { status: N, data: VigorApiResponseAt<S, N> }
    }[VigorApiListedStatus<S> & VigorHttpSuccessStatus]
    | ("2xx" extends keyof S ? { status: VigorApiClassStatus<S, "2xx">, data: S["2xx" & keyof S] } : never)
    | ("3xx" extends keyof S
        ? 304 extends VigorApiListedStatus<S> ? never : { status: 304, data: S["3xx" & keyof S] }
        : never) extends infer V
        ? [V] extends [never] ? { status: number, data: VigorApiNoMatchType } : V
        : never

/**
 * The failure outcomes of a route, as `{ status, parsed }` per status: the
 * listed failure entries, each declared class for its remaining statuses,
 * and every status left over with `parsed: unknown` — so narrowing on
 * `status` always lands on the right `parsed`. `parsed` is `undefined` when
 * the failed body couldn't be parsed. A route that declares no failures
 * gives a single `{ status: number, parsed: unknown }`.
 */
type VigorApiFailureOf<S> =
    | {
        [N in VigorApiListedStatus<S> & VigorHttpFailureStatus]: { status: N, parsed: VigorApiResponseAt<S, N> | undefined }
    }[VigorApiListedStatus<S> & VigorHttpFailureStatus]
    | {
        [C in keyof S & ("3xx" | "4xx" | "5xx")]: { status: Exclude<VigorApiClassStatus<S, C>, 304>, parsed: S[C] | undefined }
    }[keyof S & ("3xx" | "4xx" | "5xx")] extends infer V
        ? [V] extends [never]
            ? { status: number, parsed: unknown }
            : V | VigorApiUnlistedFailure<S>
        : never

/** The failure statuses `S` covers neither on their own nor by class, with `parsed: unknown`. */
type VigorApiUnlistedFailure<S> =
    Exclude<
        VigorHttpFailureStatus,
        VigorApiListedStatus<S> | VigorApiClassStatus<S, keyof S & ("3xx" | "4xx" | "5xx")>
    > extends infer N
        ? [N] extends [never] ? never : { status: N, parsed: unknown }
        : never

/**
 * The success outcomes, `{ status, data }`, of the route a request matches
 * (of its overloads, the one(s) {@link VigorApiSelect} picks for `Body` and
 * `Query`); `{ status: number, data: VigorApiNoMatchType }` where none does.
 */
export type VigorApiSuccess<Slot, Method, Path, Body, Query> =
    VigorApiMatched<Slot, Method, Path> extends infer X
        ? X extends VigorApiMatch<any, infer V>
            ? VigorApiSelect<V, Body, Query> extends infer R
                ? R extends unknown ? VigorApiSuccessOf<VigorApiResponsesOf<R>> : never
                : never
            : { status: number, data: VigorApiNoMatchType }
        : never

/**
 * The failure outcomes, `{ status, parsed }`, of the route a request
 * matches (of the overload(s) picked, as for {@link VigorApiSuccess});
 * `{ status: number, parsed: unknown }` where none does.
 */
export type VigorApiFailure<Slot, Method, Path, Body, Query> =
    VigorApiMatched<Slot, Method, Path> extends infer X
        ? X extends VigorApiMatch<any, infer V>
            ? VigorApiSelect<V, Body, Query> extends infer R
                ? R extends unknown ? VigorApiFailureOf<VigorApiResponsesOf<R>> : never
                : never
            : { status: number, parsed: unknown }
        : never

/**
 * The response type the API map gives a request with `Method`, stored path
 * list `Path`, `Body` and `Query` — the union of its route's success
 * responses — or `VigorApiNoMatchType` when no route matches.
 */
export type VigorApiResponse<Slot, Method, Path, Body, Query> = VigorApiSuccess<Slot, Method, Path, Body, Query>["data"]

/** The route of key `K` in the API map stored in `Slot` (its first overload: they share `params`), or `{}`. */
export type VigorApiRouteOf<Slot, K> =
    Slot extends VigorApiMapSlot<infer M, any>
        ? K extends keyof M
            ? M[K] extends readonly [infer R, ...any[]] ? R : {}
            : {}
        : {}

// ----------------------------------------------------------------------------
// request checks: a route's `body`/`query` against the request's
// ----------------------------------------------------------------------------

/**
 * What `request()`'s `this` becomes when the request doesn't match its route:
 * the compiler reports this type, so its keys spell out what's wrong.
 */
export type VigorApiRequestIssue<Key, Problem extends string, Expected, Received> = {
    readonly "vigor-fetch: the request doesn't match its apiMap route": `${Key & string} — ${Problem}`
    readonly expected: Expected
    readonly received: Received
}

/** `T` with every `readonly` dropped, deeply — a `const`-inferred value against a declared type. */
type VigorDeepMutable<T> =
    T extends VigorBuiltin
        ? T
        : { -readonly [K in keyof T]: VigorDeepMutable<T[K]> }

type VigorUnionToIntersection<U> =
    (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never

/** Every `.query()` object of the stored list, as the one object they add up to. */
type VigorQueryOf<Q> =
    Q extends readonly (infer E)[]
        ? [E] extends [never] ? {} : VigorSimplify<VigorUnionToIntersection<E>>
        : {}

type VigorApiBodyIssue<Key, R, Body> =
    "body" extends keyof R
        ? R["body" & keyof R] extends infer B
            ? [Body] extends [VigorEmptyType | null]
                ? undefined extends B ? never : null extends B ? never : VigorApiRequestIssue<Key, "the route requires a body", B, Body>
                : VigorDeepMutable<Body> extends B ? never : VigorApiRequestIssue<Key, "the body does not match the route", B, Body>
            : never
        : never

type VigorApiQueryIssue<Key, R, Query> =
    "query" extends keyof R
        ? [NonNullable<R["query" & keyof R]>, VigorQueryOf<Query>] extends [infer D, infer Q]
            ? [Exclude<keyof Q, keyof D>] extends [never]
                ? VigorDeepMutable<Q> extends D ? never : VigorApiRequestIssue<Key, "the query does not match the route", D, Q>
                : VigorApiRequestIssue<Key, `unknown query key "${Exclude<keyof Q, keyof D> & string}"`, D, Q>
            : never
        : never

// ----------------------------------------------------------------------------
// overloads: which of a route's variants a request is for
// ----------------------------------------------------------------------------

/** The first of overloads `V` that `Body` and `Query` surely match, or `never`. */
type VigorApiDefinite<V, Body, Query> =
    V extends readonly [infer R, ...infer Rest]
        ? [VigorApiBodyIssue<"", R, Body> | VigorApiQueryIssue<"", R, Query>] extends [never]
            ? R
            : VigorApiDefinite<Rest, Body, Query>
        : never

/** Whether `Body` may match route `R`'s body: it may be left out, or the two types overlap. */
type VigorApiBodyPossible<R, Body> =
    "body" extends keyof R
        ? R["body" & keyof R] extends infer B
            ? [Body] extends [VigorEmptyType | null]
                ? undefined extends B ? true : null extends B ? true : false
                : [VigorDeepMutable<Body> & B] extends [never] ? false : true
            : never
        : true

/** The keys `D` requires. */
type VigorApiRequiredKeys<D> = { [K in keyof D]-?: {} extends Pick<D, K> ? never : K }[keyof D]

/**
 * Whether the stored `.query()` list may match route `R`'s query: no
 * unknown key, every required key there, and no value whose type can't be
 * the declared one (`boolean` may be `true`; `"a"` can't be `"b"`).
 */
type VigorApiQueryPossible<R, Query> =
    "query" extends keyof R
        ? [NonNullable<R["query" & keyof R]>, VigorDeepMutable<VigorQueryOf<Query>>] extends [infer D, infer Q]
            ? [Exclude<keyof Q, keyof D>] extends [never]
                ? [Exclude<VigorApiRequiredKeys<D>, keyof Q>] extends [never]
                    ? true extends {
                        [K in keyof Q & keyof D]: [Q[K] & D[K]] extends [never] ? true : never
                    }[keyof Q & keyof D]
                        ? false
                        : true
                    : false
                : false
            : never
        : true

/** The overloads of `V` that `Body` and `Query` may match. */
type VigorApiPossible<V extends readonly unknown[], Body, Query> =
    V[number] extends infer R
        ? R extends unknown
            ? VigorApiBodyPossible<R, Body> extends true
                ? VigorApiQueryPossible<R, Query> extends true ? R : never
                : never
            : never
        : never

/**
 * The route(s) of overloads `V` a request with `Body` and `Query` is for: a
 * single route is always it; otherwise the first one the request surely
 * matches, else every one it may match (their union), else all of them.
 */
export type VigorApiSelect<V extends readonly unknown[], Body, Query> =
    V extends readonly [infer Only]
        ? Only
        : VigorApiDefinite<V, Body, Query> extends infer D
            ? [D] extends [never]
                ? VigorApiPossible<V, Body, Query> extends infer P
                    ? [P] extends [never] ? V[number] : P
                    : never
                : D
            : never

/** What an overload asks of a request, for {@link VigorApiRequestIssue}'s `expected`. */
type VigorApiRequestOf<R> = R extends unknown ? VigorSimplify<Pick<R, keyof R & ("query" | "body")>> : never

/**
 * Everything wrong with a request's `body` (as set) and `query` (the stored
 * `.query()` list) against the route(s) it matches, or `never`. A route
 * without `body`/`query` accepts anything there. A route with overloads
 * only needs one the request may match.
 */
export type VigorApiRequestIssues<Slot, Method, Path, Body, Query> =
    VigorApiMatched<Slot, Method, Path> extends infer X
        ? X extends VigorApiMatch<infer K, infer V>
            ? V extends readonly [infer R]
                ? VigorApiBodyIssue<K, R, Body> | VigorApiQueryIssue<K, R, Query>
                : [VigorApiDefinite<V, Body, Query> | VigorApiPossible<V, Body, Query>] extends [never]
                    ? VigorApiRequestIssue<
                        K,
                        "the request matches none of the route's overloads",
                        VigorApiRequestOf<V[number]>,
                        { body: [Body] extends [VigorEmptyType] ? undefined : Body, query: VigorQueryOf<Query> }
                    >
                    : never
            : never
        : never

/** The method a request is sent with: the one set, else `POST` with a body and `GET` without. */
export type VigorResolvedMethod<Method, Body> =
    Method extends VigorEmptyType
        ? Body extends VigorEmptyType | null ? "GET" : "POST"
        : Method

/** The route keys of the API map stored in `Slot`. */
export type VigorApiKeys<Slot> = Slot extends VigorApiMapSlot<infer M, any> ? keyof M & VigorApiRouteKey : never

type VigorParamNames<P extends string> =
    P extends `${infer H}/${infer R}`
        ? VigorParamName<H> | VigorParamNames<R>
        : VigorParamName<P>

type VigorParamName<S extends string> = S extends `:${infer N}` ? N : never

/** The path part of a route key (`"GET /users/:id"` → `"users/:id"`). */
export type VigorRoutePath<K> = K extends `${VigorApiMethod} /${infer P}` ? P : never

/** The method part of a route key. */
export type VigorRouteMethod<K> = K extends `${infer M extends VigorApiMethod} /${string}` ? M : never

/**
 * The values `.route(key, params)` needs: one per `:name` segment, typed by
 * the route's `params` where it declares one (`R` is the route).
 */
export type VigorRouteParams<K, R = {}> = {
    [N in VigorParamNames<VigorRoutePath<K>>]: R extends { params: infer P }
        ? N extends keyof P ? P[N] : VigorApiParamValue
        : VigorApiParamValue
}

/** The route keys among `K` without `:name` segments. */
export type VigorRouteWithoutParams<K> = K extends unknown
    ? [VigorParamNames<VigorRoutePath<K>>] extends [never] ? K : never
    : never

/** The route keys among `K` with at least one `:name` segment. */
export type VigorRouteWithParams<K> = Exclude<K, VigorRouteWithoutParams<K>>

/** The path list `.route(key, params)` stores: static segments as-is, parameters as their values. */
export type VigorRoutePathList<P extends string, Params> =
    VigorSplitPath<P> extends infer S extends string[]
        ? { [I in keyof S]: S[I] extends `:${infer N}` ? N extends keyof Params ? VigorPathSegment<Params[N]> : string : S[I] }
        : never
