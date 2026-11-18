import type { VigorFetchContextSchema } from "./context"
import { VigorFetchError } from "./error"

/**
 * Serializers turn what the builder stores (`path`, `query`, `hash`,
 * `headers`, `body`) into what is sent. Each stage is an ordered list of
 * named steps, run in order; nothing happens outside them. A stage you set
 * replaces that stage's whole list, so the list you write is exactly what
 * runs. Stages you don't set keep `VigorFetchSerializersBase`.
 *
 * | Stage     | Input → output                                      | Default steps |
 * |-----------|-----------------------------------------------------|---------------|
 * | `path`    | `.path()` values → string segments                  | `dropNullish`, `stringify`, `split("/")`, `encode`, `prefixOrigin` |
 * | `query`   | `.query()` entries → `[string, string]` entries     | `fromOrigin`, `dropNullish`, `arrays("repeat")`, `stringify` |
 * | `url`     | the assembled `URL` → the `URL` sent                | `hashFromOrigin`, `confine` |
 * | `body`    | `.body()` value → `BodyInit` + content type          | `text`, `blob`, `binary`, `stream`, `urlencoded`, `formData`, `json` (first match wins) |
 * | `headers` | `.headers()` object → the headers sent              | `caseInsensitive`, `contentType` |
 */

/** What every step gets besides its input. */
export type VigorSerializeInfo = {
    /** The origin, resolved against the page in a browser. */
    origin: URL
    context: VigorFetchContextSchema<any>
}

/** A named step. The name shows in the timeline and in errors. */
export type VigorSerializerStep<F> = {
    readonly name: string
    readonly func: F
}

export type VigorQueryEntry = [key: string, value: unknown]

export type VigorPathStepFunc = (segments: unknown[], info: VigorSerializeInfo) => unknown[]
export type VigorQueryStepFunc = (entries: VigorQueryEntry[], info: VigorSerializeInfo) => VigorQueryEntry[]
export type VigorUrlStepFunc = (url: URL, info: VigorSerializeInfo) => URL | void
/** Returns `undefined` when it doesn't handle `body`; the next step is tried. */
export type VigorBodyStepFunc = (body: unknown, info: VigorSerializeInfo) => VigorSerializedBody | undefined
export type VigorHeadersStepFunc = (headers: Record<string, string>, info: VigorSerializeInfo & { contentType: string | null }) => Record<string, string>

export type VigorSerializedBody = {
    body: BodyInit
    /** The `Content-Type` this body implies, or `null` to leave it to `fetch`. */
    contentType: string | null
}

export type VigorFetchSerializersSchema = {
    path: VigorSerializerStep<VigorPathStepFunc>[]
    query: VigorSerializerStep<VigorQueryStepFunc>[]
    url: VigorSerializerStep<VigorUrlStepFunc>[]
    body: VigorSerializerStep<VigorBodyStepFunc>[]
    headers: VigorSerializerStep<VigorHeadersStepFunc>[]
}

export type VigorFetchSerializerStage = keyof VigorFetchSerializersSchema

const step = <F>(name: string, func: F): VigorSerializerStep<F> => ({ name, func })

/** `Date` → ISO string, anything else → `String(value)`. */
export const vigorStringifyValue = (value: unknown): string =>
    value instanceof Date ? value.toISOString() : String(value)

const isNullish = (value: unknown) => value === null || value === undefined

/** Path steps. Each returns a step; chain them on `VigorPathSerializer`. */
export const VigorPathSteps = {
    /** Drops `null`/`undefined` segments. */
    dropNullish: () => step<VigorPathStepFunc>("dropNullish", segments => segments.filter(s => !isNullish(s))),
    /** `Date` → ISO string, anything else → `String()`. */
    stringify: () => step<VigorPathStepFunc>("stringify", segments => segments.map(vigorStringifyValue)),
    /** Splits each string segment on `separator`, so `"v1/users"` becomes two levels. Empty parts are dropped. */
    split: (separator = "/") => step<VigorPathStepFunc>(`split(${JSON.stringify(separator)})`, segments =>
        segments.flatMap(s => typeof s === "string" ? s.split(separator).filter(Boolean) : [s])),
    /** Percent-encodes each string segment (`encodeURIComponent`), so no segment can reach the query or fragment. */
    encode: () => step<VigorPathStepFunc>("encode", segments =>
        segments.map(s => typeof s === "string" ? encodeURIComponent(s) : s)),
    /** Puts the origin's own path (`https://a.com/api/v1` → `api`, `v1`) in front. */
    prefixOrigin: () => step<VigorPathStepFunc>("prefixOrigin", (segments, { origin }) =>
        [...origin.pathname.split("/").filter(Boolean), ...segments]),
} as const

/** How `arrays()` writes an array value. */
export type VigorQueryArrayFormat = "repeat" | "comma" | "brackets"

