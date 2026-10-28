const QUEUE_NAME = {
    OUTBOX: "seatlock-outbox",
    SEAT_RELEASE: "seatlock-seat-release",
    HOLD_EXPIRE: "hold-expire-queue",
    WEBHOOK_RETRY: "webhook-retry-queue",
    OUTBOX_PUBLISH: "outbox-publish-queue",
    FAILED_JOBS: "failed-jobs-queue",
};

const JOB_NAME = {
    PROCESS_OUTBOX_EVENT: "process-outbox-event",
    RELEASE_EXPIRED_SEATS: "release-expired-seats",
    SCAN_EXPIRED_HOLDS: "scan-expired-holds",
    RETRY_WEBHOOK: "retry-webhook",
    PUBLISH_NOTIFICATION: "publish-notification",
    RETRY_FAILED_JOB: "retry-failed-job",
};

export {
    QUEUE_NAME,
    JOB_NAME,
};