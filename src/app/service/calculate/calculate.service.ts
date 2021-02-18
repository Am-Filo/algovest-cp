import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CalculateService {
  /**
   * Get Integer With Suffix
   * @description Get changed integaer value with suffix. Triggered getFloatWithSuffix function.
   * @example
   * calculate.getIntegerWithSuffix(1000000).then((value: string) => {console.log('value = 1M', value);});
   * @returns value: string
   */
  public static getIntegerWithSuffix(value: number): string {
    return CalculateService.getFloatWithSuffix(value, 0);
  }

  /**
   * Get Float With Suffix
   * @description Get changed float value with suffix. You can set fixed param to get float after dot. EX. with fixed 1: 10.3K.
   * @example
   * calculate.getFloatWithSuffix(1100000,1,'short').then((value: string) => {console.log('value = 1.1M', value);});
   * @returns value: string
   */
  public static getFloatWithSuffix(value: number, fixed: number, type?: string): string {
    const originalValue = value;
    const suffixesTemplate = { short: ['', 'K', 'M', 'B'], full: ['', ' thousand', ' million', ' billion'] };
    const suffixes = suffixesTemplate[type || 'short'];
    let iterations = 0;
    while (value) {
      value = Math.floor(value / 1000);
      if (value) {
        iterations++;
      }
    }
    return (originalValue / Math.pow(1000, iterations)).toFixed(fixed) + suffixes[iterations];
  }

  /**
   * Get Small Float With Suffix
   * @description Get changed float value with suffix. You can set fixed param to get float after dot. EX. with fixed 1: 10.3K.
   * @example
   * calculate.getSmallFloatWithSuffix(1100000,1,'short').then((value: string) => {console.log('value = 1.1M', value);});
   * @returns value: string
   */
  public static getSmallFloatWithSuffix(value: number, fixed = 1, type?: string): string {
    if (value < 0.01) {
      return value.toFixed(4);
    } else if (value < 1000) {
      return value.toFixed(2);
    } else {
      return CalculateService.getFloatWithSuffix(value, fixed, type);
    }
  }
}
