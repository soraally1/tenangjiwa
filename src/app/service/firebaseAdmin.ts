// @ts-ignore - types may not be available in the workspace; runtime module exists
// eslint-disable-next-line @typescript-eslint/no-var-requires
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK once per runtime
if (!admin.apps.length) {
  try {
    const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT;
    const fallbackProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (serviceAccountBase64) {
      const serviceAccountJson = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || fallbackProjectId,
      });
    } else {
      // Fallback to Application Default Credentials (e.g., GOOGLE_APPLICATION_CREDENTIALS)
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: fallbackProjectId,
      });
    }
  } catch (e) {
    // In case initialization fails, log once; API routes should handle errors gracefully
    console.error('Failed to initialize Firebase Admin SDK:', e);
  }
}

export const adminDb = admin.firestore();
export const AdminFieldValue = admin.firestore.FieldValue;



