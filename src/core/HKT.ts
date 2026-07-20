export interface VigorTypeLambda {
    readonly In?: unknown
    readonly Target: unknown
}

export type VigorApply<F extends VigorTypeLambda, In> = F extends {
    readonly Target: unknown
}
    ? (F & { readonly In: In })["Target"]
    : never
