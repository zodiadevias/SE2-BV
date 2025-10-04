import { Component, HostListener, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LeftSidebarComponent } from '../left-sidebar/left-sidebar.component';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [RouterOutlet, LeftSidebarComponent],
  templateUrl: './user.component.html',
  styleUrl: './user.component.css'
})
export class UserComponent implements OnInit {
  currentYear = new Date().getFullYear();
  isMobile = false;
  mobileMenuOpen = false;

  ngOnInit() {
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  checkScreenSize() {
    this.isMobile = window.innerWidth <= 768;
    if (!this.isMobile) {
      this.mobileMenuOpen = false;
    }
  }

  toggleMobileMenu() {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu() {
    if (this.isMobile) {
      this.mobileMenuOpen = false;
    }
  }
}
