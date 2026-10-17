import { createBrand, VigorBrand } from "@core/symbol"
import { VigorParseBase, VigorParseSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorParsePolicyStrategiesTypeLambda } from "./TL"
import { VigorParseError } from "./error"
import { VigorDeepMerge } from "@core/types"

/**
 * A request|response body, read exactly once into raw bytes, plus the
 * metadata strategies need to interpret it. Every strategy in a chain gets
 * the same bytes, so a failed strategy never consumes anything.
 */
export type VigorParseBody = {
    /** The raw body. Empty when there is no body. */
    bytes: Uint8Array<ArrayBuffer>
    /** The `Content-Type` header, or `null` when absent. */
    contentType: string | null
    /** The response status, or `null` when parsing a `Request`. */
    status: number | null
    headers: Headers
    /** The request|response the bytes were read from. Its body is already consumed. */
    source: Request | Response
}

export type VigorParseStrategyFunc = (body: VigorParseBody) => any | Promise<any>

export type VigorParsePolicyStrategiesSchema<
    T extends VigorParseSchema<T>
> = {
    __brand: VigorBrand<"Parse", "Policy<Strategies<Schema">

    funcs: Array<VigorParseStrategyFunc>
}

export const VigorParsePolicyStrategiesBase = {
    __brand: createBrand("Parse", "Policy<Strategies<Schema"),

    funcs: [] as VigorParseStrategyFunc[]
} as const satisfies VigorParsePolicyStrategiesSchema<any>

/** Bytes already read per request|response, so reading the same one again (a restart, a re-parse) never touches the stream. */
const bodyCache = new WeakMap<Request | Response, Promise<Uint8Array<ArrayBuffer>>>()

/**
 * Reads a request|response body into raw bytes — once. Later calls with the
 * same object return the cached bytes instead of reading the (now consumed)
 * stream again.
 */
export async function readVigorParseBody(source: Request | Response): Promise<VigorParseBody> {
    let bytes = bodyCache.get(source)
    if (!bytes) {
        bytes = source.body === null
            ? Promise.resolve(new Uint8Array(0))
            : source.arrayBuffer().then(buf => new Uint8Array(buf))
        bodyCache.set(source, bytes)
    }
    return {
        bytes: await bytes,
        contentType: source.headers.get("content-type"),
        status: source instanceof Response ? source.status : null,
        headers: source.headers,
        source
    }
}

const utf8 = new TextDecoder("utf-8")

/** The `charset` parameter of a `Content-Type` header, or `utf-8`. */
const getCharset = (contentType: string | null): string =>
    /;\s*charset\s*=\s*"?([^";\s]+)"?/i.exec(contentType ?? "")?.[1] ?? "utf-8"

/** The MIME type of a `Content-Type` header, without parameters, lowercased. */
const getMimeType = (contentType: string | null): string =>
    (contentType ?? "").split(";")[0].trim().toLowerCase()

/**
 * Decodes the body as text in its declared `charset` (`utf-8` when absent
 * or unsupported). With `fatal`, invalid byte sequences throw instead of
 * becoming U+FFFD. A leading BOM is dropped.
 */
const decodeText = (body: VigorParseBody, fatal = false): string => {
    let decoder: TextDecoder
    try {
        decoder = new TextDecoder(getCharset(body.contentType), { fatal })
    } catch {
        decoder = new TextDecoder("utf-8", { fatal })
    }
    return decoder.decode(body.bytes)
}

/** Parses the body as JSON. JSON is always UTF-8, whatever `charset` says. */
const parseJson = (body: VigorParseBody): unknown => JSON.parse(utf8.decode(body.bytes))

/** Like {@link parseJson}, but an empty (or whitespace-only) body is `null` instead of a syntax error. */
const parseJsonOrNull = (body: VigorParseBody): unknown => {
    const text = utf8.decode(body.bytes)
    return text.trim() === "" ? null : JSON.parse(text)
}

/** Value of an ASCII hex digit byte, or `-1`. */
const hexValue = (b: number): number => {
    if (b >= 0x30 && b <= 0x39) return b - 0x30
    if (b >= 0x41 && b <= 0x46) return b - 0x41 + 10
    if (b >= 0x61 && b <= 0x66) return b - 0x61 + 10
    return -1
}

/**
 * Decodes one `application/x-www-form-urlencoded` name or value: `+` becomes
 * a space, then `%XX` escapes become bytes, then the bytes are read as
 * UTF-8. A `%` not followed by two hex digits is kept as-is, like browsers do.
 */
