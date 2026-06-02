const Database = require("better-sqlite3");
const { automationDbUri } = require("../../configs");

const automationDb = new Database(
    automationDbUri
);

module.exports = automationDb;
