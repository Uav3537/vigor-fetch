import type { VigorTimeline, VigorTimelineEndEvents, VigorTimelineMiddlewareEvents, VigorTimelineProcessEvents, VigorTimelineSnapshot } from "@core/timeline"
import type { VigorRetryContextSchema } from "./context"
import type { VigorRetryPolicyMiddlewaresIntercept, VigorRetryPolicyMiddlewaresSchema } from "./middlewares"

type VigorRetryTimelineStages = Omit<VigorRetryPolicyMiddlewaresSchema<any>, "__brand">

type VigorRetryTimelineApis = {
    [S in keyof VigorRetryTimelineStages]: Parameters<VigorRetryPolicyMiddlewaresIntercept<any>[S]["func"]>[1]
}

/** Lifecycle steps recorded as `PROCESS_HANDLING`, mapped to their `data`. */
export type VigorRetryProcessHandler = {
    /** A run started. `restartAttempt` is `1` for the first run, and increases on every restart. */
    REQUEST_START: { restartAttempt: number }
    /** The run failed, before `onError` runs. */
    REQUEST_ERROR: { error: unknown }
    /** `onError` asked for a restart; the next run's entries follow. */
    REQUEST_RESTART: { restartAttempt: number }
    /** An attempt started. */
    RETRY_START: { attempt: number }
    /**
     * An attempt failed (in a middleware, the target, or by timeout/abort).
     * `timedOut`: it hit `settings.timeout`; `aborted`: an external signal fired.
     */
    RETRY_ERROR: { attempt: number, error: unknown, timedOut: boolean, aborted: boolean }
}

/**
 * Why a failed attempt was or wasn't retried: `"retry"` — it will be;
 * `"cancelled"` — `retryIf` decided against it (`cancelRetry()` or a
 * fluent `false`); `"breakRetry"` — a middleware called `breakRetry()`;
 * `"aborted"` — an external signal fired; `"exhausted"` — no attempts left.
 */
export type VigorRetryDecisionReason = "retry" | "cancelled" | "breakRetry" | "aborted" | "exhausted"

/** Every action a retry timeline can record, mapped to its content. */
export type VigorRetryTimelineEvents =
    VigorTimelineProcessEvents<VigorRetryProcessHandler> &
    VigorTimelineMiddlewareEvents<VigorRetryTimelineStages, VigorRetryTimelineApis> &
    VigorTimelineEndEvents & {
    ATTEMPT_INCREASED: { attempt: number }
    TARGET_REQUEST_STARTED: { attempt: number }
    TARGET_REQUEST_ENDED: { attempt: number, took: number }
    /** What happens after a failed attempt, and why (see {@link VigorRetryDecisionReason}). */
    RETRY_DECISION: { attempt: number, retry: boolean, reason: VigorRetryDecisionReason }
    /** The delay about to be awaited before the next attempt. */
    RETRY_DELAY: { attempt: number, delay: number }
}

/** A retry context as stored on a timeline entry. */
export type VigorRetryTimelineSnapshot = VigorTimelineSnapshot<VigorRetryContextSchema<any>>

export type VigorRetryTimeline = VigorTimeline<VigorRetryTimelineEvents, VigorRetryTimelineSnapshot>
