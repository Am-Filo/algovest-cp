import { Injectable } from '@angular/core';

@Injectable()
export class AppConfig {
  config: any = {};

  constructor() {}

  public getConfig(): any {
    return this.config;
  }

  public setConfig(data: any): any {
    this.config = data;
  }
}
