import prisma from "../config/db.js";
import {
    SAGA_STATUS,
    SAGA_STEP,
} from "../constants/saga.constants.js";

/**
 * Creates an audit log entry representing the start of a Saga transaction.
 */
const createSaga = async (tx, data) => {
    return tx.auditLog.create({
        data: {
            action: `SAGA_${SAGA_STEP.CREATE_BOOKING}`,
            entityType: "BOOKING",
            entityId: data.bookingId,
            userId: data.userId,
            metadata: {
                sagaStatus: SAGA_STATUS.STARTED,
                step: SAGA_STEP.CREATE_BOOKING,
            },
        },
    });
};

const updateSaga = async (
    sagaId,
    { status, step, metadata = {} }
) => {
    return prisma.auditLog.update({
        where: { id: sagaId },
        data: {
            action: `SAGA_${step}`,
            metadata: {
                sagaStatus: status,
                step,
                ...metadata,
            },
        },
    });
};

const markSagaCompleted = async (sagaId, metadata = {}) => {
    return updateSaga(sagaId, {
        status: SAGA_STATUS.COMPLETED,
        step: SAGA_STEP.BOOK_SEATS,
        metadata,
    });
};

const markSagaFailed = async (sagaId, step, errorMessage) => {
    return updateSaga(sagaId, {
        status: SAGA_STATUS.FAILED,
        step,
        metadata: { errorMessage },
    });
};

const markSagaCompensated = async (sagaId, metadata = {}) => {
    return updateSaga(sagaId, {
        status: SAGA_STATUS.COMPENSATED,
        step: SAGA_STEP.RELEASE_SEATS,
        metadata,
    });
};

export {
    createSaga,
    updateSaga,
    markSagaCompleted,
    markSagaFailed,
    markSagaCompensated,
};
