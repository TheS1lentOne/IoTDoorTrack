importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD_9_e5LN36U05VUBvKm0HRxg0eptBopnY",
  authDomain: "my-door-app-58673.firebaseapp.com",
  projectId: "my-door-app-58673",
  storageBucket: "my-door-app-58673.firebasestorage.app",
  messagingSenderId: "455049773223",
  appId: "1:455049773224:web:a0d518782cf6e493bddb82"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  self.registration.showNotification(
    payload.notification?.title ?? 'Alarm',
    {
      body: payload.notification?.body ?? 'Νέο event!',
    }
  );
});
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  event.waitUntil(
    self.registration.showNotification('Alarm Test', {
      body: 'Push event received!',
    })
  );
});