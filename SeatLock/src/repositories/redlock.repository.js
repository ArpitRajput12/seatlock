import redlock from "../infrastructure/redlock.js";

const acquireSeatLock = async (showSeatId, ttl = 10000) => {
    const resource = `seatlock:show-seat:${showSeatId}`;

    return redlock.acquire([resource], ttl);
};

export {
    acquireSeatLock,
};