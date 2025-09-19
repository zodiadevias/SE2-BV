import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { FirebaseService } from '../../services/firebase.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [NgFor, CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent { 

  history$: any[] = [];
  email: any;
  constructor(public firebaseService: FirebaseService, public authService: AuthService) {}

  ngOnInit() {
    this.firebaseService.getHistory().subscribe(data => {
      this.history$ = data;
    });

    this.authService.authState$.subscribe(user => {
      if (user) {
        this.email = user.email;
      }
    });
  }



}
