import * as admin from 'firebase-admin';

const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!rawServiceAccount || rawServiceAccount.startsWith('<<')) {
  throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON must contain a single-line Firebase service account JSON string.');
}

const serviceAccount = JSON.parse(rawServiceAccount);

if (typeof serviceAccount.private_key === 'string') {
  serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default admin;
