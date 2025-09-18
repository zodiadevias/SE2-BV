import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';

import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getStorage, provideStorage } from '@angular/fire/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBlmsyBH7bOyBuOsO41UXYelQBOZkkWHXc",
  authDomain: "blockvote-912af.firebaseapp.com",
  projectId: "blockvote-912af",
  storageBucket: "blockvote-912af.firebasestorage.app",
  messagingSenderId: "463375142915",
  appId: "1:463375142915:web:8e23c80e06f6515c0d7e36",
  measurementId: "G-4VVYNP8NKE"
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideFirebaseApp(() => initializeApp(firebaseConfig)),
    provideAuth(() => getAuth()),
    provideZoneChangeDetection(),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage()),
    provideHttpClient()
  ]
};

