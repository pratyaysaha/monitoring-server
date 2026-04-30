require("dotenv").config();

const serviceNames = process.env.SERVICES.split(",");

const services = serviceNames.map((name) => {
  const key = `${name.toUpperCase()}_URL`;

  return {
    name,
    url: process.env[key]
  };
});

module.exports = {
  port: process.env.PORT || 3000,
  promUrl: process.env.PROM_URL,
  services,
  pushNotificationDb: process.env.PUSH_NOTIFICATION_DB,
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY,
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY,
  vapidSubject: process.env.VAPID_SUBJECT
};
