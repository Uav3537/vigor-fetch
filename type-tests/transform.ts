/**
 * Type tests for the transform registry (`VigorTransforms` + `vigor.transform()`).
 * Run with `npm run test:types`.
 */
import vigor, { isVigorFetchError } from "../src/index"

declare module "../src/index" {
    interface VigorTransforms<In, Arg> {
        unwrap: In extends { data: infer D } ? D : never
        wrap: { value: In }
        pick: Arg extends keyof In ? In[Arg] : never
        count: number
    }
}

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
type Expect<T extends true> = T

const unwrap = vigor.transform("unwrap", r => r.data)
const wrap = vigor.transform("wrap", value => ({ value }))
const pick = <const K extends string>(key: K) => vigor.transform("pick", key, r => r[key])
const count = vigor.transform("count", async (r: unknown[]) => r.length)

type User = { id: number, name: string }
type Env<D> = { success: true, data: D, errors: unknown[] }
type Api = {
    "/me": { GET: { response: Env<User> } }
    "/users": { GET: { response: Env<User[]> } }
    "/users/:id": { GET: { responses: { 200: Env<User>, 202: Env<{ queued: true }>, 404: Env<null> } } }
}

// @ts-expect-error  not a registered transform
vigor.transform("nope", r => r)

// ============================================================================
// a shared base: registered before the API map and the path
// ============================================================================

const base = vigor.fetch("https://api.example.com").middlewares(m => m.onResult("fluent", unwrap))
const api = base.apiMap<Api>()

const t1 = await api.path("append", "me").request()
export type T1 = Expect<Equal<typeof t1, User>>
const t2 = await api.path("append", "users").request()
export type T2 = Expect<Equal<typeof t2, User[]>>
const t3 = await api.route("GET /users/:id", { id: 1 }).request()
export type T3 = Expect<Equal<typeof t3, User | { queued: true }>>

// Registered after the map too, and on `.middlewares()` called any number of times.
const t4 = await vigor.fetch("https://api.example.com").apiMap<Api>().middlewares(m => m.onResult("fluent", unwrap)).path("append", "me").request()
export type T4 = Expect<Equal<typeof t4, User>>

// Each status is transformed on its own: narrowing `status` still narrows `data`.
export async function perStatus() {
    const v = await api.route("GET /users/:id", { id: 1 }).requestVerbose()
    if (v.success && v.status === 200) {
        const data: Expect<Equal<typeof v.data, User>> = true
    }
    if (v.success && v.status === 202) {
        const data: Expect<Equal<typeof v.data, { queued: true }>> = true
    }
}

// Later middlewares see the transformed type, plain callbacks included.
const t5 = await api.path("append", "users")
    .middlewares(m => m.onResult("fluent", users => {
        const check: Expect<Equal<typeof users, User[]>> = true
        return users.length
    }))
    .request()
export type T5 = Expect<Equal<typeof t5, number>>

// Transforms compose, in order.
const t6 = await api.path("append", "me").middlewares(m => m.onResult("fluent", wrap)).request()
export type T6 = Expect<Equal<typeof t6, { value: User }>>
const t7 = await api.path("append", "me").middlewares(m => m.onResult("fluent", pick("name"))).request()
export type T7 = Expect<Equal<typeof t7, string>>
const t8 = await api.path("append", "users").middlewares(m => m.onResult("fluent", count)).request()
export type T8 = Expect<Equal<typeof t8, number>>
const t9 = await vigor.fetch("https://api.example.com").apiMap<Api>().path("append", "me")
    .middlewares(m => m.onResult("fluent", wrap).onResult("fluent", wrap))
    .request()
export type T9 = Expect<Equal<typeof t9, { value: { value: Env<User> } }>>

// `default` still joins; `.cast<T>()` replaces the input, and the transform follows it.
const t10 = await api.path("append", "me").settings({ default: () => null }).request()
export type T10 = Expect<Equal<typeof t10, User | null>>
const t11 = await api.path("append", "me").cast<Env<"cast">>().request()
export type T11 = Expect<Equal<typeof t11, "cast">>

// Without a route the input is the parse engine's `unknown`: the entry decides (here `never`).
const t12 = await api.path("append", "nope").request()
export type T12 = Expect<Equal<typeof t12, never>>

// ============================================================================
// the parse engine: a transform there runs on the map data too
// ============================================================================

const plain = vigor.fetch("https://api.example.com").apiMap<Api>()
const p1 = await plain.path("append", "me").parse(p => p.middlewares(m => m.onResult("fluent", unwrap))).request()
export type P1 = Expect<Equal<typeof p1, User>>
// ...and on a failed response's body.
export async function failures() {
    const v = await plain.route("GET /users/:id", { id: 1 }).parse(p => p.middlewares(m => m.onResult("fluent", unwrap))).requestVerbose()
    if (!v.success && isVigorFetchError(v.error, "FETCH_FAILED") && v.error.data.status === 404) {
        const parsed: Expect<Equal<typeof v.error.data.parsed, null | undefined>> = true
    }
}

// ============================================================================
// the other engines
// ============================================================================

const r1 = await vigor.retry(async () => ({ data: 1 as const })).middlewares(m => m.onResult("fluent", unwrap)).request()
export type R1 = Expect<Equal<typeof r1, 1>>
// Registered before the target: still follows it.
const r2 = await vigor.retry().middlewares(m => m.onResult("fluent", wrap)).target(async () => "x" as const).request()
export type R2 = Expect<Equal<typeof r2, { value: "x" }>>
const pr1 = await vigor.parse(new Response()).cast<Env<User>>().middlewares(m => m.onResult("fluent", unwrap)).request()
export type Pr1 = Expect<Equal<typeof pr1, User>>
const a1 = await vigor.all(() => 1 as const).middlewares(m => m.onResult("fluent", count)).request()
export type A1 = Expect<Equal<typeof a1, number>>
