const Database = require("better-sqlite3");
const { pushNotificationDb } = require("../configs");

const notificationDb = new Database(
    pushNotificationDb
);

module.exports = notificationDb;
