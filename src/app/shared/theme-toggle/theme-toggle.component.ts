import { Component, OnInit } from '@angular/core';
import { ThemeService } from '../../../core/theme.service';

@Component({
  selector: 'app-theme-toggle',
  templateUrl: './theme-toggle.component.html',
  styleUrls: ['./theme-toggle.component.css']
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
    this.isLightMode = !this.isLightMode;
  }
}