import admin, { ServiceAccount } from "firebase-admin";
import fs from "fs";
import path from "path";

let serviceAccount: ServiceAccount;
const keyPath = path.resolve(__dirname, "serviceAccountKey.json");

if (fs.existsSync(keyPath)) {
  const fileContents = fs.readFileSync(keyPath, "utf-8");
  serviceAccount = JSON.parse(fileContents) as ServiceAccount;
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
} else {
  throw new Error("Firebase service account key not found.");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const messaging = admin.messaging();
