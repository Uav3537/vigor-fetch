/**
 * Type tests for `.apiMap<M>({ strict: true })`: a request that matches no
 * route doesn't compile. Run with `npm run test:types`.
 */
import vigor from "../src/index"

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
type Expect<T extends true> = T

type User = { id: number, name: string }
type Api = {
    "/users": { GET: { response: User[] } }
    "/users/:id": { GET: { response: User } }
    "/users/:id/profile": { GET: { response: { bio: string } } }
}

declare const segments: string[]
declare const kind: "users" | "nope"

const strict = vigor.fetch("https://api.example.com").apiMap<Api>({ strict: true })
const loose = vigor.fetch("https://api.example.com").apiMap<Api>()
const looseExplicit = vigor.fetch("https://api.example.com").apiMap<Api>({ strict: false })

// Matching requests work the same.
const s1 = await strict.path("append", "users").request()
export type S1 = Expect<Equal<typeof s1, User[]>>
const s2 = await strict.route("GET /users/:id/profile", { id: 1 }).request()
export type S2 = Expect<Equal<typeof s2, { bio: string }>>
const s3 = await strict.path("append", "users", 5).requestVerbose()
if (s3.success) {
    const d: User = s3.data
}

// @ts-expect-error  no route for this path
await strict.path("append", "posts").request()

// @ts-expect-error  no route for this method
await strict.method("DELETE").path("append", "users").request()

// @ts-expect-error  a dynamic path can't be matched
await strict.path("append", ...segments).request()

// @ts-expect-error  one member of a union path matches no route
await strict.path("append", kind).request()

// @ts-expect-error  requestVerbose() too
await strict.path("append", "posts").requestVerbose()

// `.cast<T>()` opts a request out.
const c1 = await strict.path("append", ...segments).cast<{ ok: true }>().request()
export type C1 = Expect<Equal<typeof c1, { ok: true }>>

// Not strict: the same requests still compile.
const l1 = await loose.path("append", ...segments).request()
export type L1 = Expect<Equal<typeof l1, unknown>>
await looseExplicit.path("append", "posts").request()

// A base path set before `.apiMap()` still counts.
const v1 = vigor.fetch("https://api.example.com").path("append", "v1").apiMap<Api>({ strict: true })
const b1 = await v1.path("append", "users").request()
export type B1 = Expect<Equal<typeof b1, User[]>>
// @ts-expect-error  the base isn't part of the routes
await v1.path("append", "v1", "users").request()
