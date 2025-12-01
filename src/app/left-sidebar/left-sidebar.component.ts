import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { CommonModule } from '@angular/common';
import { AuthDialogComponent } from '../../modals/auth-dialog/auth-dialog.component';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-left-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './left-sidebar.component.html',
  styleUrl: './left-sidebar.component.css'
})
export class LeftSidebarComponent { 
  @Input() variant: 'organizer' | 'user' = 'organizer';
  openAuthDialog() {
    this.dialog.open(AuthDialogComponent, {
      width: '400px',
      panelClass: 'rounded-xl',
      disableClose: true,
      backdropClass: 'custom-dialog-backdrop'
    });
  }

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
        this.openAuthDialog();
      }
    });
  }

  ngDoCheck() {
    this.role$.subscribe(role => {
      if (role === 'organizer') {
        this.variant = 'organizer';
      } else {
        this.variant = 'user';
      }
    });
  }

  user$: Observable<User | null>;
  role$: Observable<string | null>;
  constructor(private authService: AuthService, private dialog: MatDialog, private router: Router) {
    this.user$ = this.authService.authState$;
    this.role$ = this.authService.role$;
  }
  async logout() {
    try{
      
      await this.authService.logout();
      
      console.log('Logged out!');
    }catch(err: any){
      console.log(err.message);
    }
    
  }
}
