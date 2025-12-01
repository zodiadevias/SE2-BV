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

  isSubmitting = false;


  // Final submit all votes
async submitVotes(): Promise<void> {
  if (this.isSubmitting) return; // Prevent double click
  this.isSubmitting = true;

  if (!this.electionId) {
    this.lastVotedMessage = "⚠️ Election ID not set.";
    this.isSubmitting = false;
    return;
  }

  const candidateIds: number[] = [];
  const votes = this.candidatesByPosition.map(pos => {
    const candidateId = this.selectedCandidates[pos.id];
    const candidate = pos.candidates.find((c: { id: string }) => c.id === candidateId);
    if (candidate) {
      candidateIds.push(Number(candidate.id));
    }
    return {
      position: pos.name,
      candidate: candidate?.name ?? null,
    };
  });

  if (votes.some(v => v.candidate === null)) {
    this.lastVotedMessage = "⚠️ Please choose a candidate for every position before submitting.";
    this.isSubmitting = false;
    return;
  }

  try {
    const response = await this.backendService.vote(this.electionId, candidateIds, this.email);
    await this.firebaseService.addVoteHistory(
      this.email,
      this.electionId,
      this.election[0],
      response.transactionHash,
      new Date()
    );

    this.lastVotedMessage = `✅ Votes submitted successfully! TxHash: ${response.transactionHash}`;
    console.log("Vote response:", response);
  } catch (err: any) {
    console.error("Vote error:", err);
    this.lastVotedMessage = `❌ Error submitting votes: ${err.message}`;
  } finally {
    this.isSubmitting = false; // Re-enable after completion
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

    try {
      // 1. Fetch details
      this.election = await this.backendService.getElectionDetails(this.electionId);
      console.log("Raw Election Data:", this.election);

      // 2. Validation: Check if election exists
      if (!this.election || !this.election[0]) {
        this.errorMessage = "⚠️ Election not found.";
        return;
      }

      // 3. Validation: Check if manually closed
      if (String(this.election[1]) === "false") {
        this.errorMessage = "⚠️ Election is closed.";
        return;
      }

      // --- DATE FIX START ---
      const now = new Date().getTime(); // Current time in Milliseconds

      // Parse the string "2025-12-03T11:04" into milliseconds
      const startTime = new Date(this.election[3]).getTime();
      const endTime = new Date(this.election[4]).getTime();

      console.log("Parsed Dates:", {
          serverString: this.election[3],
          parsedStart: new Date(startTime),
          parsedEnd: new Date(endTime),
          now: new Date(now)
      });

      // Check if the date string was invalid (e.g. empty or malformed)
      if (isNaN(startTime) || isNaN(endTime)) {
          this.errorMessage = "⚠️ Election data contains invalid dates.";
          console.error("Date parsing failed. Check if format matches 'YYYY-MM-DDTHH:mm'");
          return;
      }

      if (startTime > now) {
        this.errorMessage = "⚠️ Election has not started yet.";
        return;
      }

      if (endTime < now) {
        this.errorMessage = "⚠️ Election has ended.";
        return;
      }
      // --- DATE FIX END ---

      // 4. Validation: Check Domain Qualification
      const userEmail = this.email ? this.email.toLowerCase() : '';
      const allowedDomain = this.election[5] ? String(this.election[5]).toLowerCase() : '';

      if (allowedDomain && allowedDomain !== 'public' && !userEmail.includes(allowedDomain)) {
        this.errorMessage = "⚠️ You are not qualified to vote.";
        return;
      }

      // 5. Success: Navigate
      await this.fetchCandidates();
      if (this.election) {
        this.voting = 1;
        this.router.navigate(['user/vote/' + this.electionId]);
        this.errorMessage = '';
      }

    } catch (error) {
      console.error("Error in toggleVote:", error);
      
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