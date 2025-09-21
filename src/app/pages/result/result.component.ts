import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../../services/backend.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { validateHorizontalPosition } from '@angular/cdk/overlay';
@Component({
  selector: 'app-result',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent {
  electionId: any;
  toggle: boolean = false;

  isOpen: any;

  email: any;
  variant: string = '';
  user$: Observable<User | null>;
  role$: Observable<string | null>;
  ngOnInit() {
    this.authService.authState$.subscribe(user => {
      if(user) {
        console.log('Logged in as', user.email);
        this.role$.subscribe(role => {
          if (role === 'organizer') {
            this.variant = 'organizer';
          } else {
            this.variant = 'user';
          }
        });
      } else {
        
      }
    });
  }

  // All candidates results
  election: { results: any[], winners: any[] } = { results: [], winners: [] };

  constructor(private backendService: BackendService, private authService: AuthService) {
    this.user$ = this.authService.authState$;
    this.role$ = this.authService.role$;
  }



  async toggleResult() {
    this.checkElectionOpen();
    if (!this.toggle && this.electionId) {
      const res: any = await this.backendService.getElectionResults(Number(this.electionId));

      const names = res[0];
      const positions = res[1];
      const partylists = res[2];
      const votes = res[3].map((v: string) => Number(v));

      // Fill all candidates results
      this.election.results = [];
      for (let i = 0; i < names.length; i++) {
        this.election.results.push({
          name: names[i],
          position: positions[i],
          partylist: partylists[i],
          votes: votes[i]
        });
      }

      // Calculate winners per position
      const winnersMap: { [position: string]: any } = {};
      for (const cand of this.election.results) {
        if (!winnersMap[cand.position] || cand.votes > winnersMap[cand.position].votes) {
          winnersMap[cand.position] = { ...cand };
        }
      }
      this.election.winners = Object.values(winnersMap);
    }

    this.toggle = !this.toggle;
  }




  async checkElectionOpen() {
    
      this.isOpen = await this.backendService.isElectionOpen(Number(this.electionId));
      console.log(this.isOpen);
    
  }


  closeElection() {
    if (this.electionId) {
      const confirm = window.confirm('Are you sure you want to close the election?');
      if (confirm) {
        this.backendService.closeElection(Number(this.electionId));
        this.checkElectionOpen();
      }
    }
  }



}
