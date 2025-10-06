import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { Firestore, doc, setDoc, getDoc , collection, collectionData} from '@angular/fire/firestore';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private firestore: Firestore, private authService: AuthService) { }

  private historySubject = new BehaviorSubject<any[]>([]);
  history$ = this.historySubject.asObservable();
  
  addToHistory(email: string,name: string, txHash: string, date: Date) {
    const historyRef = doc(this.firestore, `history/${new Date().toISOString()}`);
    const data = {
      email,
      name,
      txHash,
      date: date.toISOString()
    };
    setDoc(historyRef, data).then(() => {
      this.historySubject.next([...this.historySubject.getValue(), data]);
    });
  }

  addVoteHistory(email: string, electionId: number, electionName: string, txHash: string, date: Date) {
    const historyRef = doc(this.firestore, `voteHistory/${new Date().toISOString()}`);
    const data = {
      email,
      electionId,
      electionName,
      txHash,
      date: date.toISOString()
    };
    setDoc(historyRef, data).then(() => {
      this.historySubject.next([...this.historySubject.getValue(), data]);
    });
  }

  getVoteHistory(): Observable<any[]> {
    const voteHistoryRef = collection(this.firestore, 'voteHistory');
    return collectionData(voteHistoryRef, { idField: 'id' }) as Observable<any[]>;
  }


   getHistory(): Observable<any[]> {
    const historyRef = collection(this.firestore, 'history');
    return collectionData(historyRef, { idField: 'id' }) as Observable<any[]>;
  }


}
