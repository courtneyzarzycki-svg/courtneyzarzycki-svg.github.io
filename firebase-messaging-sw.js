importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js");
firebase.initializeApp({
    apiKey: "AIzaSyA6hEEmGv3X0L5sQbZP2YYUQu-sixDqsPM",
    authDomain: "family-hub-2-4a707.firebaseapp.com",
    databaseURL: "https://family-hub-2-4a707-default-rtdb.firebaseio.com",
    projectId: "family-hub-2-4a707",
    storageBucket: "family-hub-2-4a707.firebasestorage.app",
    messagingSenderId: "533379938918",
    appId: "1:533379938918:web:949fbd193d22ff5b074ba7"
});
const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/icon.png",
      requireInteraction: true
    }
  );
});
