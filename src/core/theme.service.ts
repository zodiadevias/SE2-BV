import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentTheme: 'dark' | 'light' = 'dark'; // Initial state can be 'light' if you prefer, but loadTheme handles it.
  private readonly STORAGE_KEY = 'user-theme';
  private readonly DARK_CLASS = 'dark-theme'; // Define the class name used in CSS

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
    this.loadTheme();
  }

  /**
   * Loads theme preference from local storage on startup.
   */
  private loadTheme(): void {
    const savedTheme = localStorage.getItem(this.STORAGE_KEY) as 'dark' | 'light';

    if (savedTheme) {
      this.currentTheme = savedTheme;
    } else {
      // Check OS preference (prefers-color-scheme) as a default fallback
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      // If OS prefers dark, set it to dark, otherwise default to light (our CSS default)
      this.currentTheme = prefersDark ? 'dark' : 'light';
    }

    this.applyTheme(this.currentTheme);
  }

  /**
   * Applies the theme class to the document body.
   * *** UPDATED to manage the 'dark-theme' class based on the final CSS structure. ***
   */
  private applyTheme(theme: 'dark' | 'light'): void {
    if (theme === 'dark') {
      // Apply the dark-theme class to switch from the default Light Mode
      this.renderer.addClass(document.body, this.DARK_CLASS);
    } else {
      // Remove the dark-theme class to fall back to the default Light Mode
      this.renderer.removeClass(document.body, this.DARK_CLASS);
    }
  }

  /**
   * Public method to toggle the theme.
   */
  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(this.STORAGE_KEY, this.currentTheme);
    this.applyTheme(this.currentTheme);
  }

  /**
   * Public method to get the current theme state.
   */
  getCurrentTheme(): 'dark' | 'light' {
    return this.currentTheme;
  }
}