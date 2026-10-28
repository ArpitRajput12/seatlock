import {
    getOrSetCache,
    deleteCache,
    deleteCacheByPattern,
} from "./cache.service.js";


const SHOW_LIST_TTL = 30;

const SHOW_DETAIL_TTL = 60;


// --------------------------------------------------
// Create stable cache key for query
// --------------------------------------------------

const createQueryKey = (query = {}) => {

    const sortedEntries =
        Object.entries(query)
            .sort(([keyA], [keyB]) =>
                keyA.localeCompare(keyB)
            );


    return sortedEntries
        .map(([key, value]) =>
            `${key}=${String(value)}`
        )
        .join("&");
};


// --------------------------------------------------
// GET SHOWS FROM CACHE
// --------------------------------------------------

const getCachedShows = async (
    query,
    loader
) => {

    const queryKey =
        createQueryKey(query);


    const key =
        `cache:shows:list:${queryKey || "all"}`;


    return getOrSetCache(
        key,
        loader,
        SHOW_LIST_TTL
    );
};


// --------------------------------------------------
// GET SINGLE SHOW FROM CACHE
// --------------------------------------------------

const getCachedShow = async (
    showId,
    loader
) => {

    const key =
        `cache:shows:detail:${showId}`;


    return getOrSetCache(
        key,
        loader,
        SHOW_DETAIL_TTL
    );
};


// --------------------------------------------------
// INVALIDATE SINGLE SHOW
// --------------------------------------------------

const invalidateShowCache = async (
    showId
) => {

    await deleteCache(
        `cache:shows:detail:${showId}`
    );


    // Show list can also contain this show.

    await deleteCacheByPattern(
        "cache:shows:list:*"
    );
};


// --------------------------------------------------
// INVALIDATE ALL SHOW CACHE
// --------------------------------------------------

const invalidateAllShowCache = async () => {

    await deleteCacheByPattern(
        "cache:shows:*"
    );
};


export {
    getCachedShows,
    getCachedShow,
    invalidateShowCache,
    invalidateAllShowCache,
};