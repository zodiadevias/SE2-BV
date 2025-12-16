import { Component, OnInit, ViewChildren, QueryList } from '@angular/core'; 
import { CommonModule, NgFor } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service'; 
import { Router } from '@angular/router';

// --- NG2-CHARTS/CHART.JS IMPORTS ---
import { BaseChartDirective } from 'ng2-charts'; 
import { ChartConfiguration, ChartOptions, ChartType, ChartData } from 'chart.js'; 
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables); 
// ------------------------------------

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, CommonModule, BaseChartDirective], 
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {

  @ViewChildren(BaseChartDirective) charts!: QueryList<BaseChartDirective>; 

  // Raw data arrays...
  history$: any[] = [];
  voteHistory$: any[] = [];
  filteredHistory$: any[] = [];
  filteredVoteHistory$: any[] = [];

  // --- CHART PROPERTIES ---
  public lineChartData: ChartData<'line'> = { datasets: [] }; 
  public lineChartOptions: ChartOptions<'line'> = { responsive: true, scales: { y: { beginAtZero: true } } };
  public lineChartType: 'line' = 'line'; 
  
  public voterBarChartData: ChartData<'bar'> = { datasets: [] }; 
  public voterBarChartOptions: ChartOptions<'bar'> = { responsive: true, scales: { y: { beginAtZero: true } } };
  public voterBarChartType: 'bar' = 'bar'; 

  public barChartData: ChartData<'bar'> = { datasets: [] }; 
  public barChartOptions: ChartOptions<'bar'> = { responsive: true, scales: { y: { beginAtZero: true } } };
  public barChartType: 'bar' = 'bar'; 

  public organizerLineChartData: ChartData<'line'> = { datasets: [] }; 
  public organizerLineChartOptions: ChartOptions<'line'> = { responsive: true, scales: { y: { beginAtZero: true } } };
  public organizerLineChartType: 'line' = 'line'; 
  
  email: string | null = null;
  role: any;

  constructor(
    public firebaseService: FirebaseService, 
    public authService: AuthService, 
    public router: Router
  ) {}

  ngOnInit() {
    // Rely on data subscriptions to trigger filterData when data arrives

    this.authService.authState$.subscribe(user => {
      this.email = user ? user.email : null;
      this.filterData(); // Trigger data processing whenever email status changes
    });

    this.authService.role$.subscribe(role => {
      this.role = role;
      this.filterData(); // Trigger data processing whenever role changes
    });

    this.firebaseService.getHistory().subscribe(data => {
      this.history$ = data;
      this.filterData(); // Trigger data processing when history data arrives
    });

    this.firebaseService.getVoteHistory().subscribe(data => {
      this.voteHistory$ = data;
      this.filterData(); // Trigger data processing when vote history data arrives
    });
  }

  filterData() {
    
    const needsVoterData = this.role === 'voter' && this.voteHistory$.length > 0;
    const needsOrganizerData = this.role === 'organizer' && this.history$.length > 0;
    const isReady = (needsVoterData || needsOrganizerData) && this.email !== null && this.role !== undefined;

    if (!isReady) {
      // Reset chart data if we are not ready to draw (e.g., waiting for data)
      this.lineChartData = { datasets: [] };
      this.voterBarChartData = { datasets: [] };
      this.barChartData = { datasets: [] };
      this.organizerLineChartData = { datasets: [] }; 
      this.updateCharts();
      return;
    }

    this.filteredHistory$ = this.history$.filter(item => item.email === this.email);
    this.filteredVoteHistory$ = this.voteHistory$.filter(item => item.email === this.email);
    
    // Proceed only if we have filtered data relevant to the user's role
    if (
        (this.role === 'voter' && this.filteredVoteHistory$.length > 0) ||
        (this.role === 'organizer' && this.filteredHistory$.length > 0)
    ) {
        this.prepareChartData();
        this.updateCharts();
    }
  }

  prepareChartData() {
    if (this.role === 'voter' && this.filteredVoteHistory$.length > 0) {
        
        // --- 1. Voter Line Chart (Votes Over Time) ---
        const votesByMonth: { [key: string]: number } = this.filteredVoteHistory$.reduce((acc: { [key: string]: number }, item) => {
            const date = new Date(item.date);
            const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            acc[monthYear] = (acc[monthYear] || 0) + 1;
            return acc;
        }, {});

        const sortedMonths = Object.keys(votesByMonth).sort((a: string, b: string) => {
            return new Date(a).getTime() - new Date(b).getTime();
        });

        const dataPointsLine = sortedMonths.map(month => votesByMonth[month]);

        // --- 2. Voter Bar Chart (Elections Participation) ---
        const votesByElection: { [key: string]: number } = this.filteredVoteHistory$.reduce((acc: { [key: string]: number }, item) => {
            const electionName = item.electionName || 'Unknown Election';
            acc[electionName] = (acc[electionName] || 0) + 1;
            return acc;
        }, {});
        
        const electionNames = Object.keys(votesByElection);
        const dataPointsBar = electionNames.map(key => votesByElection[key]);

        this.lineChartData = {
          labels: sortedMonths,
          datasets: [
            { data: dataPointsLine, label: 'Votes Cast', fill: true, tension: 0.5, borderColor: 'rgba(54, 162, 235, 1)' }
          ]
        };

        this.voterBarChartData = {
            labels: electionNames,
            datasets: [{ 
                data: dataPointsBar, 
                label: 'Times Voted',
                backgroundColor: 'rgba(54, 162, 235, 0.6)'
            }]
        };

    } else if (this.role === 'organizer' && this.filteredHistory$.length > 0) {
      
      // --- Organizer Data Processing (Shared data source) ---
      const activityVolume: { [key: string]: number } = this.filteredHistory$.reduce((acc: { [key: string]: number }, item) => {
          const eventName = item.name || 'Unknown Event'; 
          acc[eventName] = (acc[eventName] || 0) + 1;
          return acc;
      }, {});
      
      const eventNames = Object.keys(activityVolume);
      const dataPoints = eventNames.map(key => activityVolume[key]);

      // --- 3a. Organizer Bar Chart (Activity Volume) ---
      this.barChartData = {
        labels: eventNames,
        datasets: [
          { 
            data: dataPoints, 
            label: 'Events Count',
            backgroundColor: 'rgba(75, 192, 192, 0.6)'
          }
        ]
      };
      
      // --- 3b. Organizer Line Chart (Activity Trend) ---
      this.organizerLineChartData = {
        labels: eventNames,
        datasets: [
          { 
            data: dataPoints, 
            label: 'Activity Trend', 
            tension: 0.4, 
            borderColor: 'rgba(255, 159, 64, 1)',
            fill: false
          }
        ]
      };
    }
  }

  // --- CHART UPDATE METHOD ---
  updateCharts() {
    setTimeout(() => {
      if (this.charts) {
        this.charts.forEach(chart => {
          if (chart.chart) {
            chart.chart.update();
          }
        });
      }
    }, 50); 
  }
  // ---------------------------

  openElection(electionId: number) {
    this.router.navigate(['user/vote', electionId]);
  }
}