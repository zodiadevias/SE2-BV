import { Component } from '@angular/core';
import { NgFor, NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth.service';
import { FirebaseService } from '../../../services/firebase.service';
import { BackendService } from '../../../services/backend.service';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [NgFor, NgIf, NgClass, FormsModule, DatePipe],
  templateUrl: './vote.component.html',
  styleUrl: './vote.component.css'
})
export class VoteComponent {
  constructor(
    private authService: AuthService,
    private firebaseService: FirebaseService,
    private backendService: BackendService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    
  }

  email: any;
  voting : number | null = null;
  electionId: any;
  election: any;
  role: any;

  ngOnInit() {
    this.authService.authState$.subscribe(user => {
      if (user) {
        this.email = user.email;
        this.authService.role$.subscribe(role => {
          if (role) {
            this.role = role;
            if (this.role === 'organizer') {
              this.voting = 0;
            }else if (this.role === 'voter') {
              this.route.paramMap.subscribe(params => {
                this.electionId = params.get('electionId');
                
                this.toggleVote();
                
              });
              this.voting = 2;
            }else{
              this.voting = 0;
            }
          }
        });
        
      }
    });

    
    
    
  }

  

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

    this.lastVotedMessage = `✅ Votes submitted successfully! TxHash: ${response.transactionHash}`;
    console.log("Vote response:", response);
  } catch (err: any) {
    console.error("Vote error:", err);
    this.lastVotedMessage = `❌ Error submitting votes: ${err.message}`;
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

errorMessage = '';

  async toggleVote() {
    this.errorMessage = '';
    this.election = await this.backendService.getElectionDetails(this.electionId);
    console.log(typeof(this.email) , typeof(this.election[5]));
    console.log("Election details:", this.election);
    if (this.election[0] == '' || this.election[0] == null) {
      this.errorMessage = "⚠️ Election not found.";
      return;
    }
    else if (this.email.includes(this.election[5]) == false) {
      this.errorMessage = "⚠️ You are not qualified to vote.";
      return;
    }
    await this.fetchCandidates();
    if(this.election){
      this.voting = 1;
      this.router.navigate(['user/vote/' + this.electionId]);
      this.errorMessage = '';
    }
  }


  back(){
    this.election = null;
    this.router.navigate(['user/vote']);
    this.errorMessage = '';
    this.voting = 2;
  }

  ngOnDestroy() {
    this.electionId = null;
  }
}