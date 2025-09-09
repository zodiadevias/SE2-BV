import { Injectable } from '@angular/core';
import axios from 'axios';

@Injectable({
  providedIn: 'root'
})
export class BackendService {

  private apiUrl = 'http://localhost:4000';

  
  async createElection(name: string, startDate: string, endDate: string, domainFilter: string, email: string) {
    const response = await axios.post(`${this.apiUrl}/create-election`, {
      name,
      startDate,
      endDate,
      domainFilter,
      email
    });
    return response.data;
  }

  
}
