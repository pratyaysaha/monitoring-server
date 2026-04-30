const webpush = require("web-push");
const crypto = require("crypto");
const notificationDb = require("../db/notification-db");
const config = require("../configs");

function ensureWebPushConfigured() {
    if (!config.vapidPublicKey || !config.vapidPrivateKey || !config.vapidSubject) {
        throw new Error("VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY and VAPID_SUBJECT must be configured");
    }

    webpush.setVapidDetails(
        config.vapidSubject,
        config.vapidPublicKey,
        config.vapidPrivateKey
    );
}

exports.subscribePushNotification = (subscription) => {
    const endpoint = subscription.endpoint;
    const p256dh = subscription.keys.p256dh;
    const auth = subscription.keys.auth;

    if (!endpoint || !p256dh || !auth) {
        throw new Error("subscription endpoint, p256dh and auth are required");
    }

    const existingSubscription = notificationDb
        .prepare(`SELECT subscription_id FROM push_subscriptions WHERE endpoint = ?`)
        .get(endpoint);

    const subscriptionId = existingSubscription?.subscription_id || crypto.randomUUID();

    const statement = notificationDb.prepare(`
        INSERT INTO push_subscriptions (subscription_id, endpoint, p256dh, auth)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(endpoint) DO UPDATE SET
            subscription_id = excluded.subscription_id,
            p256dh = excluded.p256dh,
            auth = excluded.auth
    `);

    statement.run(subscriptionId, endpoint, p256dh, auth);

    return {
        success: true,
        subscriptionId
    };
};

exports.getAllSubscriptions = () => {
    const statement = notificationDb.prepare(`SELECT * from push_subscriptions;`);
    return statement.all();
};

exports.sendTestNotification = async ({ subscriptionId, endpoint, title, body, data }) => {
    if (!subscriptionId && !endpoint) {
        throw new Error("subscriptionId or endpoint is required");
    }

    ensureWebPushConfigured();

    const subscription = subscriptionId
        ? notificationDb
            .prepare(`SELECT subscription_id, endpoint, p256dh, auth FROM push_subscriptions WHERE subscription_id = ?`)
            .get(subscriptionId)
        : notificationDb
            .prepare(`SELECT subscription_id, endpoint, p256dh, auth FROM push_subscriptions WHERE endpoint = ?`)
            .get(endpoint);

    if (!subscription) {
        throw new Error("No push subscription found for the provided identifier");
    }

    const payload = JSON.stringify({
        title: title || "Test Notification",
        body: body || "This is a test push notification from Home Server.",
        data: data || {
            source: "monitoring-api",
            type: "test"
        }
    });

    await webpush.sendNotification(
        {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth
            }
        },
        payload
    );

    return {
        success: true,
        subscriptionId: subscription.subscription_id,
        endpoint: subscription.endpoint
    };
};
