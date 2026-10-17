import type { VigorTimeline, VigorTimelineEndEvents, VigorTimelineMiddlewareEvents, VigorTimelineProcessEvents, VigorTimelineSnapshot } from "@core/timeline"
import type { VigorAllContextSchema, VigorAllEachContextSchema } from "./context"
import type { VigorAllPolicyMiddlewaresIntercept, VigorAllPolicyMiddlewaresSchema } from "./middlewares"

type VigorAllTimelineStages = Omit<VigorAllPolicyMiddlewaresSchema<any>, "__brand">

type VigorAllTimelineApis = {
    [S in "before" | "after" | "onResult"]: Parameters<VigorAllPolicyMiddlewaresIntercept<any>[S]["func"]>[1]
} & {
    beforeEach: {}
    afterEach: {}
    onErrorEach: { setResult: (r: unknown) => void }
}

/** Lifecycle steps recorded as `PROCESS_HANDLING`, mapped to their `data`. */
export type VigorAllProcessHandler = {
    REQUEST_START: { tasks: number, concurrency: number }
    /** The batch failed. */
    REQUEST_ERROR: { error: unknown }
}

/** Every action an all timeline can record, mapped to its content. */
export type VigorAllTimelineEvents =
    VigorTimelineProcessEvents<VigorAllProcessHandler> &
    VigorTimelineMiddlewareEvents<VigorAllTimelineStages, VigorAllTimelineApis> &
    VigorTimelineEndEvents & {
    TASK_STARTED: { index: number }
    /** A task settled. `success` is `false` only when it failed and `onErrorEach` didn't recover it. */
    TASK_ENDED: { index: number, success: boolean, took: number }
    /** A task threw (including `TIMED_OUT`), before `onErrorEach` runs. */
    TASK_ERROR: { index: number, error: unknown }
}

/**
 * A context as stored on a timeline entry: the batch context, or for the
 * per-task actions (`TASK_*` and the `*Each` stages) that task's context.
 */
export type VigorAllTimelineSnapshot =
    | VigorTimelineSnapshot<VigorAllContextSchema<any>>
    | VigorAllEachContextSchema<any>

export type VigorAllTimeline = VigorTimeline<VigorAllTimelineEvents, VigorAllTimelineSnapshot>
