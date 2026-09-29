import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import functions from '@react-native-firebase/functions';
import storage from '@react-native-firebase/storage';
import { Platform } from 'react-native';

const USE_EMULATOR = process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';

if (USE_EMULATOR && __DEV__) {
  const host = Platform.OS === 'android' ? '10.0.2.2' : '127.0.0.1';

  try {
    auth().useEmulator(`http://${host}:9099`);
    firestore().useEmulator(host, 8080);
    functions().useEmulator(host, 5001);
    storage().useEmulator(host, 9199);
    console.log(`Connected to Firebase Local Emulators on ${host}`);
  } catch (err) {
    console.warn('Firebase emulator setup warning:', err);
  }
}

// Enable Firestore offline persistence
try {
  firestore().settings({
    persistence: true,
    cacheSizeBytes: firestore.CACHE_SIZE_UNLIMITED,
  });
} catch (err) {
  // Settings can only be applied once before any Firestore calls
}

export { auth, firestore, functions, storage };
