import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: 'AIzaSyDn1nrvOL4bFNUUwqVtwM0oh0_zKyx4gnI',
  authDomain: 'donkey-bingo.firebaseapp.com',
  databaseURL: 'https://donkey-bingo-default-rtdb.firebaseio.com',
  projectId: 'donkey-bingo',
  storageBucket: 'donkey-bingo.firebasestorage.app',
  messagingSenderId: '713356008088',
  appId: '1:713356008088:web:83143f5a4fbc519ccf8eed',
  measurementId: 'G-1MHNBPLXP6',
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

