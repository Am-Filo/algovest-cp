import { Component } from '@angular/core';
import { ThemeService } from './service/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  public theme = 'white';
  public themeDark = false;

  constructor(private themeProvider: ThemeService) {
    this.detectColorScheme();
  }

  private detectColorScheme(): any {
    this.theme = this.themeProvider.getTheme();
    document.documentElement.setAttribute(
      'id',
      this.theme === 'dark' ? 'dark' : 'white'
    );
    this.themeDark = this.theme === 'dark';

    this.themeProvider
      .subscribeAddress()
      .subscribe((theme) => (this.theme = theme));
  }

  public toggleColorScheme(): any {
    this.themeProvider.setTheme(this.theme === 'dark' ? 'white' : 'dark');
  }
}
