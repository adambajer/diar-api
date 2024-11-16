// firebase.js
const admin = require('firebase-admin');
const serviceAccount = require('./voice-noter-firebase-adminsdk-93dab-61fd824a2c.json'); // Ensure this path is correct

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://voice-noter-default-rtdb.europe-west1.firebasedatabase.app',
});

const db = admin.database();

module.exports = db;
