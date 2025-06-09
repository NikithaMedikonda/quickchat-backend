import admin from 'firebase-admin';
import fs from 'fs';
let serviceAccount: admin.ServiceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
} else {
  const file = fs.readFileSync('./serviceAccountKey.json', 'utf-8');
  serviceAccount = JSON.parse(file);
}
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const messaging = admin.messaging();
export { messaging };
export default admin;