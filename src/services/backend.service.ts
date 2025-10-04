import { Injectable } from '@angular/core';
import Web3 from 'web3';
import contractABI from './VotingABI.json';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private web3: Web3;
  private contract: any;
  // private contractAddress = '0x2bd1f45fe793b5057401500c2fccea1677d72496';
  private contractAddress = '0x5900760eddf3da4a3b8942bb9f7cdf3f8e9c73c4';

  // ⚠️ Private key exposed – use only for demo/testing
  private serverAccount = '0x514f2160831880228596a7bE6094A61E9B6d62f8';
  private privateKey =
    '36306509366080fce51467e0e8b0c8702b93b8215d1cf46f997c7e59f5b9a145';

  constructor() {
    this.web3 = new Web3('https://ethereum-sepolia-rpc.publicnode.com');
    this.contract = new this.web3.eth.Contract(
      contractABI as any,
      this.contractAddress
    );
  }

  /** Helper: send signed tx */
  private async sendTransaction(tx: any) {
    const gas = await tx.estimateGas({ from: this.serverAccount });
    const data = tx.encodeABI();

    const signedTx = await this.web3.eth.accounts.signTransaction(
      {
        to: this.contractAddress,
        data,
        gas,
      },
      this.privateKey
    );

    return await this.web3.eth.sendSignedTransaction(
      signedTx.rawTransaction as string
    );
  }

  /** ========= WRITE FUNCTIONS ========= */
  async createElection(
    name: string,
    start: number,
    end: number,
    domainFilter: string,
    email: string
  ) {
    const tx = this.contract.methods.createElection(name, start, end, domainFilter, email);
    const receipt = await this.sendTransaction(tx);

    console.log("RAW RECEIPT:", receipt);

    // Try to decode event using ABI
    const decoded = receipt.events?.['ElectionCreated']?.returnValues;

    let electionId: number | null = null;

    if (decoded) {
      // ✅ If ABI is correct
      electionId = Number(decoded.electionId);
    } else {
      // ❌ ABI not decoding, fallback: read from topics
      const log = receipt.logs[0];
      if (log && log.topics.length > 1) {
        electionId = parseInt(log.topics[1], 16);
      }
    }

    return {
      txHash: receipt.transactionHash,
      electionId
    };
  }





  async updateElection(electionId: number, name: string, startDate: number, endDate: number, domainFilter: string, email: string) {
    const tx = this.contract.methods.updateElection(electionId, name, startDate, endDate, domainFilter, email);
    return await this.sendTransaction(tx);
  }

  async closeElection(electionId: number) {
    const tx = this.contract.methods.closeElection(electionId);
    return await this.sendTransaction(tx);
  }

  async addCandidates(electionId: number, candidates: {name: string, position: string, platform: string, cdn: string, partylist: string}[]) {
    const tx = this.contract.methods.addCandidates(
      electionId,
      candidates.map(c => c.name),
      candidates.map(c => c.position),
      candidates.map(c => c.platform),
      candidates.map(c => c.cdn),
      candidates.map(c => c.partylist)
    );
    return await this.sendTransaction(tx);
  }

  async updateCandidate(electionId: number, candidateId: number, name: string, position: string, platform: string, cdn: string, partylist: string) {
    const tx = this.contract.methods.updateCandidate(electionId, candidateId, name, position, platform, cdn, partylist);
    return await this.sendTransaction(tx);
  }

  async deleteCandidate(electionId: number, candidateId: number) {
    const tx = this.contract.methods.deleteCandidate(electionId, candidateId);
    return await this.sendTransaction(tx);
  }

  async vote(electionId: number, candidateIds: number[], email: string) {
    const tx = this.contract.methods.vote(electionId, candidateIds, email);
    return await this.sendTransaction(tx);
  }

  /** ========= READ FUNCTIONS ========= */
  async getOwnedElections(email: string) {
    return await this.contract.methods.getOwnedElections(email).call();
  }

  async getOwnedElectionNames(email: string) {
    return await this.contract.methods.getOwnedElectionNames(email).call();
  }

  async getOwnedElectionIds(email: string) {
    return await this.contract.methods.getOwnedElectionIds(email).call();
  }

  async getElectionIdByName(name: string) {
    return await this.contract.methods.getElectionIdByName(name).call();
  }

  async getElectionResults(electionId: number) {
    return await this.contract.methods.getElectionResults(electionId).call();
  }

  async getElectionDetails(electionId: number) {
    return await this.contract.methods.getElectionDetails(electionId).call();
  }

  async getElectionCount(): Promise<number> {
    return await this.contract.methods.electionCount().call();
  }

  async getElectionCandidateCount(electionId: number) {
    return await this.contract.methods.getElectionCandidateCount(electionId).call();
  }

  async getElectionCandidate(electionId: number, candidateId: number) {
    const candidate = await this.contract.methods.getElectionCandidate(electionId, candidateId).call();
    return {
      name: candidate[0],
      position: candidate[1],
      platform: candidate[2],
      cdn: candidate[3],
      partylist: candidate[4],
      votes: candidate[5],
    };
  }

  async getElectionCandidates(electionId: number) {
    const result = await this.contract.methods.getElectionCandidates(electionId).call();
    return result[0].map((name: string, i: number) => ({
      name,
      position: result[1][i],
      platform: result[2][i],
      cdn: result[3][i],
      partylist: result[4][i],
    }));
  }

  async getCandidateIdByName(electionId: number, name: string) {
    return await this.contract.methods.getCandidateIdByName(electionId, name).call();
  }

  async isElectionOpen(electionId: number) {
    return await this.contract.methods.isElectionOpen(electionId).call();
  }
}
