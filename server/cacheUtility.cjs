const NodeCache = require('node-cache');

// stdTTL: (default: 0) the standard ttl as number in seconds for every generated cache element.
// checkperiod: (default: 600) The period in seconds, as a number, used for the automatic delete check interval.
const myCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

const getCache = (key) => {
    try {
        const value = myCache.get(key);
        return value || null;
    } catch (err) {
        console.error(`Error getting cache for ${key}:`, err);
        return null;
    }
};

const setCache = (key, value, ttlSeconds = 3600) => {
    try {
        myCache.set(key, value, ttlSeconds);
    } catch (err) {
        console.error(`Error setting cache for ${key}:`, err);
    }
};

const deleteCache = (key) => {
    try {
        myCache.del(key);
    } catch (err) {
        console.error(`Error deleting cache for ${key}:`, err);
    }
};

const flushCache = () => {
    myCache.flushAll();
};

module.exports = {
    getCache,
    setCache,
    deleteCache,
    flushCache
};
