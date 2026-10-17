import type { VigorTimeline, VigorTimelineEndEvents, VigorTimelineMiddlewareEvents, VigorTimelineProcessEvents, VigorTimelineSnapshot } from "@core/timeline"
import type { VigorParseContextSchema } from "./context"
import type { VigorParsePolicyMiddlewaresIntercept, VigorParsePolicyMiddlewaresSchema } from "./middlewares"

type VigorParseTimelineStages = Omit<VigorParsePolicyMiddlewaresSchema<any>, "__brand">

type VigorParseTimelineApis = {
    [S in keyof VigorParseTimelineStages]: Parameters<VigorParsePolicyMiddlewaresIntercept<any>[S]["func"]>[1]
}

/** Lifecycle steps recorded as `PROCESS_HANDLING`, mapped to their `data`. */
export type VigorParseProcessHandler = {
    /** A run started. `restartAttempt` is `1` for the first run, and increases on every restart. */
    REQUEST_START: { restartAttempt: number }
    /** The run failed, before `onError` runs. */
    REQUEST_ERROR: { error: unknown }
    /** `onError` asked for a restart; the next run's entries follow. */
    REQUEST_RESTART: { restartAttempt: number }
}

/** Every action a parse timeline can record, mapped to its content. */
export type VigorParseTimelineEvents =
    VigorTimelineProcessEvents<VigorParseProcessHandler> &
    VigorTimelineMiddlewareEvents<VigorParseTimelineStages, VigorParseTimelineApis> &
    VigorTimelineEndEvents & {
    /** The body was read into bytes (or reused from the cache). */
    BODY_READ: { size: number, took: number }
    STRATEGY_STARTED: { index: number }
    STRATEGY_SUCCEEDED: { index: number, took: number }
    STRATEGY_FAILED: { index: number, error: unknown, took: number }
}

/** A parse context as stored on a timeline entry. */
export type VigorParseTimelineSnapshot = VigorTimelineSnapshot<VigorParseContextSchema<any>>

export type VigorParseTimeline = VigorTimeline<VigorParseTimelineEvents, VigorParseTimelineSnapshot>
