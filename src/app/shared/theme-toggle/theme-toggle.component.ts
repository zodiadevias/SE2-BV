import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../core/theme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.css'],
  imports: [CommonModule]
})
export class ThemeToggleComponent implements OnInit {
  isLightMode: boolean = false;

  constructor(private themeService: ThemeService) { }

  ngOnInit(): void {
    // Initialize the toggle state based on the loaded theme
    this.isLightMode = this.themeService.getCurrentTheme() === 'light';
  }

  onToggle(): void {
    this.themeService.toggleTheme();
    // Re-fetch the truth from the service to ensure sync
    this.isLightMode = this.themeService.getCurrentTheme() === 'light';
  }
}