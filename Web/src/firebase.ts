import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyD_9_e5LN36U05VUBvKm0HRxg0eptBopnY",
  authDomain: "my-door-app-58673.firebaseapp.com",
  projectId: "my-door-app-58673",
  storageBucket: "my-door-app-58673.firebasestorage.app",
  messagingSenderId: "455049773223",
  appId: "1:455049773223:web:a0d518782cf6e493bddb82",
  measurementId: "G-T3RZ0YH5BF"
};

const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

onMessage(messaging, (payload) => {
  console.log("Message received:", payload);
  if (Notification.permission === "granted") {
    new Notification(payload.notification?.title ?? "Alarm", {
      body: payload.notification?.body ?? "Νέο event!",
    });
  }
});

export const generateToken = async () => {
  const permission = await Notification.requestPermission();
  if (permission === "granted") {
    const token = await getToken(messaging, {
      vapidKey: "BI0j997yacNSAXZgmc5_-1-JYxAE5USDJcjl01UV4Y4uwF3fcrdGpFj7frppyqY3_mz3idtUzCu2j9C7TmAKTJU"
    });
    console.log("FCM Token:", token);
    return token;
  }
};