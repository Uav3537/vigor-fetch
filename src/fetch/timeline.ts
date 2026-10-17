import type { VigorTimeline, VigorTimelineEndEvents, VigorTimelineMiddlewareEvents, VigorTimelineProcessEvents, VigorTimelineSnapshot } from "@core/timeline"
import type { VigorDefaultType } from "@core/symbol"
import type { VigorRetry } from "@retry/main"
import type { VigorRetryTimeline } from "@retry/timeline"
import type { VigorParse } from "@parse/main"
import type { VigorParseTimeline } from "@parse/timeline"
import type { VigorFetchPolicyMiddlewaresIntercept, VigorFetchPolicyMiddlewaresSchema } from "./middlewares"
import type { VigorFetchContextSchema } from "./context"

type VigorFetchTimelineStages = Omit<VigorFetchPolicyMiddlewaresSchema<any>, "__brand">

type VigorFetchTimelineApis = {
    [S in keyof VigorFetchTimelineStages]: Parameters<VigorFetchPolicyMiddlewaresIntercept<any>[S]["func"]>[1]
}

/** Lifecycle steps recorded as `PROCESS_HANDLING`, mapped to their `data`. */
export type VigorFetchProcessHandler = {
    /** A run started. `restartAttempt` is `1` for the first run, and increases on every restart. */
    REQUEST_START: { restartAttempt: number }
    /** The run failed, before `onError` runs. */
    REQUEST_ERROR: { error: unknown }
    /** `onError` asked for a restart; the next run's entries follow. */
    REQUEST_RESTART: { restartAttempt: number }
}

/**
 * Which response a parse engine ran on: `"response"` for the result, or
 * `"failedResponse"` for the best-effort parse of a failed response's body.
 */
export type VigorFetchParseSource = "response" | "failedResponse"

/** Every action a fetch timeline can record, mapped to its content. */
export type VigorFetchTimelineEvents =
    VigorTimelineProcessEvents<VigorFetchProcessHandler> &
    VigorTimelineMiddlewareEvents<VigorFetchTimelineStages, VigorFetchTimelineApis> &
    VigorTimelineEndEvents & {
    BUILT_URL: {
        url: string
    }
    /** The options actually sent, after `before` has run. */
    SET_OPTIONS: {
        options: VigorFetchContextSchema<any>["options"]
    }
    /** The engines are built. `parseEngine` has no target yet; each parse sets its own. */
    ENGINE_CREATED: {
        retryEngine: VigorRetry<any>
        parseEngine: VigorParse<any>
    }
    RETRY_STARTED: {
        engine: VigorRetry<any>
    }
    /**
     * An attempt got a response (recorded during `RETRY_STARTED`…`RETRY_ENDED`),
     * before it's judged: a failure status still fails the attempt afterwards.
     */
    RESPONSE_RECEIVED: {
        attempt: number
        status: number
        statusText: string
        ok: boolean
        redirected: boolean
        url: string
    }
    /** `timeline` is the retry engine's whole timeline. `response` is `VigorDefault` when it failed. */
    RETRY_ENDED: {
        engine: VigorRetry<any>
        timeline: VigorRetryTimeline
        took: number
        response: Response | VigorDefaultType
    }
    /** `attempt` is the attempt whose response is parsed. */
    PARSE_STARTED: {
        engine: VigorParse<any>
        source: VigorFetchParseSource
        attempt: number
    }
    /** `timeline` is the parse engine's whole timeline. `result` is `VigorDefault` when it failed. */
    PARSE_ENDED: {
        engine: VigorParse<any>
        source: VigorFetchParseSource
        attempt: number
        timeline: VigorParseTimeline
        took: number
        result: unknown
    }
}

/** A fetch context as stored on a timeline entry. */
export type VigorFetchTimelineSnapshot = VigorTimelineSnapshot<VigorFetchContextSchema<any>>

export type VigorFetchTimeline = VigorTimeline<VigorFetchTimelineEvents, VigorFetchTimelineSnapshot>
