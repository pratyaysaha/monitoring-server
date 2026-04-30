const notificationDb = require("./notification-db");

function initializeDatabase() {
    notificationDb.exec(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            subscription_id TEXT UNIQUE,
            endpoint TEXT PRIMARY KEY,
            p256dh TEXT NOT NULL,
            auth TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    const columns = notificationDb.prepare(`PRAGMA table_info(push_subscriptions);`).all();
    const hasSubscriptionId = columns.some((column) => column.name === "subscription_id");

    if (!hasSubscriptionId) {
        notificationDb.exec(`
            ALTER TABLE push_subscriptions
            ADD COLUMN subscription_id TEXT;
        `);
    }

    notificationDb.exec(`
        UPDATE push_subscriptions
        SET subscription_id = lower(hex(randomblob(16)))
        WHERE subscription_id IS NULL;
    `);

    notificationDb.exec(`
        CREATE UNIQUE INDEX IF NOT EXISTS idx_push_subscriptions_subscription_id
        ON push_subscriptions(subscription_id);
    `);

    console.log(
        "Push subscriptions table ready"
    );
}

module.exports = {
    initializeDatabase,
};
