import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private apiUrl = 'http://localhost:4000';

  async vote(electionId: number, candidateId: number[]) {
    const response = await axios.post(`${this.apiUrl}/vote`, {
      electionId,
      candidateId
    });
    return response.data;
  }
}
