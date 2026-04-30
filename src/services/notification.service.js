const notificationDb = require("../db/notification-db")

exports.subscribePushNotification = (subscription) => {
    console.log(subscription)
    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys.p256dh;
    const auth = subscription.keys.auth;
    console.log(endpoint, p256dh, auth)
    const statement = notificationDb.prepare(`INSERT OR REPLACE INTO push_subscriptions ( endpoint, p256dh, auth ) VALUES (?, ?, ?)`);
    statement.run(
        endpoint,
        p256dh,
        auth
    );
    return { success: true }
}

exports.getAllSubscriptions = () => {
    const statement = notificationDb.prepare(`SELECT * from push_subscriptions;`);
    return statement.all();
}