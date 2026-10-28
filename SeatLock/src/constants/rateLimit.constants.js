const RATE_LIMIT = {
    GENERAL: {
        CAPACITY: 100,
        REFILL_RATE: 100,
        WINDOW_SECONDS: 60,
    },

    AUTH: {
        CAPACITY: 10,
        REFILL_RATE: 10,
        WINDOW_SECONDS: 60,
    },

    BOOKING: {
        CAPACITY: 20,
        REFILL_RATE: 20,
        WINDOW_SECONDS: 60,
    },

    PAYMENT: {
        CAPACITY: 10,
        REFILL_RATE: 10,
        WINDOW_SECONDS: 60,
    },
};

export {
    RATE_LIMIT,
};