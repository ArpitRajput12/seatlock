import {
    updateIdempotencyKey,
} from "../repositories/idempotency.repository.js";


const idempotencyResponseMiddleware = (
    req,
    res,
    next
) => {

    /*
    Agar idempotency middleware ne record create nahi kiya,
    to normal request continue karo.
    */

    if (!req.idempotencyRecordId) {
        return next();
    }


    /*
    Original res.json save karo.
    */

    const originalJson =
        res.json.bind(res);


    /*
    Response body capture karo.
    */

    res.json = (body) => {

        /*
        Idempotency record mein response save karo.

        IMPORTANT:
        Original response ko block nahi kar rahe.
        */

        updateIdempotencyKey(
            req.idempotencyRecordId,

            {
                responseBody: body,

                statusCode:
                    res.statusCode,
            }
        ).catch((error) => {

            console.error(
                "Failed to save idempotency response:",
                error
            );
        });


        return originalJson(body);
    };


    return next();
};


export default idempotencyResponseMiddleware;