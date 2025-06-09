import admin, { ServiceAccount } from "firebase-admin";
import serviceAccountLocal from "./serviceAccountKey.json";

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
  serviceAccount = serviceAccountLocal as ServiceAccount;
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const messaging = admin.messaging();
