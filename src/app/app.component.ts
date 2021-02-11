import { Component } from '@angular/core';
import { ThemeService } from './service/theme/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public theme = 'white';
  public themeDark = false;

  public daySelect = false;
  public daySelected = 15;
  public days = [10, 15, 20, 30, 40, 50];

  constructor(private themeProvider: ThemeService) {
    this.detectColorScheme();
  }

  private detectColorScheme(): any {
    this.theme = this.themeProvider.getTheme();
    document.documentElement.setAttribute('id', this.theme === 'dark' ? 'dark' : 'white');
    this.themeDark = this.theme === 'dark';

    this.themeProvider.subscribeAddress().subscribe((theme) => (this.theme = theme));
  }

  public toggleColorScheme(): any {
    this.themeProvider.setTheme(this.theme === 'dark' ? 'white' : 'dark');
  }

  public selectDay(day: number): any {
    this.daySelect = false;
    this.daySelected = day;
  }
}
