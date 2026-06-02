const crypto = require("crypto");

const attachScriptMeta = (req, res, next) => {

    req.scriptMeta = {
        id: crypto.randomUUID(),
    };

    next();
};

module.exports = {
    attachScriptMeta
};