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
  submitVotes(): void {
    const votes = this.candidatesByPosition.map(pos => {
      const candidateId = this.selectedCandidates[pos.id];
      return {
        position: pos.name,
        candidate: pos?.candidates.find((c: { id: string }) => c.id === this.selectedCandidates[pos.id])?.name ?? null
      };
    });

    if (votes.some(v => v.candidate === null)) {
      this.lastVotedMessage = '⚠️ Please choose a candidate for every position before submitting.';
      return;
    }

    // 👉 Later: call backendService.castVotes(this.electionId, votes)
    this.lastVotedMessage = `✅ Votes submitted:\n${votes
      .map(v => `${v.position}: ${v.candidate}`)
      .join(', ')}`;


    console.log(votes);

    //todo:
    // get all candidate ids by name
    // call backendService.castVotes(this.electionId, votes)
  }

  async fetchCandidates() {
    const result = await this.backendService.getElectionCandidates(this.electionId-1);
    const names = result[0];
    const positions = result[1];
    const platforms = result[2];
    const cdns = result[3];
    const partylists = result[4];

    const grouped: { [pos: string]: any } = {};

    for (let i = 0; i < names.length; i++) {
      const position = positions[i];

      if (!grouped[position]) {
        grouped[position] = {
          id: position.toLowerCase().replace(/\s+/g, '-'),
          name: position,
          description: `Candidates for ${position}`,
          candidates: []
        };
      }

      grouped[position].candidates.push({
        id: `cand-${i}`,
        name: names[i],
        position: positions[i],
        platform: platforms[i],
        cdn: cdns[i],
        partylist: partylists[i]
      });
    }

    this.candidatesByPosition = Object.values(grouped);

    // reset selections
    this.selectedCandidates = {};
    this.candidatesByPosition.forEach(pos => {
      this.selectedCandidates[pos.id] = null;
    });

    console.log('Grouped Candidates:', this.candidatesByPosition);
  }

  async toggleVote() {
    this.election = await this.backendService.getElectionDetails(this.electionId);
    await this.fetchCandidates();
    this.voting = !this.voting;
  }
}
