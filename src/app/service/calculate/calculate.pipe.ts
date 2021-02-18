import { Pipe, PipeTransform } from '@angular/core';
import { CalculateService } from './calculate.service';

@Pipe({
  name: 'calculate',
})
export class CalculatePipe implements PipeTransform {
  /**
   * Transform
   * @description Return changed getting from template.
   * @example
   * <span>{{100000 | calculate}}</span>
   * @returns value: string
   */
  transform(value: number, args?: any): string {
    return CalculateService.getSmallFloatWithSuffix(value, 1);
  }
}
