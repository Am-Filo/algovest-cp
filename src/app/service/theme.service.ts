import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private themeSubscribers = [];
  constructor() {}

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

  public setTheme(theme: string): void {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('id', theme);
    this.callSubscribers(theme);
  }

  private callSubscribers(theme: string): void {
    this.themeSubscribers.forEach((obser) => {
      obser.next(theme);
    });
  }

  public subscribeAddress(): Observable<string> {
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
}
