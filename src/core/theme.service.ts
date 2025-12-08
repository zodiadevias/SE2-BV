import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private currentTheme: 'dark' | 'light' = 'dark';
  private readonly STORAGE_KEY = 'user-theme';

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
      this.currentTheme = prefersDark ? 'dark' : 'light';
    }

    this.applyTheme(this.currentTheme);
  }

  /**
   * Applies the theme class to the document body.
   */
  private applyTheme(theme: 'dark' | 'light'): void {
    if (theme === 'light') {
      this.renderer.addClass(document.body, 'light-theme');
    } else {
      this.renderer.removeClass(document.body, 'light-theme');
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