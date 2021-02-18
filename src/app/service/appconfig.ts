import { Injectable } from '@angular/core';

@Injectable()
export class AppConfig {
  config: any = {};

  constructor() {}

  /**
   * Get App Configuration
   * @description Get gloabal application configuralion.
   * @example
   * this.getConfig();
   */
  public getConfig(): any {
    return this.config;
  }

  /**
   * Set App Configuration
   * @description Set gloabal application configuralion.
   * @example
   * this.setConfig(data);
   */
  public setConfig(data: any): any {
    this.config = data;
  }
}