const decodeFormComponent = (input: Uint8Array): string => {
    const out = new Uint8Array(input.length)
    let n = 0
    for (let i = 0; i < input.length; i++) {
        const b = input[i]
        if (b === 0x2B) {                                        // "+"
            out[n++] = 0x20
            continue
        }
        if (b === 0x25 && i + 2 < input.length) {                // "%XX"
            const hi = hexValue(input[i + 1])
            const lo = hexValue(input[i + 2])
            if (hi >= 0 && lo >= 0) {
                out[n++] = hi * 16 + lo
                i += 2
                continue
            }
        }
        out[n++] = b
    }
    return utf8.decode(out.subarray(0, n))
}

/** Parses an `application/x-www-form-urlencoded` body into `FormData`, directly from its bytes. */
const parseUrlEncoded = (body: VigorParseBody): FormData => {
    const form = new FormData()
    const { bytes } = body
    let start = 0
    for (let i = 0; i <= bytes.length; i++) {
        if (i < bytes.length && bytes[i] !== 0x26) continue      // split on "&"
        const pair = bytes.subarray(start, i)
        start = i + 1
        if (pair.length === 0) continue
        const eq = pair.indexOf(0x3D)                            // first "="
        const name = eq === -1 ? pair : pair.subarray(0, eq)
        const value = eq === -1 ? new Uint8Array(0) : pair.subarray(eq + 1)
        form.append(decodeFormComponent(name), decodeFormComponent(value))
    }
    return form
}

/**
 * Parses a `multipart/form-data` body. This is the one format not parsed by
 * hand: boundaries, per-part headers, and file parts are left to the
 * platform's `formData()`, fed from the bytes already read.
 */
const parseMultipart = (body: VigorParseBody): Promise<FormData> =>
    new Response(body.bytes, { headers: { "content-type": body.contentType ?? "" } }).formData()

/** Parses a form body (`x-www-form-urlencoded` or `multipart/form-data`) into `FormData`. */
const parseFormData = (body: VigorParseBody): FormData | Promise<FormData> => {
    const mime = getMimeType(body.contentType)
    if (mime === "application/x-www-form-urlencoded") return parseUrlEncoded(body)
    if (mime === "multipart/form-data") return parseMultipart(body)
    throw new VigorParseError("INVALID_CONTENT_TYPE", {
        method: "parseFormData",
        data: { received: body.contentType }
    })
}

/** A copy of the bytes as a standalone `ArrayBuffer`, so the result never aliases the cached body. */
const toArrayBuffer = (body: VigorParseBody): ArrayBuffer => body.bytes.slice().buffer

const toBlob = (body: VigorParseBody): Blob => new Blob([body.bytes], { type: body.contentType ?? "" })

/** Status codes whose responses never carry a body. */
const NoBodyStatus = [204, 205, 304]

const ContentTypeParsers: { header: string, regExp: RegExp, method: VigorParseStrategyFunc }[] = [
    { header: "application/json", regExp: /application\/(.+\+)?json(.+\+)?/i, method: parseJsonOrNull },
    { header: "application/xml", regExp: /application\/(.+\+)?xml(.+\+)?/i, method: (body) => decodeText(body) },
    { header: "application/x-www-form-urlencoded", regExp: /application\/(.+\+)?x-www-form-urlencoded(.+\+)?/i, method: parseUrlEncoded },
    { header: "application/octet-stream", regExp: /application\/(.+\+)?octet-stream(.+\+)?/i, method: toArrayBuffer },

    { header: "image/*", regExp: /^image\/.+/i, method: toBlob },
    { header: "audio/*", regExp: /^audio\/.+/i, method: toBlob },
    { header: "video/*", regExp: /^video\/.+/i, method: toBlob },

    { header: "multipart/form-data", regExp: /multipart\/(.+\+)?form-data(.+\+)?/i, method: parseMultipart },

    { header: "text/*", regExp: /^text\/.+/i, method: (body) => decodeText(body) },
]

const SniffMethods: { title: string, method: VigorParseStrategyFunc }[] = [
    { title: "json", method: parseJson },
    { title: "formData", method: parseFormData },
    { title: "text", method: (body) => decodeText(body, true) },
    { title: "blob", method: toBlob },
]

/**
 * Parses a body by matching its `Content-Type` header against a known
 * parser table. An empty body (e.g. `204 No Content`) resolves to `null`,
 * one without a `Content-Type` is read as text, and one with a type the
 * table doesn't know (`application/pdf`, `application/zip`,
 * `application/x-ndjson`, ...) becomes a `Blob` carrying that type, rather
 * than failing a response that arrived fine.
 */
