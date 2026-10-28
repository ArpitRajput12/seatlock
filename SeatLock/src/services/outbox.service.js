import {
    createOutboxEvent,
} from "../repositories/outbox.repository.js";

const createOutboxEventService = async (
    db,
    {
        eventType,
        aggregateType,
        aggregateId,
        payload,
    }
) => {
    return createOutboxEvent(db, {
        eventType,
        aggregateType,
        aggregateId,
        payload,
    });
};

const createBookingOutboxEvent = async (
    db,
    {
        eventType,
        bookingId,
        userId,
        showId,
        showSeatIds = [],
        extraPayload = {},
    }
) => {
    return createOutboxEventService(db, {
        eventType,
        aggregateType: "BOOKING",
        aggregateId: bookingId,
        payload: {
            bookingId,
            userId,
            showId,
            showSeatIds,
            ...extraPayload,
        },
    });
};

const createPaymentOutboxEvent = async (
    db,
    {
        eventType,
        paymentId,
        bookingId,
        userId,
        extraPayload = {},
    }
) => {
    return createOutboxEventService(db, {
        eventType,
        aggregateType: "PAYMENT",
        aggregateId: paymentId,
        payload: {
            paymentId,
            bookingId,
            userId,
            ...extraPayload,
        },
    });
};

export {
    createOutboxEventService,
    createBookingOutboxEvent,
    createPaymentOutboxEvent,
};