import { Component } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [NgFor, NgIf, NgClass],
  templateUrl: './vote.component.html',
  styleUrl: './vote.component.css'
})
export class VoteComponent {
  partylists = [
    {
      id: 'party-innovation',
      name: 'Innovation Party',
      description: 'Tech-forward governance with transparency.',
      candidates: [
        { id: 'dy', name: 'jan dy', role: 'President' },
        { id: 'kev', name: 'kevin', role: 'Vice President' },
        { id: 'CJ', name: 'CJ', role: 'Secretary' },
      ],
    },
    {
      id: 'party-unity',
      name: 'Unity Party',
      description: 'Bringing communities together.',
      candidates: [
        { id: 'jeff', name: 'jeff', role: 'President' },
        { id: 'lord', name: 'lord', role: 'Vice President' },
        { id: 'lance', name: 'lance', role: 'Secretary' },
      ],
    },
  ];

  selectedPartyId: string | null = null;
  selectedCandidateId: string | null = null;
  lastVotedMessage = '';

  get selectedParty() {
    return this.partylists.find(p => p.id === this.selectedPartyId) ?? null;
  }

  get visibleCandidates() {
    return this.selectedParty?.candidates ?? [];
  }

  selectParty(partyId: string): void {
    this.selectedPartyId = partyId;
    this.selectedCandidateId = null;
    this.lastVotedMessage = '';
  }

  selectCandidate(candidateId: string): void {
    this.selectedCandidateId = candidateId;
    this.lastVotedMessage = '';
  }

  castVote(): void {
    const party = this.partylists.find(p => p.id === this.selectedPartyId);
    const candidate = party?.candidates.find(c => c.id === this.selectedCandidateId);
    if (party && candidate) {
      this.lastVotedMessage = `Vote queued: ${candidate.name} (${candidate.role}) — ${party.name}`;
    }
  }
}
