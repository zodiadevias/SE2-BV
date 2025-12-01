import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent { 

  history$: any[] = [];
  voteHistory$: any[] = [];
  email: any;
  role : any;
  constructor(public firebaseService: FirebaseService, public authService: AuthService, public router: Router) {
    this.firebaseService.getHistory().subscribe(data => {
      this.history$ = data;
    });
  }

  ngOnInit() {
    this.firebaseService.getHistory().subscribe(data => {
      this.history$ = data;
    });

    this.firebaseService.getVoteHistory().subscribe(data => {
      this.voteHistory$ = data;
    });

    this.authService.authState$.subscribe(user => {
      if (user) {
        this.email = user.email;
      }
    });

    this.authService.role$.subscribe(role => {
      if (role) {
        this.role = role;
        
      }
    });
  }

  

  openElection(electionId: number) {
    this.router.navigate(['user/vote', electionId]);
  }

  
  



}
