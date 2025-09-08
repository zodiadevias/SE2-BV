import { Injectable } from '@angular/core';
import { Auth, authState, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, UserCredential } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { User } from  'firebase/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  authState$: Observable<User | null>;

  constructor(private auth: Auth, private firestore: Firestore) {
    this.authState$ = authState(this.auth);
  }

  async login(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async register(email: string, password: string, role: string) {
    const userCred: UserCredential = await createUserWithEmailAndPassword(this.auth, email, password);

    // Save role in Firestore under "users/{uid}"
    const userRef = doc(this.firestore, `users/${userCred.user.uid}`);
    await setDoc(userRef, {
      email,
      role,
      createdAt: new Date()
    });

    return userCred;
  }

  async logout() {
    return await signOut(this.auth);
  }

  async getUserRole(uid: string): Promise<string | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? (snapshot.data()['role'] as string) : null;
  }
}
