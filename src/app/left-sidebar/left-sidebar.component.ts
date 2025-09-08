import { Component } from '@angular/core';
import { Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';
import { CommonModule } from '@angular/common';
import { AuthDialogComponent } from '../../modals/auth-dialog/auth-dialog.component';
import { MatDialog } from '@angular/material/dialog';

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
      disableClose: true
    });
  }

  ngOnInit() {
    this.authService.authState$.subscribe(user => {
      if(user) {
        console.log('Logged in as', user.email);
      } else {
        this.openAuthDialog();
      }
    });
  }

  user$: Observable<User | null>;
  constructor(private authService: AuthService, private dialog: MatDialog) {
    this.user$ = this.authService.authState$;
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
