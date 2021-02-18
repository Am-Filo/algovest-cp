import { Injectable } from '@angular/core';

/**
 * Get DOM Window
 * @description Add access to DOM window params.
 * @example
 * _window();
 * @returns any
 */
function _window(): any {
  return window;
}

@Injectable()
export class LocaleService {
  private localeCurrent: string;
  private localeBase = 'en';

  /**
   * Set Locale
   * @description Set a current locale in locale service.
   * @example
   * localService.locale('en');
   */
  set locale(value: string) {
    this.localeCurrent = value;
  }

  /**
   * Get Locale
   * @description Get a locale from locale service. By default return 'es-US'.
   * @example
   * console.log(localService.locale);
   * @returns string
   */
  get locale(): string {
    return this.localeCurrent || 'en-US';
  }

  /**
   * Get Native Window
   * @description Get a window access from _window function.
   * @example
   * console.log(localService.nativeWindow);
   */
  get nativeWindow(): any {
    return _window();
  }

  constructor() {
    try {
      if ((this.nativeWindow.navigator.language === null || this.nativeWindow.navigator.language === undefined) && this.nativeWindow.navigator.language !== '') {
        this.localeBase = this.nativeWindow.navigator.language;
      }
    } finally {
    }
    this.registerCulture(this.localeBase);
  }

  /**
   * Register New Culture
   * @description Set new application culture language and data style.
   * @example
   * localService.registerCulture('en-us');
   */
  public async registerCulture(culture: string): Promise<any> {
    if (!culture) {
      return;
    }
    switch (culture.toLowerCase()) {
      case 'en-us': {
        this.localeCurrent = 'en';
        break;
      }
      default: {
        this.localeCurrent = 'en-gb';
        break;
      }
    }
  }
}
