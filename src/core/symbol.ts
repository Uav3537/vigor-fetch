export type VigorBrand<
    Branch extends string,
    Name extends string
> = string & {
    __brand: `@vigor-fetch:::${Branch} <- ${Name}`
}

/**
 * Builds the literal brand string used by {@link VigorBrand}, preserving the
 * `Branch`/`Name` literal types for use as a `__brand` value.
 */
export function createBrand<
    const Branch extends string,
    const Name extends string
>(
    b: Branch,
    n: Name
) {
    return `@vigor-fetch:::${b} <- ${n}` as VigorBrand<Branch, Name>
}

export const VigorDefault = Symbol("VigorDefault") as symbol & {
    __brand: VigorBrand<"Core", "Symbol_Default">
}

export type VigorDefaultType = typeof VigorDefault

export type VigorExcludeDefault<T> = Exclude<T, VigorDefaultType>

/** Type guard checking whether a value is the {@link VigorDefault} sentinel. */
export const isVigorDefault = (v: any): v is VigorDefaultType => v === VigorDefault;




export const VigorEmpty = Symbol("VigorEmpty") as symbol & {
    __brand: VigorBrand<"Core", "Symbol_Empty">
}

export type VigorEmptyType = typeof VigorEmpty

export type VigorExcludeEmpty<T> = Exclude<T, VigorEmptyType>

/** Type guard checking whether a value is the {@link VigorEmpty} sentinel. */
export const isVigorEmpty = (v: any): v is VigorEmptyType => v === VigorEmpty;
