import { Component } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';
import { BackendService } from '../../../services/backend.service';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule],
  templateUrl: './vote.component.html',
  styleUrl: './vote.component.css'
})
export class VoteComponent {
  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private backendService: BackendService
  ) {}

  email: any;

  ngOnInit() {
    this.authService.authState$.subscribe(user => {
      if (user) {
        this.email = user.email;
      }
    });
    
  }

  voting = false;
  electionId: any;
  election: any;

  candidatesByPosition: any[] = [];

  // track chosen candidate per position
  selectedCandidates: { [positionId: string]: string | null } = {};

  lastVotedMessage = '';

  get selectedPosition() {
    return this.candidatesByPosition.find(p => p.id === this.selectedPositionId) ?? null;
  }

  get visibleCandidates() {
    return this.selectedPosition?.candidates ?? [];
  }

  selectedPositionId: string | null = null;

  selectPosition(positionId: string): void {
    this.selectedPositionId = positionId;
    this.lastVotedMessage = '';
  }

  selectCandidate(positionId: string, candidateId: string): void {
    this.selectedCandidates[positionId] = candidateId;
    this.lastVotedMessage = '';
  }

  // Final submit all votes
async submitVotes(): Promise<void> {
  if (!this.electionId) {
    this.lastVotedMessage = "⚠️ Election ID not set.";
    return;
  }

  // build candidate IDs array
  const candidateIds: number[] = [];
  const votes = this.candidatesByPosition.map(pos => {
    const candidateId = this.selectedCandidates[pos.id];
    const candidate = pos.candidates.find((c: { id: string }) => c.id === candidateId);
    if (candidate) {
      candidateIds.push(Number(candidate.id)); // Solidity expects uint256[]
    }
    return {
      position: pos.name,
      candidate: candidate?.name ?? null,
    };
  });

  // check if any missing selections
  if (votes.some(v => v.candidate === null)) {
    this.lastVotedMessage =
      "⚠️ Please choose a candidate for every position before submitting.";
    return;
  }

  try {
    
    const response = await this.backendService.vote(this.electionId, candidateIds, this.email);

    this.lastVotedMessage = `✅ Votes submitted successfully! TxHash: ${response.txHash}`;
    console.log("Vote response:", response);
  } catch (err: any) {
    console.error("Vote error:", err);
    this.lastVotedMessage = `❌ Error submitting votes: ${err.response.data.error || err}`;
  }
}


  async fetchCandidates() {
  try {
    // get all candidates for election
    const candidates = await this.backendService.getElectionCandidates(this.electionId);
    const countRes = await this.backendService.getElectionCandidateCount(this.electionId);

    console.log("Fetched candidates:", candidates);
    console.log("Candidate count:", countRes.candidateCount);

    // group candidates by position
    const grouped: { [pos: string]: any[] } = {};
    candidates.forEach((c: any, index: number) => {
      const pos = c.position || "Unknown";
      if (!grouped[pos]) grouped[pos] = [];
      grouped[pos].push({
        id: String(index + 1), // 1-based index (matches Solidity storage)
        ...c
      });
    });

    // convert into array for easier template iteration
    this.candidatesByPosition = Object.keys(grouped).map(pos => ({
      id: pos,        // use position name as id
      name: pos,
      candidates: grouped[pos]
    }));

    // auto-select first position
    if (this.candidatesByPosition.length > 0) {
      this.selectedPositionId = this.candidatesByPosition[0].id;
    }

  } catch (err) {
    console.error("Error fetching candidates:", err);
  }
}


  async toggleVote() {
    this.election = await this.backendService.getElectionDetails(this.electionId);
    await this.fetchCandidates();
    this.voting = !this.voting;
  }
}