const notificationDb = require("./notification-db")

function initializeDatabase() {
    notificationDb.exec(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            endpoint TEXT PRIMARY KEY,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
    console.log(
        "Push subscriptions table ready"
    );
}

module.exports = {
    initializeDatabase,
};
