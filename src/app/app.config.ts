import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

const firebaseConfig = {
  apiKey: "AIzaSyB7FkLocz5uYXfFGzpVPFHM8tu6ZFzGbt4",
  authDomain: "se2-blockvote.firebaseapp.com",
  projectId: "se2-blockvote",
  storageBucket: "se2-blockvote.firebasestorage.app",
  messagingSenderId: "634626742659",
  appId: "1:634626742659:web:597b23b5a88b406a4cfeb6"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideZoneChangeDetection(),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ]
};

