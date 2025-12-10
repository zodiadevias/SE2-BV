import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../../services/backend.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { validateHorizontalPosition } from '@angular/cdk/overlay';
import { ActivatedRoute } from '@angular/router';
import { ChartConfiguration, ChartData } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [FormsModule, CommonModule, BaseChartDirective],
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
  
  // Chart data for live results grouped by position
  positionCharts: { position: string; chartData: ChartData<'bar'>; chartOptions: ChartConfiguration<'bar'>['options'] }[] = [];
  
  // Chart data for winners
  winnersChartData: ChartData<'bar'> | null = null;
  winnersChartOptions: ChartConfiguration<'bar'>['options'] = {};
  
  // Results grouped by position for progress bars
  resultsByPosition: { position: string; candidates: any[]; totalVotes: number }[] = [];
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
      }
    });

    // Get electionId from route params
    this.route.paramMap.subscribe(params => {
      const routeElectionId = params.get('electionId');
      if (routeElectionId) {
        this.electionId = routeElectionId;
        this.fetchResults();
        this.toggle = true; // Show results when coming from route
      } else {
        // If no route param, check if electionId is set from form
        if (this.electionId) {
          this.fetchResults();
        }
      }
    });
  }

  // All candidates results
  election: { results: any[], winners: any[] } = { results: [], winners: [] };

  constructor(private backendService: BackendService, private authService: AuthService, private route: ActivatedRoute) {
    this.user$ = this.authService.authState$;
    this.role$ = this.authService.role$;
  }



  async toggleResult() {
    // If we have an electionId, fetch the results
    if (this.electionId) {
      await this.fetchResults();
      this.toggle = true; // Show results
    } else {
      this.toggle = !this.toggle; // Toggle the form view
    }
  }

  async fetchResults() {
    if (!this.electionId) {
      return;
    }

    try {
      // Check if election is open
      await this.checkElectionOpen();

      // Fetch election results
      const res: any = await this.backendService.getElectionResults(Number(this.electionId));

      if (!res || res.length < 4) {
        console.error('Invalid results data:', res);
        this.election.results = [];
        this.election.winners = [];
        this.positionCharts = [];
        this.winnersChartData = null;
        return;
      }

      const names = res[0] || [];
      const positions = res[1] || [];
      const partylists = res[2] || [];
      const votes = (res[3] || []).map((v: string) => Number(v));

      // Fill all candidates results
      this.election.results = [];
      for (let i = 0; i < names.length; i++) {
        this.election.results.push({
          name: names[i],
          position: positions[i],
          partylist: partylists[i],
          votes: votes[i] || 0
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
      
      // Prepare chart data (for backward compatibility)
      this.prepareCharts();
      
      // Prepare progress bar data
      this.prepareProgressBars();
    } catch (error) {
      console.error('Error fetching results:', error);
      this.election.results = [];
      this.election.winners = [];
      this.positionCharts = [];
      this.winnersChartData = null;
      this.resultsByPosition = [];
    }
  }

  prepareCharts() {
    // Group results by position for live results
    const groupedByPosition: { [position: string]: any[] } = {};
    this.election.results.forEach(cand => {
      if (!groupedByPosition[cand.position]) {
        groupedByPosition[cand.position] = [];
      }
      groupedByPosition[cand.position].push(cand);
    });

    // Create chart for each position
    this.positionCharts = [];
    Object.keys(groupedByPosition).forEach(position => {
      const candidates = groupedByPosition[position];
      const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
      
      // Sort by votes descending
      candidates.sort((a, b) => b.votes - a.votes);
      
      const labels = candidates.map(c => c.name);
      const votesData = candidates.map(c => c.votes);
      const percentages = candidates.map(c => 
        totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : '0.0'
      );
      
      // Create colors - winner gets different color
      const backgroundColors = candidates.map((c, i) => 
        i === 0 ? 'rgba(46, 125, 50, 0.8)' : 'rgba(33, 150, 243, 0.8)'
      );
      const borderColors = candidates.map((c, i) => 
        i === 0 ? 'rgba(46, 125, 50, 1)' : 'rgba(33, 150, 243, 1)'
      );

      const chartData: ChartData<'bar'> = {
        labels: labels.map((label, i) => `${label} (${percentages[i]}%)`),
        datasets: [{
          label: 'Votes',
          data: votesData,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2
        }]
      };

      const chartOptions: ChartConfiguration<'bar'>['options'] = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                return `Votes: ${votesData[index]} (${percentages[index]}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      };

      this.positionCharts.push({
        position,
        chartData,
        chartOptions
      });
    });

    // Prepare winners chart
    if (this.election.winners.length > 0) {
      const winners = [...this.election.winners];
      
      // Sort by votes descending
      winners.sort((a, b) => b.votes - a.votes);
      
      const winnerLabels = winners.map(w => `${w.name} - ${w.position}`);
      const winnerVotes = winners.map(w => w.votes);
      // Calculate percentage based on total votes for each winner's position
      const winnerPercentages = winners.map(w => {
        const totalForPosition = this.getTotalVotesForPosition(w.position);
        return totalForPosition > 0 ? ((w.votes / totalForPosition) * 100).toFixed(1) : '0.0';
      });

      this.winnersChartData = {
        labels: winnerLabels.map((label, i) => `${label} (${winnerPercentages[i]}%)`),
        datasets: [{
          label: 'Votes',
          data: winnerVotes,
          backgroundColor: 'rgba(46, 125, 50, 0.8)',
          borderColor: 'rgba(46, 125, 50, 1)',
          borderWidth: 2
        }]
      };

      this.winnersChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const index = context.dataIndex;
                const winner = winners[index];
                return `${winner.position}: ${winnerVotes[index]} votes (${winnerPercentages[index]}%)`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      };
    }
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

  getTotalVotesForPosition(position: string): number {
    return this.election.results
      .filter(c => c.position === position)
      .reduce((sum, c) => sum + c.votes, 0);
  }

  prepareProgressBars() {
    // Group results by position
    const groupedByPosition: { [position: string]: any[] } = {};
    this.election.results.forEach(cand => {
      if (!groupedByPosition[cand.position]) {
        groupedByPosition[cand.position] = [];
      }
      groupedByPosition[cand.position].push(cand);
    });

    // Prepare data for progress bars
    this.resultsByPosition = [];
    Object.keys(groupedByPosition).forEach(position => {
      const candidates = groupedByPosition[position];
      const totalVotes = candidates.reduce((sum, c) => sum + c.votes, 0);
      
      // Sort by votes descending
      candidates.sort((a, b) => b.votes - a.votes);
      
      // Calculate percentage for each candidate
      const candidatesWithPercentage = candidates.map(c => ({
        ...c,
        percentage: totalVotes > 0 ? (c.votes / totalVotes) * 100 : 0
      }));
      
      this.resultsByPosition.push({
        position,
        candidates: candidatesWithPercentage,
        totalVotes
      });
    });
    
    // Sort positions by total votes (descending)
    this.resultsByPosition.sort((a, b) => b.totalVotes - a.totalVotes);
  }

  getWinnerPercentage(winner: any): number {
    const totalForPosition = this.getTotalVotesForPosition(winner.position);
    return totalForPosition > 0 ? (winner.votes / totalForPosition) * 100 : 0;
  }

}
