import { createBrand, VigorBrand } from "@core/symbol"
import { VigorParseBase, VigorParseSchema } from "./main"
import { VigorStatus } from "@core/status"
import { VigorApply } from "@core/HKT"
import { VigorParsePolicyStrategiesTypeLambda } from "./TL"
import { VigorParseError } from "./error"

export type VigorParseStrategyFunc = (response: Response) => Promise<any>

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

/** Reads the body as JSON, treating an empty body as `null` instead of a syntax error. */
const parseJsonOrNull = async (res: Response) => {
    const text = await res.text()
    return text.trim() === "" ? null : JSON.parse(text)
}

/** Status codes whose responses never carry a body. */
const NoBodyStatus = [204, 205, 304]

const ContentTypeParsers = [
    { header: "application/json", regExp: /application\/(.+\+)?json(.+\+)?/i, method: parseJsonOrNull },
    { header: "application/xml", regExp: /application\/(.+\+)?xml(.+\+)?/i, method: (res: Response) => res.text() },
    { header: "application/x-www-form-urlencoded", regExp: /application\/(.+\+)?x-www-form-urlencoded(.+\+)?/i, method: (res: Response) => res.formData() },
    { header: "application/octet-stream", regExp: /application\/(.+\+)?octet-stream(.+\+)?/i, method: (res: Response) => res.arrayBuffer() },

    { header: "image/*", regExp: /^image\/.+/i, method: (res: Response) => res.blob() },
    { header: "audio/*", regExp: /^audio\/.+/i, method: (res: Response) => res.blob() },
    { header: "video/*", regExp: /^video\/.+/i, method: (res: Response) => res.blob() },

    { header: "multipart/form-data", regExp: /multipart\/(.+\+)?form-data(.+\+)?/i, method: (res: Response) => res.formData() },

    { header: "text/*", regExp: /^text\/.+/i, method: (res: Response) => res.text() },
]

const SniffMethods = [
    { title: "json", method: (res: Response) => res.json() },
    { title: "formData", method: (res: Response) => res.formData() },
    { title: "text", method: (res: Response) => res.text() },
    { title: "blob", method: (res: Response) => res.blob() },
]

/**
 * Parses a response by matching its `Content-Type` header against a known
 * parser table. A response without a body (e.g. `204 No Content`) resolves to
 * `null`, and one without a `Content-Type` is read as text (`null` if empty).
 */
export const VigorParseContentTypeStrategy: VigorParseStrategyFunc = async (response) => {
    if (response.body === null || NoBodyStatus.includes(response.status)) return null

    const contentTypeHeader = response.headers.get("content-type")
    if (!contentTypeHeader) {
        const text = await response.text()
        return text === "" ? null : text
    }

    const toDo = ContentTypeParsers.find(parser => parser.regExp.test(contentTypeHeader))
    if (!toDo) throw new VigorParseError("PARSER_NOT_FOUND", {
        method: "VigorParseContentTypeStrategy",
        data: {
            expected: ContentTypeParsers.map(p => p.header),
            received: contentTypeHeader
        }
    })
    return await toDo.method(response)
}

/** Parses a response by trying a sequence of body-reading methods until one succeeds. */
export const VigorParseSniffStrategy: VigorParseStrategyFunc = async (response) => {
    for (const [i, parser] of SniffMethods.entries()) {
        const cloned = (i === SniffMethods.length - 1) ? response : response.clone()
        try {
            return await parser.method(cloned)
        } catch { }
    }
    throw new VigorParseError("PARSER_ALL_FAILED", {
        method: "VigorParseSniffStrategy",
        data: { tried: SniffMethods.map(p => p.title) }
    })
}

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
    private _set(funcs: VigorParseStrategyFunc[], replace?: boolean) {
        return this._next(
            { policy: { strategies: { funcs } } } as const,
            replace ? { policy: { strategies: { funcs: "replace" } } } : undefined
        )
    }

    /** Adds the content-type based parsing strategy. */
    public contentType(replace?: boolean) { return this._set([VigorParseContentTypeStrategy], replace) }
    /** Adds the sniffing (try-each-method) parsing strategy. */
    public sniff(replace?: boolean) { return this._set([VigorParseSniffStrategy], replace) }
    /** Adds a strategy that always parses the response as JSON. */
    public json(replace?: boolean) { return this._set([(res) => res.json()], replace) }
    /** Adds a strategy that always parses the response as text. */
    public text(replace?: boolean) { return this._set([(res) => res.text()], replace) }
    /** Adds a strategy that always parses the response as an `ArrayBuffer`. */
    public arrayBuffer(replace?: boolean) { return this._set([(res) => res.arrayBuffer()], replace) }
    /** Adds a strategy that always parses the response as a `Blob`. */
    public blob(replace?: boolean) { return this._set([(res) => res.blob()], replace) }
    /** Adds a strategy that always parses the response as a `Uint8Array`. */
    public bytes(replace?: boolean) { return this._set([(res) => res.arrayBuffer().then(b => new Uint8Array(b))], replace) }
    /** Adds a strategy that always parses the response as `FormData`. */
    public formData(replace?: boolean) { return this._set([(res) => res.formData()], replace) }
    /** Adds a user-supplied custom parsing strategy. */
    public custom<const N extends VigorParseStrategyFunc>(func: N, replace?: boolean) { return this._set([func], replace) }
}
