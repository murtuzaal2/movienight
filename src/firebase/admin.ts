import { initializeApp, getApp, getApps, App } from 'firebase-admin/app';

/**
 * Gets the Firebase Admin SDK App instance.
 * Initializes it if it's not already initialized.
 * This is a server-side utility.
 */
export function getFirebaseAdminApp(): App {
  if (getApps().length) {
    return getApp();
  }
  
  // This will use the GOOGLE_APPLICATION_CREDENTIALS environment variable
  // or other default credential discovery mechanisms.
  return initializeApp();
}
