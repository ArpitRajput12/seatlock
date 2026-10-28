import prisma from "../config/db.js";
import logger from "../config/logger.js";

/**
 * Records or updates a failed job in the failed_jobs table.
 */
const recordFailedJob = async ({
    queueName,
    jobId,
    jobName,
    payload = null,
    error,
    attempts = 1,
}) => {
    try {
        const errorMessage = error?.message || String(error || "Unknown job failure");

        const failedJob = await prisma.failedJob.upsert({
            where: {
                queueName_jobId: {
                    queueName,
                    jobId: String(jobId),
                },
            },
            create: {
                queueName,
                jobId: String(jobId),
                jobName: String(jobName),
                payload: payload ? JSON.parse(JSON.stringify(payload)) : null,
                error: errorMessage,
                attempts: Number(attempts) || 1,
                failedAt: new Date(),
            },
            update: {
                error: errorMessage,
                attempts: Number(attempts) || 1,
                failedAt: new Date(),
            },
        });

        logger.error(
            {
                queueName,
                jobId,
                jobName,
                error: errorMessage,
                attempts,
            },
            "Job failure recorded in failed_jobs table"
        );

        return failedJob;
    } catch (err) {
        logger.error({ err, queueName, jobId }, "Failed to record job failure in database");
        return null;
    }
};

/**
 * Retrieves failed jobs with pagination.
 */
const getFailedJobsService = async ({ page = 1, limit = 20, queueName = null }) => {
    const skip = (page - 1) * limit;
    const where = queueName ? { queueName } : {};

    const [total, failedJobs] = await Promise.all([
        prisma.failedJob.count({ where }),
        prisma.failedJob.findMany({
            where,
            orderBy: { failedAt: "desc" },
            skip,
            take: limit,
        }),
    ]);

    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        data: failedJobs,
    };
};

/**
 * Marks a failed job as resolved.
 */
const resolveFailedJobService = async (id) => {
    return prisma.failedJob.update({
        where: { id },
        data: {
            resolvedAt: new Date(),
        },
    });
};

export {
    recordFailedJob,
    getFailedJobsService,
    resolveFailedJobService,
};

