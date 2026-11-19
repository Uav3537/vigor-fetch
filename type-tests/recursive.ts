/**
 * Type tests for self-referencing (recursive) request types, like zod's
 * `z.json()`. These must neither hit TS2589 ("excessively deep") nor lose
 * the request checks. Run with `npm run test:types`.
 */
import vigor from "../src/index"

type Equal<X, Y> = (<T>() => T extends X ? 1 : 2) extends (<T>() => T extends Y ? 1 : 2) ? true : false
type Expect<T extends true> = T

type Json = string | number | boolean | null | Json[] | { [key: string]: Json }
type JsonObject = { [key: string]: Json }

/** A recursive type of its own, not assignable to `Json` as-is (it allows `undefined`). */
type Loose = string | number | undefined | Loose[] | { [key: string]: Loose }

type Tree = { name: string, children: readonly Tree[] }

type Settings = { theme: "dark" | "light" }

type Api = {
    "/oauth/settings": {
        PATCH: { request: { body: JsonObject }, response: "patched" }
        // Overloads with a recursive body: the possible-match check runs too.
        PUT: [
            { request: { body: { kind: "tree", tree: Tree } }, response: "tree" },
            { request: { body: { kind: "json", value: Json } }, response: "json" },
        ]
    }
    "/oauth/search": {
        GET: [
            { request: { query: { q: string } }, response: "q" },
            { request: { query: { page: number } }, response: "page" },
        ]
    }
    "/settings": {
        POST: [
            { request: { body: Settings }, response: "settings" },
            { request: { body: JsonObject }, response: "json" },
        ]
    }
}

declare const json: JsonObject
declare const loose: { [key: string]: Loose }
declare const tree: Tree

const api = vigor.fetch("https://api.example.com").apiMap<Api>()

const r1 = await api.route("PATCH /oauth/settings").body("replace", json).request()
export type R1 = Expect<Equal<typeof r1, "patched">>

// A `const`-inferred (readonly) literal still matches the recursive body.
const r2 = await api.route("PATCH /oauth/settings").body("replace", { a: [1, { b: ["x", null] }] }).request()
export type R2 = Expect<Equal<typeof r2, "patched">>

const r3 = await api.route("PUT /oauth/settings").body("replace", { kind: "tree", tree }).request()
export type R3 = Expect<Equal<typeof r3, "tree">>

const r4 = await api.route("PUT /oauth/settings").body("replace", { kind: "json", value: json }).request()
export type R4 = Expect<Equal<typeof r4, "json">>

// A `const` literal tree: readonly all the way down.
const r5 = await api.route("PUT /oauth/settings").body("replace", { kind: "tree", tree: { name: "a", children: [{ name: "b", children: [] }] } }).request()
export type R5 = Expect<Equal<typeof r5, "tree">>

const r6 = await api.route("POST /settings").body("replace", json).request()
export type R6 = Expect<Equal<typeof r6, "json">>

const r7 = await api.route("GET /oauth/search").query("append", { q: "a" }).request()
export type R7 = Expect<Equal<typeof r7, "q">>

// A mismatching recursive body is still reported, not TS2589.
// @ts-expect-error  `Loose` allows `undefined`, `Json` doesn't
await api.route("PATCH /oauth/settings").body("replace", loose).request()

// @ts-expect-error  matches neither overload
await api.route("PUT /oauth/settings").body("replace", { kind: "nope", tree }).request()
