import logger from "../config/logger.js";
import { dispatchPendingOutboxEvents } from "../services/outboxDispatcher.service.js";

const OUTBOX_DISPATCH_INTERVAL = 5000;
let dispatcherTimer = null;

const dispatch = async () => {
    try {
        const result = await dispatchPendingOutboxEvents(100);
        if (result.dispatched > 0) {
            logger.info(
                { count: result.dispatched },
                "[Outbox Dispatcher] Dispatched event batch"
            );
        }
    } catch (error) {
        logger.error({ error }, "[Outbox Dispatcher] Dispatch failed");
    }
};

const startOutboxDispatcher = () => {
    logger.info("[Outbox Dispatcher] Started");
    dispatch();
    dispatcherTimer = setInterval(dispatch, OUTBOX_DISPATCH_INTERVAL);
    return stopOutboxDispatcher;
};

const stopOutboxDispatcher = () => {
    if (dispatcherTimer) {
        clearInterval(dispatcherTimer);
        dispatcherTimer = null;
    }
    logger.info("[Outbox Dispatcher] Stopped");
};

export {
    startOutboxDispatcher,
    stopOutboxDispatcher,
};
