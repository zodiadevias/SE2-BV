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

  async updateElection(electionId: number, name: string, startDate: string, endDate: string, domainFilter: string) {
    const response = await axios.post(`${this.apiUrl}/update-election`, {
      electionId,
      name,
      startDate,
      endDate,
      domainFilter
    });
    return response.data;
  }

  async closeElection(electionId: number) {
    const response = await axios.post(`${this.apiUrl}/close-election`, {
      electionId
    });
    return response.data;
  }


  async getOwnedElections(email: string) {
    const response = await axios.post(`${this.apiUrl}/get-owned-elections`, {
      email
    });
    return response.data;
  }

  
  async getOwnedElectionNames(email: string) {
    const response = await axios.post(`${this.apiUrl}/get-owned-election-names`, {
      email
    });
    return response.data;
  }

  
  async getOwnedElectionIds(email: string) {
    const response = await axios.post(`${this.apiUrl}/get-owned-election-ids`, {
      email
    });
    return response.data;
  }

  
  async getElectionIdByName(name: string) {
    const response = await axios.post(`${this.apiUrl}/get-election-id-by-name`, {
      name
    });
    return response.data;
  }

  

  async getElectionResults(electionId: number) {
    const response = await axios.post(`${this.apiUrl}/get-election-results`, {
      electionId
    });
    return response.data;
  }

  

  async getElectionDetails(electionId: number) {
    const response = await axios.post(`${this.apiUrl}/get-election-details`, {
      electionId
    });
    return response.data;
  }

  

  async getElectionCandidateCount(electionId: number) {
    const response = await axios.post(`${this.apiUrl}/get-election-candidate-count`, {
      electionId
    });
    return response.data;
  }

  
  async addCandidates(electionId: number, candidates: {name: string, position: string, platform: string, cdn: string}[]) {
    const response = await axios.post(`${this.apiUrl}/add-candidates`, {
      electionId,
      candidates
    });
    return response.data;
  }

  async updateCandidate(electionId: number, candidateId: number, name: string, position: string, platform: string, cdn: string) {
    const response = await axios.post(`${this.apiUrl}/update-candidate`, {
      electionId,
      candidateId,
      name,
      position,
      platform,
      cdn
    });
    return response.data;
  }

  async deleteCandidate(electionId: number, candidateId: number) {
    const response = await axios.post(`${this.apiUrl}/delete-candidate`, {
      electionId,
      candidateId
    });
    return response.data;
  }


  async getElectionCandidate(electionId: number, candidateId: number) {
    const response = await axios.post(`${this.apiUrl}/get-election-candidate`, {
      electionId,
      candidateId
    });
    return response.data;
  }

  


}
