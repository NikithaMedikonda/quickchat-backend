import admin, { ServiceAccount } from "firebase-admin";

let serviceAccount: ServiceAccount;

if (process.env.NODE_ENV === "production") {
  const rawServiceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}"
  );

  serviceAccount = {
    ...rawServiceAccount,
    privateKey: rawServiceAccount.private_key.replace(/\\n/g, "\n"),
  };
} else {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const serviceAccountLocal = require("./serviceAccountKey.json") as ServiceAccount;
  serviceAccount = serviceAccountLocal;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const messaging = admin.messaging();
