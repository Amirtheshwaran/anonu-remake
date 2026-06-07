import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      case TargetPlatform.macOS:
        return macos;
      case TargetPlatform.windows:
        return windows;
      default:
        return web;
    }
  }

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyB2ts4ikScArsJj6BI1UaWXIZUnQzLxnAA',
    appId: '1:312541537240:web:655e18b50ecc7c55eec8ad',
    messagingSenderId: '312541537240',
    projectId: 'anonu-63972',
    authDomain: 'anonu-63972.firebaseapp.com',
    storageBucket: 'anonu-63972.firebasestorage.app',
    measurementId: 'G-9FPYMJGXWE',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyCTyEjqNlP6Q_ZELq2W_-8ZctmnyhfFD1Q',
    appId: '1:312541537240:android:75c8d780adfe9e79eec8ad',
    messagingSenderId: '312541537240',
    projectId: 'anonu-63972',
    storageBucket: 'anonu-63972.firebasestorage.app',
  );
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'AIzaSyCRkd63gOdHvAFPUfVCQY33letce4P1NWE',
    appId: '1:312541537240:ios:3672906b0d146c34eec8ad',
    messagingSenderId: '312541537240',
    projectId: 'anonu-63972',
    storageBucket: 'anonu-63972.firebasestorage.app',
    iosClientId: '312541537240-6k2v5msq1bctcvn75ql0hfoshtr8h74a.apps.googleusercontent.com',
    iosBundleId: 'com.example.anonu',
  );
  static const FirebaseOptions macos = FirebaseOptions(
    apiKey: 'AIzaSyCRkd63gOdHvAFPUfVCQY33letce4P1NWE',
    appId: '1:312541537240:ios:3672906b0d146c34eec8ad',
    messagingSenderId: '312541537240',
    projectId: 'anonu-63972',
    storageBucket: 'anonu-63972.firebasestorage.app',
    iosClientId: '312541537240-6k2v5msq1bctcvn75ql0hfoshtr8h74a.apps.googleusercontent.com',
    iosBundleId: 'com.example.anonu',
  );

  static const FirebaseOptions windows = FirebaseOptions(
    apiKey: 'AIzaSyB2ts4ikScArsJj6BI1UaWXIZUnQzLxnAA',
    appId: '1:312541537240:web:cb8e09fbac231f2deec8ad',
    messagingSenderId: '312541537240',
    projectId: 'anonu-63972',
    authDomain: 'anonu-63972.firebaseapp.com',
    storageBucket: 'anonu-63972.firebasestorage.app',
    measurementId: 'G-B6DH39002C',
  );
}
