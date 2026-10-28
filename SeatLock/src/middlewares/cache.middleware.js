const cacheSourceMiddleware = (
    req,
    res,
    next
) => {

    res.setHeader(
        "X-Cache",
        "MISS"
    );


    const originalJson =
        res.json.bind(res);


    res.json = (body) => {

        if (
            body &&
            body.meta &&
            body.meta.cacheSource
        ) {

            res.setHeader(
                "X-Cache",
                String(
                    body.meta.cacheSource
                ).toUpperCase()
            );
        }


        return originalJson(body);
    };


    next();
};


export default cacheSourceMiddleware;