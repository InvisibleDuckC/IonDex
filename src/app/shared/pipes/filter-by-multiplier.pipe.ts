import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterByMultiplier',
})
export class FilterByMultiplierPipe implements PipeTransform {
  transform(items: any[], multiplier: string): any[] {
    if (!items || !multiplier) {
      return [];
    }
    return items.filter((item) => item.multiplier === multiplier);
  }
}
