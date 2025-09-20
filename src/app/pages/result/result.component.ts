import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../../services/backend.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent {
  electionId: string = '';
  toggle: boolean = false;

  // All candidates results
  election: { results: any[], winners: any[] } = { results: [], winners: [] };

  constructor(private backendService: BackendService) {}

  async toggleResult() {
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
}
