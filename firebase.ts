import admin, { ServiceAccount } from "firebase-admin";

const rawServiceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '{}');

const serviceAccount: ServiceAccount = {
  ...rawServiceAccount,
  privateKey: rawServiceAccount.private_key.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const messaging = admin.messaging();
