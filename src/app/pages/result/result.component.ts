import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackendService } from '../../../services/backend.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-result',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.css']
})
export class ResultComponent implements OnInit, OnDestroy {
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

  // Properties to hold formatted election details
  allowedDomains: string = '';
  startDate: string = '';
  endDate: string = '';
  currentDateTime: string = '';
  electionStatus: string = 'N/A'; // Initialize to N/A

  election: { results: any[]; winners: any[] } = { results: [], winners: [] };
  electionDetails: any;
  
  // Property to store the interval ID
  private timerSubscription: any;

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

    // Start updating the current time immediately and then every second
    this.updateCurrentDateTime();
    // Use an interval to continuously update time and status
    this.timerSubscription = setInterval(() => {
        this.updateCurrentDateTime();
        // Only check status if election details have been successfully loaded
        if (this.electionDetails) {
             this.determineElectionStatus();
        }
    }, 1000); // 1000 milliseconds = 1 second
  }

  ngOnDestroy() {
    // IMPORTANT: Clear the interval when the component is destroyed to prevent memory leaks
    if (this.timerSubscription) {
        clearInterval(this.timerSubscription);
    }
    this.electionId = null;
  }

  // Function to update the current time property
  private updateCurrentDateTime() {
    this.currentDateTime = this.formatDate(new Date());
  }
  
  // Helper function to determine and set the election status
  private determineElectionStatus() {
    // [0: id, 1: isOpen (string 'true'/'false'), 2: name, 3: startDate, 4: endDate, 5: allowedDomains]
    
    const now = Date.now();
    
    // FIX: Create Date objects directly from the ISO string input
    const startDateObj = new Date(this.electionDetails[3]);
    const endDateObj = new Date(this.electionDetails[4]);
    
    // Get the millisecond timestamp from the parsed Date objects
    const startDateTimestamp = startDateObj.getTime();
    const endDateTimestamp = endDateObj.getTime();
    
    // Safety check in case the string format is unexpected
    if (isNaN(startDateTimestamp) || isNaN(endDateTimestamp)) {
        this.electionStatus = 'Date Parse Error';
        this.isOpen = false;
        console.error("Date parsing failed. Check raw date string format:", this.electionDetails[3], this.electionDetails[4]);
        return;
    }

    const isOpenString = String(this.electionDetails[1]).toLowerCase();

    // Default status to closed and then refine based on time
    this.electionStatus = 'Closed';
    this.isOpen = false;

    console.log("DEBUG: Now:", now, "Start MS:", startDateTimestamp, "End MS:", endDateTimestamp);
    
    // 1. Check for Ongoing (Must be after start AND before or at end)
    if (now >= startDateTimestamp && now <= endDateTimestamp) {
        this.electionStatus = 'Ongoing';
        this.isOpen = true;
    } 
    // 2. Check for Upcoming (Must be before start date)
    else if (now < startDateTimestamp) {
        this.electionStatus = 'Upcoming';
        this.isOpen = false;
    }
    
    // 3. Check for Manual Closure (Overrides status regardless of time if the backend flag is false)
    if (isOpenString === 'false') {
        this.electionStatus = 'Closed (Manually Closed)';
        this.isOpen = false;
    }
  }

  // Helper function to format date/timestamp
  private formatDate(dateInput: Date | number | string | undefined): string {
    if (!dateInput) return 'N/A';
    try {
        // FIX: Pass the raw string/number directly to new Date() for parsing
        const date = new Date(dateInput); 
        
        if (isNaN(date.getTime())) {
            return 'Invalid Date (NaN)';
        }
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true,
        });
    } catch (e) {
        return 'N/A';
    }
  }

  async toggleResult() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    try {
      // Fetch Election Details
      this.electionDetails = await this.backendService.getElectionDetails(Number(this.electionId));
      
      console.log("Election details:", this.electionDetails);
      
      // LOGGING RAW TIMESTAMPS FOR DEBUGGING 
      const rawStartDate = this.electionDetails ? this.electionDetails[3] : 'N/A';
      const rawEndDate = this.electionDetails ? this.electionDetails[4] : 'N/A';
      console.log(`DEBUG: Raw Start Date: ${rawStartDate} (Type: ${typeof rawStartDate})`);
      console.log(`DEBUG: Raw End Date: ${rawEndDate} (Type: ${typeof rawEndDate})`);
      console.log(`DEBUG: Current JS Date.now(): ${Date.now()}`);


      // Populate static details properties
      if (this.electionDetails) {
        // Accessing array elements based on your provided logic
        this.allowedDomains = Array.isArray(this.electionDetails[5])
          ? this.electionDetails[5].join(', ')
          : this.electionDetails[5] || 'N/A';

        // FIX: Pass the raw date string directly to formatDate
        this.startDate = this.formatDate(this.electionDetails[3]); 
        this.endDate = this.formatDate(this.electionDetails[4]);   
        
        // Determine status and set this.isOpen based on current time
        this.determineElectionStatus();
        
      } else {
        this.allowedDomains = 'N/A';
        this.startDate = 'N/A';
        this.endDate = 'N/A';
        this.electionStatus = 'N/A';
        this.isOpen = false;
      }
      
      // Fetch results only if the toggle is off and an ID is present
      if (!this.toggle && this.electionId) {
        const res: any = await this.backendService.getElectionResults(Number(this.electionId));
        const names = res[0];
        const positions = res[1];
        const partylists = res[2];
        const votes = res[3].map((v: string) => Number(v));

        // 1. Create a temporary array of objects
        const tempResults = names.map((name: string, i: number) => ({
          name,
          position: positions[i],
          partylist: partylists[i],
          votes: votes[i],
        }));

        // 2. Calculate Total Votes per Position
        const votesPerPosition: Record<string, number> = {};
        tempResults.forEach((cand: any) => {
          if (!votesPerPosition[cand.position]) {
            votesPerPosition[cand.position] = 0;
          }
          votesPerPosition[cand.position] += cand.votes;
        });

        // 3. Assign Percentage to each candidate
        this.election.results = tempResults.map((cand: any) => {
          const total = votesPerPosition[cand.position];
          const percentage = total > 0 ? ((cand.votes / total) * 100).toFixed(2) : '0.00';

          return {
            ...cand,
            percentage
          };
        });

        // Determine winners logic
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
      this.isSubmitting = false;
    }
  }

  // checkElectionOpen is redundant due to determineElectionStatus, but remains defined
  async checkElectionOpen() {
     // Logic now fully handled by determineElectionStatus()
  }


  closeElection() {
    this.closePrompt = true;
  }

  async closeElectionConfirmed() {
    if (!this.electionId || this.isClosing) return;
    this.isClosing = true;

    try {
      await this.backendService.closeElection(Number(this.electionId));
      // After closing, mock the change in election details and re-run status check
      if (this.electionDetails) {
         this.electionDetails[1] = 'false'; // Mock the change from backend (isOpen state)
         this.determineElectionStatus();
      }
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
}