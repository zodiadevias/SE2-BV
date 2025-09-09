import { Injectable } from '@angular/core';
import {
  Auth,
  authState,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  UserCredential,
  onAuthStateChanged,
  User
} from '@angular/fire/auth';
import { Observable, BehaviorSubject } from 'rxjs';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  authState$: Observable<User | null>;
  private roleSubject = new BehaviorSubject<string | null>(null);
  role$ = this.roleSubject.asObservable(); // ✅ use this in sidebar

  constructor(private auth: Auth, private firestore: Firestore) {
    this.authState$ = authState(this.auth);

    // ✅ Listen to login/logout and fetch role automatically
    onAuthStateChanged(this.auth, async (user) => {
      if (user) {
        const role = await this.getUserRole(user.uid);
        this.roleSubject.next(role);
      } else {
        this.roleSubject.next(null);
      }
    });
  }

  async login(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }

  async register(email: string, password: string, role: string) {
  try {
    const userCred: UserCredential = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    // Save role in Firestore under "users/{uid}"
    const userRef = doc(this.firestore, `users/${userCred.user.uid}`);
    await setDoc(userRef, {
      email,
      role,
      createdAt: new Date()
    });

    // Update local role state
    this.roleSubject.next(role);

    return userCred;
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered. Please login instead.');
    }
    throw error;
  }
}


  async logout() {
    await signOut(this.auth);
    this.roleSubject.next(null); // reset role on logout
  }

  async getUserRole(uid: string): Promise<string | null> {
    const userRef = doc(this.firestore, `users/${uid}`);
    const snapshot = await getDoc(userRef);
    return snapshot.exists() ? (snapshot.data()['role'] as string) : null;
  }

  get currentRole(): string | null {
    return this.roleSubject.value;
  }
}
