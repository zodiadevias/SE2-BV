import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../../services/backend.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { validateHorizontalPosition } from '@angular/cdk/overlay';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent {
  electionId: any;
  toggle = false;
  isClosing = false;
  isSubmitting = false;
  isOpen: any;
  closePrompt = false;
  email: any;
  variant = '';
  user$: Observable<User | null>;
  role$: Observable<string | null>;

  election: { results: any[]; winners: any[] } = { results: [], winners: [] };

  constructor(
    private backendService: BackendService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.user$ = this.authService.authState$;
    this.role$ = this.authService.role$;
  }

  ngOnInit() {
    this.authService.authState$.subscribe(user => {
      if (user) {
        this.role$.subscribe(role => {
          this.variant = role === 'organizer' ? 'organizer' : 'user';
        });
      }

      this.route.paramMap.subscribe(params => {
        this.electionId = params.get('electionId');
        if (this.electionId) this.toggleResult();
      });
    });
  }

  async toggleResult() {
    if (this.isSubmitting) return; // ⛔ Prevent double click
    this.isSubmitting = true;

    try {
      await this.checkElectionOpen();
      this.router.navigate(['user/result', this.electionId]);

      if (!this.toggle && this.electionId) {
        const res: any = await this.backendService.getElectionResults(Number(this.electionId));
        const names = res[0];
        const positions = res[1];
        const partylists = res[2];
        const votes = res[3].map((v: string) => Number(v));

        this.election.results = names.map((name: string, i: number) => ({
          name,
          position: positions[i],
          partylist: partylists[i],
          votes: votes[i],
        }));

        // Determine winners
        const winnersMap: Record<string, any> = {};
        for (const cand of this.election.results) {
          if (!winnersMap[cand.position] || cand.votes > winnersMap[cand.position].votes) {
            winnersMap[cand.position] = { ...cand };
          }
        }
        this.election.winners = Object.values(winnersMap);

        this.toggle = true;
      }
    } catch (err) {
      console.error('Error loading results:', err);
    } finally {
      this.isSubmitting = false; // ✅ Allow re-click
    }
  }

  async checkElectionOpen() {
    this.isOpen = await this.backendService.isElectionOpen(Number(this.electionId));
  }

  closeElection() {
    this.closePrompt = true;
  }

  async closeElectionConfirmed() {
    if (!this.electionId || this.isClosing) return; // ⛔ Prevent double click
    this.isClosing = true;

    try {
      await this.backendService.closeElection(Number(this.electionId));
      await this.checkElectionOpen();
      this.closePrompt = false;
    } catch (err) {
      console.error('Error closing election:', err);
    } finally {
      this.isClosing = false;
    }
  }

  closeElectionDenied() {
    this.closePrompt = false;
  }

  back() {
    this.toggle = false;
    this.election = { results: [], winners: [] };
    this.electionId = null;
    this.router.navigate(['user/result']);
  }

  ngOnDestroy() {
    this.electionId = null;
  }
}

