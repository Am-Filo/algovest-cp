import { Injectable } from '@angular/core';

function _window(): any {
  return window;
}

@Injectable()
export class LocaleService {
  private localeCurrent: string;
  private localeBase = 'en';

  set locale(value: string) {
    this.localeCurrent = value;
  }
  get locale(): string {
    return this.localeCurrent || 'en-US';
  }
  get nativeWindow(): any {
    return _window();
  }

  constructor() {
    try {
      if (
        (this.nativeWindow.navigator.language === null ||
          this.nativeWindow.navigator.language === undefined) &&
        this.nativeWindow.navigator.language !== ''
      ) {
        this.localeBase = this.nativeWindow.navigator.language;
      }
    } finally {
    }
    this.registerCulture(this.localeBase);
  }

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
