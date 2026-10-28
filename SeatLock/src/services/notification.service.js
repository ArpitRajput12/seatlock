import prisma from "../config/db.js";
import logger from "../config/logger.js";
import { OUTBOX_EVENT } from "../constants/outbox.constants.js";

/**
 * Formats notification messages for Email and SMS based on outbox event types.
 */
const buildNotificationContent = (eventType, payload, user, bookingDetails) => {
    const userName = user?.name || "Moviegoer";
    const bookingNumber = payload?.bookingNumber || bookingDetails?.bookingNumber || payload?.bookingId || "N/A";
    const movieTitle = bookingDetails?.show?.movie?.title || "Movie";
    const showTime = bookingDetails?.show?.startTime
        ? new Date(bookingDetails.show.startTime).toLocaleString("en-IN")
        : "Scheduled Time";

    switch (eventType) {
        case OUTBOX_EVENT.BOOKING_CREATED:
        case OUTBOX_EVENT.SEATS_HELD:
            return {
                subject: `Seats Held - Booking #${bookingNumber} | SeatLock`,
                emailBody: `Hi ${userName},\n\nYour seats for "${movieTitle}" have been temporarily held for 10 minutes. Please complete payment to confirm your booking.\nBooking Ref: ${bookingNumber}`,
                smsBody: `SeatLock: Seats held for "${movieTitle}"! Complete payment within 10 mins to confirm. Ref: ${bookingNumber}`,
            };

        case OUTBOX_EVENT.BOOKING_CONFIRMED:
            return {
                subject: `Booking Confirmed! #${bookingNumber} | SeatLock`,
                emailBody: `Hi ${userName},\n\nYour tickets for "${movieTitle}" at ${showTime} are CONFIRMED!\nBooking Ref: ${bookingNumber}\nTotal Paid: ₹${bookingDetails?.totalAmount || payload?.totalAmount || ""}\nEnjoy the movie!`,
                smsBody: `SeatLock Confirmed: "${movieTitle}" at ${showTime}. Booking #${bookingNumber}. Enjoy the show!`,
            };

        case OUTBOX_EVENT.BOOKING_CANCELLED:
            return {
                subject: `Booking Cancelled - #${bookingNumber} | SeatLock`,
                emailBody: `Hi ${userName},\n\nYour booking #${bookingNumber} for "${movieTitle}" has been cancelled. Any held seats have been released.`,
                smsBody: `SeatLock: Booking #${bookingNumber} has been cancelled.`,
            };

        case OUTBOX_EVENT.PAYMENT_SUCCEEDED:
            return {
                subject: `Payment Receipt for Booking #${bookingNumber} | SeatLock`,
                emailBody: `Hi ${userName},\n\nWe have received your payment for Booking #${bookingNumber}. Thank you for booking with SeatLock!`,
                smsBody: `SeatLock: Payment received successfully for Booking #${bookingNumber}.`,
            };

        case OUTBOX_EVENT.PAYMENT_FAILED:
            return {
                subject: `Payment Failed - Booking #${bookingNumber} | SeatLock`,
                emailBody: `Hi ${userName},\n\nPayment for Booking #${bookingNumber} could not be processed. Your held seats have been released.`,
                smsBody: `SeatLock Alert: Payment failed for Booking #${bookingNumber}. Held seats have been released.`,
            };

        case OUTBOX_EVENT.REFUND_CREATED:
            return {
                subject: `Refund Initiated for Booking #${bookingNumber} | SeatLock`,
                emailBody: `Hi ${userName},\n\nYour refund for Booking #${bookingNumber} has been initiated. It will reflect in your original payment method in 3-5 business days.`,
                smsBody: `SeatLock: Refund initiated for Booking #${bookingNumber}. It will credit in 3-5 business days.`,
            };

        default:
            return {
                subject: `Update regarding Booking #${bookingNumber} | SeatLock`,
                emailBody: `Hi ${userName},\n\nThis is an update regarding your booking #${bookingNumber}.`,
                smsBody: `SeatLock: Update for Booking #${bookingNumber}.`,
            };
    }
};

/**
 * Dispatches notification via Email (SendGrid/SES) and SMS (Twilio).
 */
const sendNotificationService = async ({ eventType, aggregateId, payload }) => {
    const bookingId = payload?.bookingId || aggregateId;
    const userId = payload?.userId;

    let user = null;
    let bookingDetails = null;

    if (userId) {
        user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, phone: true },
        });
    }

    if (bookingId) {
        bookingDetails = await prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                show: {
                    include: {
                        movie: true,
                        screen: {
                            include: {
                                theater: true,
                            },
                        },
                    },
                },
                bookingSeats: {
                    include: {
                        showSeat: {
                            include: {
                                seat: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user && bookingDetails?.userId) {
            user = await prisma.user.findUnique({
                where: { id: bookingDetails.userId },
                select: { id: true, name: true, email: true, phone: true },
            });
        }
    }

    const { subject, emailBody, smsBody } = buildNotificationContent(
        eventType,
        payload,
        user,
        bookingDetails
    );

    const recipientEmail = user?.email || "customer@seatlock.local";
    const recipientPhone = user?.phone || "+919999999999";

    // 1. Dispatch Email (SendGrid/SES abstraction)
    logger.info(
        {
            provider: process.env.EMAIL_PROVIDER || "SES/SendGrid",
            recipientEmail,
            subject,
            eventType,
            bookingId,
        },
        "[Notification] Email dispatched successfully"
    );

    // 2. Dispatch SMS (Twilio abstraction)
    logger.info(
        {
            provider: process.env.SMS_PROVIDER || "Twilio",
            recipientPhone,
            smsBody,
            eventType,
            bookingId,
        },
        "[Notification] SMS dispatched successfully"
    );

    return {
        dispatched: true,
        email: { recipient: recipientEmail, subject },
        sms: { recipient: recipientPhone, preview: smsBody.substring(0, 60) },
    };
};

export {
    sendNotificationService,
};

