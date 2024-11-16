// firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./voice-noter-firebase-adminsdk-93dab-61fd824a2c.json'); // Ensure this path is correct
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    client_emai: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
  databaseURL: 'https://voice-noter-default-rtdb.europe-west1.firebasedatabase.app',
});

const db = admin.database();

module.exports = db;
