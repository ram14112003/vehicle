import admin from "../config/firebase";

export async function sendNotification(token: string | undefined, title: string, body: string) {
  if (!token) {
    console.warn("FCM token is missing, skipping notification");
    return;
  }

  const message = {
    notification: { title, body },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Notification sent successfully:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
