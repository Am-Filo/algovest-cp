import { Pipe, PipeTransform } from '@angular/core';
import { CalculateService } from './calculate.service';

@Pipe({
  name: 'calculate',
})
export class CalculatePipe implements PipeTransform {
  transform(value: number, args?: any): string {
    return CalculateService.getFloatWithSuffix(value, 1);
  }
}
