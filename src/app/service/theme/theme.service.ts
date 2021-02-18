import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeSubscribers = [];
  constructor() {}

  /**
   * Get Theme
   * @description Get theme value from local storage but if it not exists get value from user os/browser prefers-color-scheme.
   * @example
   * themeService.getTheme();
   * @returns string
   */
  public getTheme(): string {
    const item = localStorage.getItem('theme');
    if (item) {
      return item;
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    } else {
      return 'white';
    }
  }

  /**
   * Set Theme
   * @description Set theme value in local storage and set new theme value in id attribute in html tag. Also trigger function callSubscribers to set new theme value.
   * @example
   * themeService.setTheme('white');
   */
  public setTheme(theme: string): void {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('id', theme);
    this.callSubscribers(theme);
  }

  /**
   * Subscribe On Theme
   * @description Create new subscriber on theme service.
   * @example
   * themeService.subscribeTheme().subscribe((theme: string) => {console.log('theme subscriber', theme);});
   * @returns Observabel<string>
   */
  public subscribeTheme(): Observable<string> {
    return new Observable((observer) => {
      this.themeSubscribers.push(observer);
      const allSubscribers = this.themeSubscribers;
      const th = this;
      return {
        unsubscribe(): void {
          th.themeSubscribers = allSubscribers.filter((exObs) => {
            return exObs !== observer;
          });
        },
      };
    });
  }

  /**
   * Call Theme Subscribers
   * @description Trigger all subscribers to update theme value.
   * @example
   * themeService.callSubscribers('white');
   */
  private callSubscribers(theme: string): void {
    this.themeSubscribers.forEach((obser) => {
      obser.next(theme);
    });
  }
}