export const VigorParseContentTypeStrategy: VigorParseStrategyFunc = async (body) => {
    if (body.bytes.length === 0 || (body.status !== null && NoBodyStatus.includes(body.status))) return null

    if (!body.contentType) return decodeText(body)

    const toDo = ContentTypeParsers.find(parser => parser.regExp.test(body.contentType!))
    if (!toDo) return toBlob(body)
    return await toDo.method(body)
}

/**
 * Parses a body by trying JSON, then form data (for a form `Content-Type`),
 * then text (only if the bytes are valid in the declared charset), then
 * falling back to a `Blob`.
 */
export const VigorParseSniffStrategy: VigorParseStrategyFunc = async (body) => {
    const errors: unknown[] = []
    for (const parser of SniffMethods) {
        try {
            return await parser.method(body)
        } catch (error) {
            errors.push(error)
        }
    }
    throw new VigorParseError("PARSER_ALL_FAILED", {
        method: "VigorParseSniffStrategy",
        cause: errors.at(-1),
        data: { tried: SniffMethods.map(p => p.title), errors }
    })
}

/**
 * What adding strategies yields. `funcs` is a plain array, so appending and
 * replacing (`replace: true`) give the same type.
 */
type VigorParseStrategiesNext<T> = VigorApply<VigorParsePolicyStrategiesTypeLambda, VigorDeepMerge<T, { policy: { strategies: { funcs: VigorParseStrategyFunc[] } } }>>

/** Immutable builder for a parse policy's fallback chain of parsing strategies. */
export class VigorParsePolicyStrategies<
    T extends VigorParseSchema<T> = typeof VigorParseBase
> extends VigorStatus<VigorParseSchema<any>, T, VigorParsePolicyStrategiesTypeLambda> {

    constructor(config: T = VigorParseBase as unknown as T) {
        super(VigorParseBase as VigorParseSchema<any>, config)
    }

    protected _create<C>(config: C): VigorApply<VigorParsePolicyStrategiesTypeLambda, C> {
        return new VigorParsePolicyStrategies(config as unknown as VigorParseSchema<any>) as unknown as VigorApply<VigorParsePolicyStrategiesTypeLambda, C>
    }

    /**
     * Adds strategy functions to the fallback chain.
     *
     * @param replace - When `true`, replaces the existing chain instead of
     *  appending to it (the default is to concat, since strategies are
     *  tried in sequence as a fallback chain).
     */
    private _set(funcs: VigorParseStrategyFunc[], replace?: boolean): VigorParseStrategiesNext<T> {
        return this._next(
            { policy: { strategies: { funcs } } } as const,
            replace ? { policy: { strategies: { funcs: "replace" } } } as const : undefined
        ) as VigorParseStrategiesNext<T>
    }

    /** Adds the content-type based parsing strategy. */
    public contentType(replace?: boolean): VigorParseStrategiesNext<T> { return this._set([VigorParseContentTypeStrategy], replace) }
    /** Adds the sniffing (try-each-format) parsing strategy. */
    public sniff(replace?: boolean): VigorParseStrategiesNext<T> { return this._set([VigorParseSniffStrategy], replace) }
    /** Adds a strategy that always parses the body as JSON. */
    public json(replace?: boolean): VigorParseStrategiesNext<T> { return this._set([parseJson], replace) }
    /** Adds a strategy that always parses the body as text, in its declared `charset`. */
    public text(replace?: boolean): VigorParseStrategiesNext<T> { return this._set([(body) => decodeText(body)], replace) }
    /** Adds a strategy that always parses the body as an `ArrayBuffer`. */
    public arrayBuffer(replace?: boolean): VigorParseStrategiesNext<T> { return this._set([toArrayBuffer], replace) }
    /** Adds a strategy that always parses the body as a `Blob`. */
    public blob(replace?: boolean): VigorParseStrategiesNext<T> { return this._set([toBlob], replace) }
    /** Adds a strategy that always parses the body as a `Uint8Array`. */
    public bytes(replace?: boolean): VigorParseStrategiesNext<T> { return this._set([(body) => body.bytes.slice()], replace) }
    /** Adds a strategy that always parses the body as `FormData` (`x-www-form-urlencoded` or `multipart/form-data`). */
    public formData(replace?: boolean): VigorParseStrategiesNext<T> { return this._set([parseFormData], replace) }
    /** Adds a user-supplied custom parsing strategy. It receives the body already read into bytes. */
    public custom<const N extends VigorParseStrategyFunc>(func: N, replace?: boolean): VigorParseStrategiesNext<T> { return this._set([func], replace) }
}