/** Query steps. */
export const VigorQuerySteps = {
    /** Puts the origin's own query (`https://a.com/?v=2`) in front. */
    fromOrigin: () => step<VigorQueryStepFunc>("fromOrigin", (entries, { origin }) =>
        [...origin.searchParams.entries(), ...entries]),
    /** Drops entries whose value is `null`/`undefined`. */
    dropNullish: () => step<VigorQueryStepFunc>("dropNullish", entries => entries.filter(([, v]) => !isNullish(v))),
    /**
     * Writes array values: `"repeat"` → `a=1&a=2`, `"comma"` → `a=1,2`,
     * `"brackets"` → `a[]=1&a[]=2`. Elements are stringified like `stringify`.
     */
    arrays: (format: VigorQueryArrayFormat = "repeat") => step<VigorQueryStepFunc>(`arrays(${JSON.stringify(format)})`, entries =>
        entries.flatMap(([key, value]): VigorQueryEntry[] => {
            if (!Array.isArray(value)) return [[key, value]]
            if (format === "comma") return [[key, value.map(vigorStringifyValue).join(",")]]
            const name = format === "brackets" ? `${key}[]` : key
            return value.map(v => [name, vigorStringifyValue(v)])
        })),
    /** `Date` → ISO string, anything else → `String()`. */
    stringify: () => step<VigorQueryStepFunc>("stringify", entries => entries.map(([k, v]) => [k, vigorStringifyValue(v)])),
} as const

/** URL steps. */
export const VigorUrlSteps = {
    /** Uses the origin's fragment when `.hash()` set none. */
    hashFromOrigin: () => step<VigorUrlStepFunc>("hashFromOrigin", (url, { origin }) => {
        if (!url.hash) url.hash = origin.hash
    }),
    /**
     * Fails with `PATH_ESCAPED` when the URL leaves the origin: another
     * domain, or outside the origin's path (`/api/v1` allows `/api/v1/...`,
     * not `/api/v1x` or anything a `..` climbs to).
     */
    confine: () => step<VigorUrlStepFunc>("confine", (url, { origin, context }) => {
        const basePath = "/" + origin.pathname.replace(/^\/+|\/+$/g, "")
        const inside = basePath === "/" || url.pathname === basePath || url.pathname.startsWith(basePath + "/")
        if (url.origin !== origin.origin || !inside) throw new VigorFetchError("PATH_ESCAPED", {
            method: "serialize",
            data: { url: url.href, base: origin.origin + (basePath === "/" ? "" : basePath) },
            context
        })
    }),
} as const

/** Body steps. The first one that returns a value wins. */
export const VigorBodySteps = {
    /** `string` → `text/plain;charset=UTF-8` */
    text: () => step<VigorBodyStepFunc>("text", body =>
        typeof body === "string" ? { body, contentType: "text/plain;charset=UTF-8" } : undefined),
    /** `Blob` → its own `type` */
    blob: () => step<VigorBodyStepFunc>("blob", body =>
        body instanceof Blob ? { body, contentType: body.type || null } : undefined),
    /** `ArrayBuffer`, typed arrays, `DataView` → `application/octet-stream` */
    binary: () => step<VigorBodyStepFunc>("binary", body =>
        body instanceof ArrayBuffer || ArrayBuffer.isView(body) ? { body: body as BodyInit, contentType: "application/octet-stream" } : undefined),
    /** `ReadableStream` → `application/octet-stream` */
    stream: () => step<VigorBodyStepFunc>("stream", body =>
        typeof ReadableStream !== "undefined" && body instanceof ReadableStream ? { body, contentType: "application/octet-stream" } : undefined),
    /** `URLSearchParams` → `application/x-www-form-urlencoded;charset=UTF-8` */
    urlencoded: () => step<VigorBodyStepFunc>("urlencoded", body =>
        body instanceof URLSearchParams ? { body, contentType: "application/x-www-form-urlencoded;charset=UTF-8" } : undefined),
    /** `FormData` → no content type, so `fetch` sets the multipart boundary */
    formData: () => step<VigorBodyStepFunc>("formData", body =>
        body instanceof FormData ? { body, contentType: null } : undefined),
    /** Any other object → `JSON.stringify`, `application/json` */
    json: () => step<VigorBodyStepFunc>("json", body =>
        typeof body === "object" && body !== null ? { body: JSON.stringify(body), contentType: "application/json" } : undefined),
} as const

/** Headers steps. */
export const VigorHeadersSteps = {
    /** Keeps one key per header name regardless of case; the later one wins. */
    caseInsensitive: () => step<VigorHeadersStepFunc>("caseInsensitive", headers => {
        const out: Record<string, string> = {}
        for (const [key, value] of Object.entries(headers)) {
            for (const existing of Object.keys(out)) if (existing.toLowerCase() === key.toLowerCase()) delete out[existing]
            out[key] = value
        }
        return out
    }),
    /** Adds the body's content type as `Content-Type`, unless one is already set (in any case). */
    contentType: () => step<VigorHeadersStepFunc>("contentType", (headers, { contentType }) => {
        if (!contentType || Object.keys(headers).some(k => k.toLowerCase() === "content-type")) return headers
        return { ...headers, "Content-Type": contentType }
    }),
} as const

