import outboxQueue from "../infrastructure/queues/outbox.queue.js";

import {
    findPendingOutboxEvents,
    markOutboxEventProcessing,
} from "../repositories/outbox.repository.js";

import {
    JOB_NAME,
} from "../constants/queue.constants.js";


const dispatchPendingOutboxEvents = async (
    limit = 100
) => {

    const events =
        await findPendingOutboxEvents(limit);


    if (events.length === 0) {
        return {
            dispatched: 0,
        };
    }


    let dispatched = 0;


    for (const event of events) {

        /*
         * Atomically change PENDING → PROCESSING.
         *
         * If another dispatcher already picked this event,
         * updateMany() returns count = 0.
         */

        const result =
            await markOutboxEventProcessing(
                event.id
            );


        if (result.count === 0) {
            continue;
        }


        await outboxQueue.add(
            JOB_NAME.PROCESS_OUTBOX_EVENT,
            {
                outboxEventId: event.id,
            },

            {
                jobId: event.id,
            }
        );


        dispatched++;
    }


    return {
        dispatched,
    };
};


export {
    dispatchPendingOutboxEvents,
};