import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class CalculateService {
  public static getIntegerWithSuffix(value: number): string {
    return CalculateService.getFloatWithSuffix(value, 0);
  }

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