/** An immutable, ordered list of steps for one stage. */
abstract class VigorSerializerChain<F, Self> {
    constructor(public readonly steps: readonly VigorSerializerStep<F>[] = []) {}
    protected abstract _create(steps: readonly VigorSerializerStep<F>[]): Self
    protected _add(s: VigorSerializerStep<F>): Self { return this._create([...this.steps, s]) }
    /** Adds your own step. */
    public custom(name: string, func: F): Self { return this._add(step(name, func)) }
}

export class VigorPathSerializer extends VigorSerializerChain<VigorPathStepFunc, VigorPathSerializer> {
    protected _create(steps: readonly VigorSerializerStep<VigorPathStepFunc>[]) { return new VigorPathSerializer(steps) }
    public dropNullish() { return this._add(VigorPathSteps.dropNullish()) }
    public stringify() { return this._add(VigorPathSteps.stringify()) }
    public split(separator?: string) { return this._add(VigorPathSteps.split(separator)) }
    public encode() { return this._add(VigorPathSteps.encode()) }
    public prefixOrigin() { return this._add(VigorPathSteps.prefixOrigin()) }
}

export class VigorQuerySerializer extends VigorSerializerChain<VigorQueryStepFunc, VigorQuerySerializer> {
    protected _create(steps: readonly VigorSerializerStep<VigorQueryStepFunc>[]) { return new VigorQuerySerializer(steps) }
    public fromOrigin() { return this._add(VigorQuerySteps.fromOrigin()) }
    public dropNullish() { return this._add(VigorQuerySteps.dropNullish()) }
    public arrays(format?: VigorQueryArrayFormat) { return this._add(VigorQuerySteps.arrays(format)) }
    public stringify() { return this._add(VigorQuerySteps.stringify()) }
}

export class VigorUrlSerializer extends VigorSerializerChain<VigorUrlStepFunc, VigorUrlSerializer> {
    protected _create(steps: readonly VigorSerializerStep<VigorUrlStepFunc>[]) { return new VigorUrlSerializer(steps) }
    public hashFromOrigin() { return this._add(VigorUrlSteps.hashFromOrigin()) }
    public confine() { return this._add(VigorUrlSteps.confine()) }
}

export class VigorBodySerializer extends VigorSerializerChain<VigorBodyStepFunc, VigorBodySerializer> {
    protected _create(steps: readonly VigorSerializerStep<VigorBodyStepFunc>[]) { return new VigorBodySerializer(steps) }
    public text() { return this._add(VigorBodySteps.text()) }
    public blob() { return this._add(VigorBodySteps.blob()) }
    public binary() { return this._add(VigorBodySteps.binary()) }
    public stream() { return this._add(VigorBodySteps.stream()) }
    public urlencoded() { return this._add(VigorBodySteps.urlencoded()) }
    public formData() { return this._add(VigorBodySteps.formData()) }
    public json() { return this._add(VigorBodySteps.json()) }
}

export class VigorHeadersSerializer extends VigorSerializerChain<VigorHeadersStepFunc, VigorHeadersSerializer> {
    protected _create(steps: readonly VigorSerializerStep<VigorHeadersStepFunc>[]) { return new VigorHeadersSerializer(steps) }
    public caseInsensitive() { return this._add(VigorHeadersSteps.caseInsensitive()) }
    public contentType() { return this._add(VigorHeadersSteps.contentType()) }
}

/** The steps every request runs unless a stage is replaced. */
export const VigorFetchSerializersBase: VigorFetchSerializersSchema = {
    path: [...new VigorPathSerializer().dropNullish().stringify().split("/").encode().prefixOrigin().steps],
    query: [...new VigorQuerySerializer().fromOrigin().dropNullish().arrays("repeat").stringify().steps],
    url: [...new VigorUrlSerializer().hashFromOrigin().confine().steps],
    body: [...new VigorBodySerializer().text().blob().binary().stream().urlencoded().formData().json().steps],
    headers: [...new VigorHeadersSerializer().caseInsensitive().contentType().steps],
}

/**
 * Builder for `.serializers()`. Each stage method takes a callback that
 * gets an **empty** chain: the steps you add are the whole stage.
 */
export class VigorFetchPolicySerializers {
    constructor(public readonly stages: Partial<VigorFetchSerializersSchema> = {}) {}

    private _set<K extends VigorFetchSerializerStage>(stage: K, steps: readonly VigorSerializerStep<any>[]) {
        return new VigorFetchPolicySerializers({ ...this.stages, [stage]: [...steps] })
    }
    public path(build: (p: VigorPathSerializer) => VigorPathSerializer) { return this._set("path", build(new VigorPathSerializer()).steps) }
    public query(build: (q: VigorQuerySerializer) => VigorQuerySerializer) { return this._set("query", build(new VigorQuerySerializer()).steps) }
    public url(build: (u: VigorUrlSerializer) => VigorUrlSerializer) { return this._set("url", build(new VigorUrlSerializer()).steps) }
    public body(build: (b: VigorBodySerializer) => VigorBodySerializer) { return this._set("body", build(new VigorBodySerializer()).steps) }
    public headers(build: (h: VigorHeadersSerializer) => VigorHeadersSerializer) { return this._set("headers", build(new VigorHeadersSerializer()).steps) }
}
